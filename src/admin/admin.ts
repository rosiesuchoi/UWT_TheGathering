// The officer panel: sign in with a GitHub token, edit words on the page, edit
// members and the club's nights, and save everything as one commit.
//
// This file is loaded only when someone presses "Officer sign-in" (see
// main.ts), so visitors never download it. There is no server: GitHub checks
// the token, and a token without write access to the repository cannot save.
// Styles are in src/styles/admin.css.
import '../styles/admin.css';
import { club, members } from '../content';
import { rebuildSiteCards } from '../content/cards';
import { refreshJoinRecap } from '../sections/join';
import { refreshMembers } from '../sections/members';
import { refreshNights } from '../sections/nights';
import { applyClubContent } from '../ui/chrome';
import { cleanHtml, MAX_TEXT, textDefaults, textOverrides } from '../ui/edits';
import { button, el } from './dom';
import { ConflictError, GitHubError, commitFiles, verifyToken, type FileChange } from './github';
import { clubPanel, membersPanel, validateContent } from './panels';

const TOKEN_KEY = 'mtguwt:admin-token';
/** Set when the page reloads itself (Discard), so the panel reopens by itself. */
export const RESUME_KEY = 'mtguwt:admin-open';
const TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new?name=MTG+site+editor&description=Edit+the+MTG+at+UWT+site&expires_in=90&contents=write';

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

let snapClub = JSON.stringify(club);
let snapMembers = JSON.stringify(members);
let savedText: Record<string, string> = { ...textOverrides };
let snapText = normText(savedText);

const PATH_CLUB = 'src/content/club.json';
const PATH_MEMBERS = 'src/content/members.json';
const PATH_TEXT = 'src/content/text.json';

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
  members: boolean;
  club: boolean;
  text: Record<string, string>;
}

function diff(): Diff {
  const text = currentText();
  const keys = new Set([...Object.keys(text), ...Object.keys(savedText)]);
  const words = [...keys].filter((k) => text[k] !== savedText[k]);
  return {
    words,
    members: JSON.stringify(members) !== snapMembers,
    club: JSON.stringify(club) !== snapClub,
    text,
  };
}

const countOf = (d: Diff): number => d.words.length + (d.members ? 1 : 0) + (d.club ? 1 : 0);

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

function textBoxes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-edit]'));
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

  const files: FileChange[] = [];
  if (d.club) {
    files.push({ path: PATH_CLUB, content: pretty(club), expected: snapClub, normalize: (raw) => JSON.stringify(JSON.parse(raw)) });
  }
  if (d.members) {
    files.push({ path: PATH_MEMBERS, content: pretty(members), expected: snapMembers, normalize: (raw) => JSON.stringify(JSON.parse(raw)) });
  }
  if (d.words.length > 0) {
    files.push({
      path: PATH_TEXT,
      content: pretty(sortKeys(d.text)),
      expected: snapText,
      normalize: (raw) => normText(JSON.parse(raw) as Record<string, string>),
    });
  }

  const parts: string[] = [];
  if (d.words.length > 0) parts.push(`${d.words.length} text edit${d.words.length === 1 ? '' : 's'}`);
  if (d.members) parts.push('members');
  if (d.club) parts.push('club and nights');
  const message = `Edit site content: ${parts.join(', ')}\n\nSaved from the officer panel by ${login}.`;

  saving = true;
  update();
  say('Saving to GitHub…');
  try {
    const commit = await commitFiles(token, files, message);
    snapClub = JSON.stringify(club);
    snapMembers = JSON.stringify(members);
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
  const membersBtn = button('Members', 'adm-btn', () => openDrawer('Members', membersPanel, membersBtn));
  const clubBtn = button('Club and nights', 'adm-btn', () => openDrawer('Club and nights', clubPanel, clubBtn));
  membersBtn.setAttribute('aria-expanded', 'false');
  clubBtn.setAttribute('aria-expanded', 'false');
  const accent = button('Accent color', 'adm-btn', toggleAccent);
  // Pressing it must not take the selection away from the words.
  accent.addEventListener('mousedown', (e) => e.preventDefault());
  accent.title = 'Select words in a heading, then press this to color them (or uncolor them)';
  saveBtn = button('Save changes', 'adm-btn adm-primary', () => void save());
  discardBtn = button('Discard', 'adm-btn', discard);
  actions.append(membersBtn, clubBtn, accent, saveBtn, discardBtn, button('Sign out', 'adm-btn', signOut));

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
  say('Click or tap any heading or paragraph to edit it.');
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

  const steps = el('ol', 'adm-steps');
  const s1 = el('li');
  const link = el('a', '', 'Open the GitHub token page');
  link.href = TOKEN_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  s1.append(link, ' and sign in to GitHub if it asks.');
  const s2 = el('li');
  s2.append(
    'Choose ',
    el('b', '', 'Only select repositories'),
    ' and pick ',
    el('b', '', club.repo.split('/')[1] ?? club.repo),
    '. Under Permissions open Repository permissions and set ',
    el('b', '', 'Contents'),
    ' to ',
    el('b', '', 'Read and write'),
    '. Press Generate token.',
  );
  const s3 = el('li', '', 'Copy the token that GitHub shows once and paste it below.');
  steps.append(s1, s2, s3);

  const label = el('label', '', 'GitHub token');
  label.htmlFor = 'admToken';
  const input = el('input', 'adm-input');
  input.id = 'admToken';
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.required = true;
  input.placeholder = 'github_pat_…';

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
    steps,
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
