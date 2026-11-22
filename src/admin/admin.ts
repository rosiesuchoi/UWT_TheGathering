// The officer panel: sign in with a GitHub token, edit words on the page, edit
// members (with photos), the club, its nights, events and cards, and save
// everything as one commit.
//
// This file is loaded only when someone presses "Officer sign-in" (see
// main.ts), so visitors never download it. There is no server: GitHub checks
// the token, and a token without write access to the repository cannot save.
// Styles are in src/styles/admin.css.
import '../styles/admin.css';
import { cardTexts, club, events, members, videos } from '../content';
import { rebuildSiteCards } from '../content/cards';
import { refreshEvents } from '../sections/events';
import { refreshJoinRecap } from '../sections/join';
import { refreshMembers } from '../sections/members';
import { refreshNights } from '../sections/nights';
import { refreshWatch } from '../sections/video';
import { applyClubContent } from '../ui/chrome';
import { cleanHtml, MAX_TEXT, textDefaults, textOverrides } from '../ui/edits';
import { button, el } from './dom';
import { ConflictError, GitHubError, commitFiles, verifyToken, type FileChange } from './github';
import { PHOTO_DIR, markSaved, takePending } from './photos';
import { cardsPanel, clubPanel, eventsPanel, membersPanel, validateContent, videosPanel } from './panels';
import { wordsPanel } from './textpanel';

const TOKEN_KEY = 'mtguwt:admin-token';
/** Set when the page reloads itself (Discard), so the panel reopens by itself. */
export const RESUME_KEY = 'mtguwt:admin-open';
// Fine-grained token: only for people who own the repository (or whose organization does).
const FINE_TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new?name=MTG+site+editor&description=Edit+the+MTG+at+UWT+site&expires_in=90&contents=write';
// Classic token: GitHub does not let a fine-grained token reach a repository that belongs to
// another person's account, so invited officers use this one.
const CLASSIC_TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=public_repo&description=MTG+site+editor';

// ---- The token ------------------------------------------------------------

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function storeToken(token: string, remember: boolean): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // Storage blocked: the token only lives until the page closes.
  }
}
function forgetToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored that we could remove.
  }
}

// ---- What this page was built from, to tell what has changed --------------

const sortKeys = (o: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const normText = (o: Record<string, string>): string => JSON.stringify(sortKeys(o));
const pretty = (o: unknown): string => `${JSON.stringify(o, null, 2)}\n`;

let savedText: Record<string, string> = { ...textOverrides };
let snapText = normText(savedText);

const PATH_TEXT = 'src/content/text.json';

/** One JSON file of content that the panels edit in place. */
interface Doc {
  path: string;
  label: string;
  data: unknown;
  /** The content as this page was built, or as last saved. */
  snap: string;
}
const doc = (path: string, label: string, data: unknown): Doc => ({ path, label, data, snap: JSON.stringify(data) });
const clubDoc = doc('src/content/club.json', 'club and nights', club);
const membersDoc = doc('src/content/members.json', 'members', members);
const docs: Doc[] = [
  clubDoc,
  membersDoc,
  doc('src/content/events.json', 'events', events),
  doc('src/content/cards.json', 'cards', cardTexts),
  doc('src/content/videos.json', 'videos', videos),
];

/** Every edited text box as { key: html }, including saved edits that are still in place. */
function currentText(): Record<string, string> {
  const out: Record<string, string> = {};
  const seen = new Set<string>();
  document.querySelectorAll<HTMLElement>('[data-edit]').forEach((node) => {
    const key = node.dataset.edit;
    if (!key) return;
    seen.add(key);
    const html = cleanHtml(node.innerHTML);
    if (html !== textDefaults.get(key)) out[key] = html;
  });
  // Saved edits for boxes that are not on this page stay as they are.
  for (const [key, html] of Object.entries(savedText)) if (!seen.has(key)) out[key] = html;
  return out;
}

interface Diff {
  words: string[];
  /** The content files that changed. */
  docs: Doc[];
  text: Record<string, string>;
}

function diff(): Diff {
  const text = currentText();
  const keys = new Set([...Object.keys(text), ...Object.keys(savedText)]);
  const words = [...keys].filter((k) => text[k] !== savedText[k]);
  return {
    words,
    docs: docs.filter((x) => JSON.stringify(x.data) !== x.snap),
    text,
  };
}

const countOf = (d: Diff): number => d.words.length + d.docs.length;

// ---- State ----------------------------------------------------------------

let token: string | null = null;
let login = '';
let active = false;
let saving = false;

let bar: HTMLElement | null = null;
let infoEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let saveBtn: HTMLButtonElement | null = null;
let discardBtn: HTMLButtonElement | null = null;
let drawer: HTMLElement | null = null;
let drawerOwner: HTMLElement | null = null;
let signIn: HTMLDialogElement | null = null;

function say(text: string, kind: 'info' | 'ok' | 'error' = 'info', link?: { href: string; label: string }[]): void {
  if (!statusEl) return;
  statusEl.className = `adm-status adm-${kind}`;
  statusEl.replaceChildren(text);
  link?.forEach((l) => {
    const a = el('a', '', l.label);
    a.href = l.href;
    a.target = '_blank';
    a.rel = 'noopener';
    statusEl?.append(' ', a);
  });
}

function update(): void {
  const d = diff();
  const n = countOf(d);
  if (infoEl) infoEl.textContent = n === 0 ? 'No changes yet' : `${n} unsaved change${n === 1 ? '' : 's'}`;
  if (saveBtn) saveBtn.disabled = saving || n === 0;
  if (discardBtn) discardBtn.disabled = saving || n === 0;
  // The browser asks "leave this page?" while there are unsaved edits.
  window.onbeforeunload =
    n > 0
      ? (e: BeforeUnloadEvent) => {
          e.preventDefault();
          return '';
        }
      : null;
}

// ---- Showing edits on the page as they are typed --------------------------

const blurbEl = document.getElementById('clubBlurb');

function refreshBlurb(): void {
  if (!blurbEl) return;
  if (club.blurb) {
    blurbEl.textContent = club.blurb;
    blurbEl.classList.remove('owed');
  } else {
    const tag = el('span', 'tbd', 'Owed');
    blurbEl.replaceChildren(tag, ' Two or three sentences from the officers, in your own words: why the club started and who it is for.');
    blurbEl.classList.add('owed');
  }
}

let refreshTimer = 0;
/** Update every part of the page that shows club or member details, once typing pauses. */
function changed(): void {
  update();
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    applyClubContent();
    rebuildSiteCards();
    refreshNights();
    refreshJoinRecap();
    refreshBlurb();
    refreshMembers();
    refreshEvents();
    refreshWatch();
    document.title = club.pageTitle;
  }, 150);
}

