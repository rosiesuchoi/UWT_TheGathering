// Members section: a binder of member cards, built from members.json, with
// pages that turn when dragged. Styles are in src/styles/members.css.
//
// How a page turns. At rest a page is a plain grid of pockets, in reading
// order. For the length of a turn its pockets are moved into column strips
// that are nested inside each other (see layFolded), so each column can hinge
// on the one before it and the page bends like a plastic sleeve page instead
// of swinging like a door. This file only sets numbers as CSS variables
// (--a on a fold, --sh on a strip, --under on the stage); members.css decides
// what they do.
import { members, type CardColor, type Member } from '../content';
import { gsap, reducedMotion } from '../core/scroll';
import { createCard, type CardData, type CardTone } from '../ui/card';
import { attachTilt } from '../ui/tilt';
import { onVisitorName, visitorName } from '../ui/visitor';

const ROWS = 3;
const PLACEHOLDER_COUNT = 8;
const CYCLE: CardColor[] = ['chalk', 'tide', 'dusk', 'ember', 'grove'];
/** Under this width a page is two pockets wide, not three. Matches members.css. */
const NARROW = '(max-width: 560px)';

/** A fully turned page stands just past edge-on to the viewer, so it is out of sight. */
const HINGE_END = -92;
/** How far each outer column bends beyond the one before it, mid-turn. */
const BEND = -18;
/** Pointer travel, in pixels, before a press counts as a drag. */
const SLOP = 8;

interface Sheet {
  el: HTMLElement;
  pockets: HTMLElement[];
  folds: HTMLElement[];
  strips: HTMLElement[];
}

interface Turn {
  /** The page that moves. */
  sheet: Sheet;
  /** The page lying under it. */
  under: Sheet;
  /** 1 turns to the next page, -1 brings the previous page back. */
  dir: 1 | -1;
  /** 0 = lying flat, 1 = turned away. */
  p: number;
  tween: gsap.core.Tween | null;
}

let binder: HTMLElement | null = null;
let stage: HTMLElement | null = null;
let prevBtn: HTMLButtonElement | null = null;
let nextBtn: HTMLButtonElement | null = null;
let countLabel: HTMLElement | null = null;
let cols = 3;
let sheets: Sheet[] = [];
let current = 0;
let turn: Turn | null = null;

const div = (className: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = className;
  return el;
};

const number = (i: number): string => `#${String(i + 1).padStart(2, '0')}`;

function memberCard(member: Member, index: number): CardData {
  // A card takes the first color of the member's favorite commander. With no
  // colors given it gets the club's gold.
  const tone: CardTone = member.colors[0] ?? 'gold';
  return {
    name: member.name,
    type: member.role,
    text: member.commander ? `Favorite commander: ${member.commander}` : 'Favorite commander: to be announced.',
    number: number(index),
    tone,
    glyph: 'person',
    image: member.photo ? `${import.meta.env.BASE_URL}members/${member.photo}` : undefined,
    foil: true,
  };
}

function placeholderCard(index: number): CardData {
  return {
    name: 'Member name',
    type: 'Role',
    text: 'Favorite commander goes here.',
    number: number(index),
    tone: CYCLE[index % CYCLE.length]!,
    glyph: 'person',
    foil: true,
  };
}