// ---- Editing words --------------------------------------------------------

function insertPlain(text: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Words typed right on the page. Words inside links and buttons are edited in the panel instead. */
function textBoxes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-edit]')).filter(
    (node) => node.dataset.editIn !== 'panel' && !node.closest('a, button'),
  );
}

function onBeforeInput(e: InputEvent): void {
  // One paragraph per box, and no bold, italics or other formatting.
  if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak' || e.inputType.startsWith('format')) e.preventDefault();
}
function onPaste(e: ClipboardEvent): void {
  e.preventDefault();
  insertPlain((e.clipboardData?.getData('text/plain') ?? '').replace(/\s+/g, ' '));
  update();
}
function onDrop(e: DragEvent): void {
  e.preventDefault();
}
function onInputText(e: Event): void {
  const node = e.currentTarget as HTMLElement;
  if (node.textContent && node.textContent.length > MAX_TEXT) {
    node.textContent = node.textContent.slice(0, MAX_TEXT);
  }
  update();
}

function startTextEditing(): void {
  textBoxes().forEach((node) => {
    node.contentEditable = 'true';
    node.spellcheck = true;
    node.classList.add('adm-edit');
    node.addEventListener('beforeinput', onBeforeInput);
    node.addEventListener('paste', onPaste);
    node.addEventListener('drop', onDrop);
    node.addEventListener('input', onInputText);
  });
}

function hostOf(node: Node | null): HTMLElement | null {
  const start = node instanceof HTMLElement ? node : (node?.parentElement ?? null);
  return start?.closest<HTMLElement>('[data-edit]') ?? null;
}

/** Turn the accent colour on or off for the selected words. */
function toggleAccent(): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    say('Select some words in a heading or paragraph first, then press Accent color.');
    return;
  }
  const range = sel.getRangeAt(0);
  const host = hostOf(range.commonAncestorContainer);
  if (!host) {
    say('Select words inside a heading or paragraph that can be edited.');
    return;
  }
  // The words that are actually selected, as the text nodes they sit in.
  const selected: Text[] = [];
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (!range.intersectsNode(t)) continue;
    const from = t === range.startContainer ? range.startOffset : 0;
    const to = t === range.endContainer ? range.endOffset : t.length;
    if (t.data.slice(from, to).trim() !== '') selected.push(t);
  }
  if (selected.length === 0) {
    say('Select some words in a heading or paragraph first, then press Accent color.');
    return;
  }

  if (selected.every((t) => t.parentElement?.closest('em'))) {
    // Every selected word is colored already: take the color off those phrases.
    const phrases = new Set(selected.map((t) => t.parentElement?.closest('em')).filter((e): e is HTMLElement => !!e));
    phrases.forEach((em) => em.replaceWith(...Array.from(em.childNodes)));
    host.normalize();
  } else {
    const em = document.createElement('em');
    em.append(range.extractContents());
    em.querySelectorAll('em').forEach((inner) => inner.replaceWith(...Array.from(inner.childNodes)));
    range.insertNode(em);
    host.normalize();
    // Keep the words selected, so pressing the button again takes the color off.
    const again = document.createRange();
    again.selectNodeContents(em);
    sel.removeAllRanges();
    sel.addRange(again);
  }
  update();
}

// ---- Panels ---------------------------------------------------------------

const TABS: Array<{ id: string; label: string; build: (onChange: () => void) => HTMLElement }> = [
  { id: 'members', label: 'Members', build: membersPanel },
  { id: 'club', label: 'Club and nights', build: clubPanel },
  { id: 'events', label: 'Events', build: eventsPanel },
  { id: 'cards', label: 'Cards', build: cardsPanel },
  { id: 'videos', label: 'Videos', build: videosPanel },
  { id: 'words', label: 'Buttons and links', build: wordsPanel },
];
let lastTab = 'members';