/** For commanders of several colors, the pip shows each one as a slice. */
function pipFor(colors: CardColor[]): string | null {
  if (colors.length < 2) return null;
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `var(--${c}) ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `conic-gradient(${stops.join(', ')})`;
}

function pocket(data: CardData, colors: CardColor[] = []): HTMLElement {
  const wrap = div('pocket');
  const card = createCard(data);
  const pip = pipFor(colors);
  if (pip) card.style.setProperty('--pip', pip);
  attachTilt(card);
  wrap.append(card);
  return wrap;
}

/** The visitor's own card, once they have signed it in the join section. */
function visitorPocket(name: string): HTMLElement {
  const wrap = pocket({
    name,
    type: 'Member',
    text: 'New at the table.',
    number: '100/100',
    tone: 'foil',
    glyph: 'person',
    foil: true,
  });
  wrap.classList.add('mine');
  return wrap;
}

/** Until then, the pocket after the last member is left open for them. */
function openPocket(): HTMLElement {
  const link = document.createElement('a');
  link.className = 'pocket slotcard';
  link.href = '#join';
  link.draggable = false;
  const title = document.createElement('b');
  title.textContent = 'Open pocket';
  const text = document.createElement('span');
  text.textContent = 'Your card goes here.';
  link.append(title, text);
  return link;
}

function emptyPocket(note?: string): HTMLElement {
  const wrap = div('pocket empty');
  if (note) {
    const scrib = document.createElement('span');
    scrib.className = 'b-scrib';
    scrib.textContent = note;
    wrap.append(scrib);
  }
  return wrap;
}

/** Every pocket that holds something, in binder order. */
function filledPockets(): HTMLElement[] {
  const list =
    members.length > 0
      ? members.map((m, i) => pocket(memberCard(m, i), m.colors))
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => pocket(placeholderCard(i)));
  const me = visitorName();
  list.push(me ? visitorPocket(me) : openPocket());
  return list;
}

/** Pockets back into a plain grid, in reading order. */
function layFlat(sheet: Sheet): void {
  sheet.el.classList.remove('is-folded');
  sheet.el.style.removeProperty('--colw');
  sheet.el.replaceChildren(...sheet.pockets);
  sheet.folds = [];
  sheet.strips = [];
}

/**
 * Pockets into column strips, each strip's fold nested inside the fold of
 * the column before it:  fold0 [ strip0, fold1 [ strip1, fold2 [ strip2 ] ] ]
 */
function layFolded(sheet: Sheet): void {
  const first = sheet.pockets[0];
  if (!first) return;
  sheet.el.style.setProperty('--colw', `${first.getBoundingClientRect().width}px`);
  const strips = Array.from({ length: cols }, () => div('b-strip'));
  sheet.pockets.forEach((p, k) => strips[k % cols]?.append(p));
  const folds: HTMLElement[] = [];
  let inner: HTMLElement | null = null;
  for (let c = cols - 1; c >= 0; c--) {
    const fold = div('b-fold');
    fold.append(strips[c]!);
    if (inner) fold.append(inner);
    folds[c] = fold;
    inner = fold;
  }
  sheet.folds = folds;
  sheet.strips = strips;
  if (inner) sheet.el.replaceChildren(inner);
  sheet.el.classList.add('is-folded');
}

/** Angle of the hinge column, and the extra bend of each column after it, at progress p. */
function angles(p: number): { hinge: number; bend: number } {
  return {
    hinge: HINGE_END * Math.pow(p, 1.5),
    // The outer columns lead: they curl up first and flatten out again at the end.
    bend: BEND * Math.sin(Math.PI * p) * (cols === 2 ? 1.5 : 1),
  };
}

/**
 * Where the page's free edge is at progress p, as a share of the page width
 * measured from the rings: 1 lying flat, about 0 turned away. Each column
 * reaches as far as the cosine of its own angle.
 */
function edgeAt(p: number): number {
  const { hinge, bend } = angles(p);
  let reach = 0;
  for (let c = 0; c < cols; c++) reach += Math.cos(((hinge + bend * c) * Math.PI) / 180);
  return reach / cols;
}

/** The progress that puts the free edge at `share`. edgeAt only ever falls as p rises, so halving finds it. */
function progressFor(share: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (edgeAt(mid) > share) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Pose the turning page for turn.p. */
function pose(t: Turn): void {
  const { hinge, bend } = angles(t.p);
  let total = 0;
  t.sheet.folds.forEach((fold, c) => {
    const angle = c === 0 ? hinge : bend;
    total += angle;
    fold.style.setProperty('--a', angle.toFixed(2));
    // A column darkens as it turns away from the light.
    const shade = Math.min(1, Math.abs(total) / 92) * 0.42;
    t.sheet.strips[c]?.style.setProperty('--sh', shade.toFixed(3));
  });
  // The lifted page throws a shadow on the page beneath it.
  stage?.style.setProperty('--under', ((1 - t.p) * Math.min(1, t.p * 5)).toFixed(3));
}

/** Show the right page and keep the others out of reach of keyboard and screen readers. */
function sync(): void {
  sheets.forEach((s, i) => {
    s.el.classList.toggle('is-current', i === current);
    s.el.inert = i !== current;
  });
  if (countLabel) countLabel.textContent = `Page ${current + 1} of ${sheets.length}`;
  if (prevBtn && nextBtn) {
    const atStart = current === 0;
    const atEnd = current === sheets.length - 1;
    // A button about to be switched off hands its focus to the other one.
    if (atStart && document.activeElement === prevBtn) nextBtn.focus();
    if (atEnd && document.activeElement === nextBtn) prevBtn.focus();
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
  }
}

/**
 * Pages are two or three pockets wide, to match the stylesheet. Checked
 * before every turn as well as on the media query's own change event, which
 * a browser can deliver late when the page is not being drawn.
 */
function matchLayout(): void {
  const want = window.matchMedia(NARROW).matches ? 2 : 3;
  if (want === cols || turn) return;
  cols = want;
  binder?.classList.add('settled');
  render();
}

/** Lift a page, ready to be posed. Null if there is no page that way. */
function begin(dir: 1 | -1): Turn | null {
  if (turn) return null;
  matchLayout();
  const index = dir === 1 ? current : current - 1;
  const sheet = sheets[index];
  const under = sheets[index + 1];
  if (!sheet || !under) return null;
  // Moving pockets would replay their arrival animation; switch it off first.
  binder?.classList.add('settled');
  layFolded(sheet);
  sheet.el.classList.add('is-turning');
  under.el.classList.add('is-under');
  turn = { sheet, under, dir, p: dir === 1 ? 0 : 1, tween: null };
  pose(turn);
  return turn;
}

function finish(t: Turn, target: 0 | 1): void {
  layFlat(t.sheet);
  t.sheet.el.classList.remove('is-turning');
  t.under.el.classList.remove('is-under');
  stage?.style.removeProperty('--under');
  if (t.dir === 1 && target === 1) current += 1;
  if (t.dir === -1 && target === 0) current -= 1;
  turn = null;
  sync();
}

/** Let go of the page: it falls to lying flat (0) or turned away (1). */
function settle(t: Turn, target: 0 | 1, seconds?: number): void {
  const distance = Math.abs(target - t.p);
  t.tween = gsap.to(t, {
    p: target,
    duration: seconds ?? 0.22 + 0.5 * distance,
    ease: seconds ? 'power2.inOut' : 'power2.out',
    onUpdate: () => pose(t),
    onComplete: () => finish(t, target),
  });
}

/** Turn one page, as the buttons do. */
function go(dir: 1 | -1): void {
  if (reducedMotion) {
    matchLayout();
    const next = current + dir;
    if (next < 0 || next >= sheets.length) return;
    current = next;
    sync();
    return;
  }
  const t = begin(dir);
  if (t) settle(t, dir === 1 ? 1 : 0, 0.85);
}

/** Dragging: the page's free edge follows the pointer. */
function initDrag(el: HTMLElement): void {
  let press: { id: number; x: number; y: number; lastX: number; lastT: number; speed: number; active: boolean } | null = null;

  /** Pointer travel to turn progress, so the page edge stays under the pointer. */
  const progress = (t: Turn, dx: number): number => {
    const width = el.getBoundingClientRect().width || 1;
    // Turning on: the edge starts at the far side and comes in with the pointer.
    // Turning back: it starts at the rings and goes out with the pointer.
    const travel = Math.min(width, Math.max(0, Math.abs(dx) - SLOP)) / width;
    return progressFor(t.dir === 1 ? 1 - travel : travel);
  };

  const release = (): void => {
    if (!press) return;
    const { active, speed, id } = press;
    press = null;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
    if (!active || !turn || turn.tween) return;
    // Pulled more than a quarter of the way across, or flicked: the page goes
    // where it was heading. Otherwise it falls back to where it started.
    const t = turn;
    const flick = Math.abs(speed) > 0.45;
    const edge = edgeAt(t.p);
    let target: 0 | 1;
    if (t.dir === 1) target = edge < 0.75 || (flick && speed < 0) ? 1 : 0;
    else target = edge > 0.25 || (flick && speed > 0) ? 0 : 1;
    settle(t, target);
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (turn) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: e.timeStamp, speed: 0, active: false };
  });

  el.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!press.active) {
      if (Math.abs(dx) < SLOP) return;
      // Mostly up or down: the visitor is scrolling, not turning a page.
      if (Math.abs(dy) > Math.abs(dx)) {
        press = null;
        return;
      }
      const dir = dx < 0 ? 1 : -1;
      if (reducedMotion) {
        press = null;
        go(dir);
        return;
      }
      if (!begin(dir)) {
        press = null;
        return;
      }
      press.active = true;
      try {
        // Keeps the drag alive when the pointer leaves the binder.
        el.setPointerCapture(press.id);
      } catch {
        // Not every pointer can be captured. The drag still works inside the binder.
      }
      el.classList.add('is-dragging');
    }
    const dt = e.timeStamp - press.lastT;
    if (dt > 0) press.speed = (e.clientX - press.lastX) / dt;
    press.lastX = e.clientX;
    press.lastT = e.timeStamp;
    if (turn && !turn.tween) {
      turn.p = progress(turn, dx);
      pose(turn);
    }
  });

  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  // A drag that started on a link must not also follow the link.
  el.addEventListener(
    'click',
    (e) => {
      if (turn) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
}

/** Build the pages. Runs again when the visitor signs their card or the layout changes. */
function render(): void {
  if (!stage) return;
  if (turn) {
    turn.tween?.kill();
    turn = null;
    stage.style.removeProperty('--under');
  }
  const filled = filledPockets();
  const perPage = cols * ROWS;
  // Always at least one page of spare sleeves, so there is a page to turn to.
  const pageCount = Math.max(2, Math.ceil(filled.length / perPage));
  sheets = Array.from({ length: pageCount }, (_, s) => {
    const pockets = filled.slice(s * perPage, (s + 1) * perPage);
    const blankPage = pockets.length === 0;
    while (pockets.length < perPage) {
      const middle = pockets.length === Math.floor((perPage - 1) / 2);
      pockets.push(emptyPocket(blankPage && middle ? 'room for more players' : undefined));
    }
    pockets.forEach((p, i) => p.style.setProperty('--i', String(i)));
    const el = div('b-sheet');
    el.append(...pockets);
    return { el, pockets, folds: [], strips: [] };
  });
  current = Math.min(current, sheets.length - 1);
  stage.replaceChildren(...sheets.map((s) => s.el));
  sync();
}

export function initMembers(): void {
  binder = document.getElementById('binder');
  if (!binder) return;

  stage = div('b-stage');
  const nav = div('b-nav');
  prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'b-btn';
  prevBtn.textContent = 'Page back';
  nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'b-btn';
  nextBtn.textContent = 'Next page';
  countLabel = document.createElement('span');
  countLabel.className = 'b-count';
  countLabel.setAttribute('aria-live', 'polite');
  const hint = document.createElement('span');
  hint.className = 'b-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'or drag a page';
  nav.append(prevBtn, countLabel, nextBtn, hint);
  binder.replaceChildren(stage, nav);

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  initDrag(stage);

  const narrow = window.matchMedia(NARROW);
  cols = narrow.matches ? 2 : 3;
  render();
  narrow.addEventListener('change', matchLayout);

  // When the visitor signs their card, it drops into the open pocket.
  onVisitorName((name) => {
    binder?.classList.add('settled');
    current = 0;
    render();
    if (name) stage?.querySelector('.pocket.mine')?.classList.add('just-in');
  });

  // The note under the heading says what is still owed.
  const note = document.getElementById('membersNote');
  if (note && members.length > 0) {
    if (members.every((m) => m.commander)) {
      note.remove();
    } else {
      const tag = document.createElement('span');
      tag.className = 'tbd';
      tag.textContent = 'Owed';
      note.replaceChildren(tag, ' Favorite commanders and photos are still to come.');
    }
  }
}