/** One side panel with a row of sections to pick from. */
function detailsPanel(onChange: () => void): HTMLElement {
  const root = el('div');
  const tabs = el('div', 'adm-tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'What to edit');
  const body = el('div');
  const buttons = new Map<string, HTMLButtonElement>();
  const show = (id: string): void => {
    const tab = TABS.find((t) => t.id === id) ?? TABS[0]!;
    lastTab = tab.id;
    buttons.forEach((b, key) => b.setAttribute('aria-pressed', String(key === tab.id)));
    body.replaceChildren(tab.build(onChange));
  };
  TABS.forEach((t) => {
    const b = button(t.label, 'adm-tab', () => show(t.id));
    buttons.set(t.id, b);
    tabs.append(b);
  });
  root.append(tabs, body);
  show(lastTab);
  return root;
}

function closeDrawer(): void {
  if (!drawer) return;
  drawer.hidden = true;
  drawer.replaceChildren();
  const owner = drawerOwner;
  drawerOwner = null;
  owner?.setAttribute('aria-expanded', 'false');
  owner?.focus();
}

function openDrawer(title: string, build: (onChange: () => void) => HTMLElement, owner: HTMLElement): void {
  if (!drawer) return;
  if (drawerOwner === owner) {
    closeDrawer();
    return;
  }
  drawerOwner?.setAttribute('aria-expanded', 'false');
  drawerOwner = owner;
  owner.setAttribute('aria-expanded', 'true');
  const head = el('div', 'adm-head');
  const heading = el('p', 'adm-title', title);
  heading.id = 'admDrawerTitle';
  head.append(heading, button('Close', 'adm-btn adm-small', closeDrawer));
  drawer.setAttribute('aria-labelledby', heading.id);
  drawer.replaceChildren(head, build(changed));
  drawer.hidden = false;
  drawer.scrollTop = 0;
  head.querySelector('button')?.focus();
}

// ---- Saving ---------------------------------------------------------------

async function save(): Promise<void> {
  if (saving || !token) return;
  const d = diff();
  if (countOf(d) === 0) return;

  const problem = validateContent();
  if (problem) {
    say(problem, 'error');
    return;
  }
  if (d.words.some((k) => d.text[k] === '')) {
    say('A heading or paragraph was left empty. Type something in it, or press Discard.', 'error');
    return;
  }

  const files: FileChange[] = d.docs.map((x) => ({
    path: x.path,
    content: pretty(x.data),
    expected: x.snap,
    normalize: (raw: string) => JSON.stringify(JSON.parse(raw)),
  }));
  if (d.words.length > 0) {
    files.push({
      path: PATH_TEXT,
      content: pretty(sortKeys(d.text)),
      expected: snapText,
      normalize: (raw) => normText(JSON.parse(raw) as Record<string, string>),
    });
  }

  saving = true;
  update();
  say('Saving to GitHub…');
  try {
    // Pictures picked for members go up as new files, in the same commit.
    let photoNames: string[] = [];
    if (d.docs.includes(membersDoc)) {
      const photos = await takePending(new Set(members.flatMap((m) => (m.photo ? [m.photo] : []))));
      photoNames = photos.map((p) => p.name);
      photos.forEach((p) => files.push({ path: `${PHOTO_DIR}${p.name}`, base64: p.base64 }));
    }
    const parts: string[] = [];
    if (d.words.length > 0) parts.push(`${d.words.length} text edit${d.words.length === 1 ? '' : 's'}`);
    d.docs.forEach((x) => parts.push(x.label));
    if (photoNames.length > 0) parts.push(`${photoNames.length} photo${photoNames.length === 1 ? '' : 's'}`);
    const message = `Edit site content: ${parts.join(', ')}\n\nSaved from the officer panel by ${login}.`;

    const commit = await commitFiles(token, files, message);
    d.docs.forEach((x) => {
      x.snap = JSON.stringify(x.data);
    });
    markSaved(photoNames);
    savedText = d.text;
    snapText = normText(savedText);
    saving = false;
    update();
    say(`Saved as commit ${commit.sha.slice(0, 7)}. The public site updates in about a minute.`, 'ok', [
      { href: commit.url, label: 'See the commit' },
      { href: `https://github.com/${club.repo}/actions`, label: 'Watch it publish' },
    ]);
  } catch (e) {
    saving = false;
    update();
    if (e instanceof ConflictError || e instanceof GitHubError) say(e.message, 'error');
    else say('Something went wrong while saving. Your edits are still here; try again.', 'error');
    // A token that stopped working is no use again.
    if (e instanceof GitHubError && e.status === 401) forgetToken();
  }
}

function discard(): void {
  const n = countOf(diff());
  if (n === 0) return;
  if (!window.confirm(`Throw away ${n} unsaved change${n === 1 ? '' : 's'}? The page reloads.`)) return;
  window.onbeforeunload = null;
  try {
    sessionStorage.setItem(RESUME_KEY, '1');
  } catch {
    // The page reloads to the normal site and the officer presses sign-in again.
  }
  location.reload();
}

function signOut(): void {
  const n = countOf(diff());
  if (n > 0 && !window.confirm(`Sign out and lose ${n} unsaved change${n === 1 ? '' : 's'}?`)) return;
  forgetToken();
  window.onbeforeunload = null;
  location.reload();
}

// ---- The toolbar ----------------------------------------------------------

function enterEditMode(): void {
  active = true;
  document.body.classList.add('admin-on');
  startTextEditing();

  bar = el('div', 'adm-bar');
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Officer editing');
  const who = el('p', 'adm-who');
  who.append(el('b', '', 'Editing'), ` as ${login} · `);
  infoEl = el('span', '', 'No changes yet');
  who.append(infoEl);

  const actions = el('div', 'adm-actions');
  const detailsBtn = button('Edit details', 'adm-btn', () => openDrawer('Edit details', detailsPanel, detailsBtn));
  detailsBtn.setAttribute('aria-expanded', 'false');
  detailsBtn.title = 'Members and photos, club details, nights, events, cards, buttons and links';
  const accent = button('Accent color', 'adm-btn', toggleAccent);
  // Pressing it must not take the selection away from the words.
  accent.addEventListener('mousedown', (e) => e.preventDefault());
  accent.title = 'Select words in a heading, then press this to color them (or uncolor them)';
  saveBtn = button('Save changes', 'adm-btn adm-primary', () => void save());
  discardBtn = button('Discard', 'adm-btn', discard);
  actions.append(detailsBtn, accent, saveBtn, discardBtn, button('Sign out', 'adm-btn', signOut));

  statusEl = el('p', 'adm-status');
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
  bar.append(who, actions, statusEl);

  drawer = el('aside', 'adm-drawer');
  drawer.setAttribute('role', 'dialog');
  drawer.dataset.lenisPrevent = '';
  drawer.hidden = true;

  document.body.append(drawer, bar);
  // The bar can wrap onto more lines on a phone; the page and the side panel keep clear of it.
  const barEl = bar;
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--adm-bar-h', `${barEl.offsetHeight}px`);
  }).observe(barEl);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
  });
  say('Click or tap any heading or paragraph to edit it. Press Edit details for everything else.');
  update();
}

// ---- Signing in -----------------------------------------------------------

function buildSignIn(): HTMLDialogElement {
  const dlg = el('dialog', 'adm-dialog');
  dlg.dataset.lenisPrevent = '';
  dlg.setAttribute('aria-labelledby', 'admSignTitle');

  const form = el('form', 'adm-form');
  form.method = 'dialog';
  const title = el('p', 'adm-title', 'Officer sign-in');
  title.id = 'admSignTitle';

  const repoName = club.repo.split('/')[1] ?? club.repo;
  const newTab = (href: string, text: string): HTMLAnchorElement => {
    const a = el('a', '', text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  };

  // Most officers are invited to the repository, and GitHub only lets a classic
  // token reach a repository that belongs to someone else's account.
  const invited = el('details', 'adm-way');
  invited.open = true;
  invited.append(el('summary', '', 'I was invited to the repository (most officers)'));
  const invitedSteps = el('ol', 'adm-steps');
  const i1 = el('li');
  i1.append('Accept the invitation to ', el('b', '', club.repo), ' that GitHub emailed you. If you cannot find it, ask the person who runs the club site to send it again.');
  const i2 = el('li');
  i2.append(newTab(CLASSIC_TOKEN_URL, 'Open the GitHub token page'), ' and sign in if it asks. Set ', el('b', '', 'Expiration'), ' to 90 days and leave ', el('b', '', 'public_repo'), ' ticked. Press Generate token.');
  invitedSteps.append(i1, i2, el('li', '', 'Copy the token that GitHub shows once and paste it below.'));
  invited.append(invitedSteps, el('p', 'adm-hint', 'This kind of token can change any public repository you can write to, so keep it private, use the shortest expiry that suits you, and delete it at github.com/settings/tokens when you are done.'));

  const owner = el('details', 'adm-way');
  owner.append(el('summary', '', 'I own the repository, or it belongs to my organization'));
  const ownerSteps = el('ol', 'adm-steps');
  const o1 = el('li');
  o1.append(newTab(FINE_TOKEN_URL, 'Open the GitHub token page'), ' and sign in if it asks.');
  const o2 = el('li');
  o2.append('Choose ', el('b', '', 'Only select repositories'), ' and pick ', el('b', '', repoName), '. Under Permissions open Repository permissions and set ', el('b', '', 'Contents'), ' to ', el('b', '', 'Read and write'), '. Press Generate token.');
  ownerSteps.append(o1, o2, el('li', '', 'Copy the token that GitHub shows once and paste it below.'));
  owner.append(ownerSteps, el('p', 'adm-hint', 'This kind of token can only touch this one repository, so it is the safer choice when it is available.'));

  const label = el('label', '', 'GitHub token');
  label.htmlFor = 'admToken';
  const input = el('input', 'adm-input');
  input.id = 'admToken';
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.required = true;
  input.placeholder = 'Paste the token here';

  const remember = el('label', 'adm-check');
  const rememberBox = el('input');
  rememberBox.type = 'checkbox';
  remember.append(rememberBox, 'Keep me signed in on this device');

  const status = el('p', 'adm-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const row = el('div', 'adm-tools');
  const go = el('button', 'adm-btn adm-primary', 'Sign in');
  go.type = 'submit';
  const cancel = button('Cancel', 'adm-btn', () => dlg.close());
  row.append(go, cancel);

  form.append(
    title,
    el(
      'p',
      'adm-note',
      'Only people who can change the club\'s GitHub repository can edit the site. There is no password here: you sign in with a GitHub token, and GitHub checks it.',
    ),
    invited,
    owner,
    label,
    input,
    remember,
    el('p', 'adm-hint', 'The token stays in this browser and is sent only to GitHub. Anyone who has it can change the site, so never share it or post it. It stops working on the expiry date you chose.'),
    status,
    row,
  );
  dlg.append(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    go.disabled = true;
    status.className = 'adm-status';
    status.textContent = 'Checking with GitHub…';
    verifyToken(value)
      .then((name) => {
        token = value;
        login = name;
        storeToken(value, rememberBox.checked);
        input.value = '';
        dlg.close();
        enterEditMode();
      })
      .catch((err: unknown) => {
        go.disabled = false;
        status.className = 'adm-status adm-error';
        status.textContent = err instanceof GitHubError ? err.message : 'Could not sign in. Try again.';
        input.focus();
      });
  });
  dlg.addEventListener('close', () => {
    input.value = '';
  });
  return dlg;
}

/** Called by the footer button, and by the page after Discard. */
export async function openAdmin(): Promise<void> {
  if (active) {
    saveBtn?.focus();
    return;
  }
  const stored = readToken();
  if (stored) {
    try {
      login = await verifyToken(stored);
      token = stored;
      enterEditMode();
      return;
    } catch (e) {
      // A saved token that no longer works is dropped; fall through to sign-in.
      if (e instanceof GitHubError && (e.status === 401 || e.status === 403 || e.status === 404)) forgetToken();
    }
  }
  signIn ??= buildSignIn();
  if (!signIn.isConnected) document.body.append(signIn);
  signIn.showModal();
  signIn.querySelector('input')?.focus();
}
