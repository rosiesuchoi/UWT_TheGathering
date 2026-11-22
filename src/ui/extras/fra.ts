// Reality Fracture extras: a portal opening when the visitor picks the theme,
// and, while it is on, rifts into the original site, Jace Beleren, and some
// hidden alternate-reality eggs. Loaded only with the theme (src/ui/themes.ts).
// Styles, including the new Fractured look, are in src/styles/fra.css.
//
// The opening: a fractured portal opens in the middle of the screen, the real
// page is spun into it (wide screens), the theme changes while the page is gone,
// and the page is pushed back out in its new design. Any click or key skips it.
//
// The eggs, one at a time, every 35 to 80 seconds while the tab is visible and
// nobody is editing:
//   rift  a jagged window opens onto a copy of the ORIGINAL site (the club's own
//         look), then stitches itself shut
//   jace  Jace Beleren (our own hooded silhouette, not official art) pops in at a
//         screen edge, says something, and pops out
//   alt   a heading flickers into an alternate-reality line
// Hidden ones: the Konami code turns the colors inside out for a moment, and
// pressing the club mark in the nav three times calls Jace.
// Test switch: ?set=fra&egg=rift (or jace, alt, mirror) a moment after load.
import '../../styles/fra.css';
import type { Extras } from '../themes';

const div = (className: string, html = ''): HTMLDivElement => {
  const node = document.createElement('div');
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = html;
  return node;
};

/** The page's own colors turned inside out, for the Konami egg. */
const html = document.documentElement;

// ---- The opening ------------------------------------------------------------

const SAFETY_MS = 7000;
let introActive = false;

function intro(reveal: () => void): { done: Promise<void>; skip: () => void } {
  const wide = window.matchMedia('(min-width: 701px)').matches;
  const root = div('fra-intro', '<div class="fra-portal"><div class="fra-ring"></div><div class="fra-ring r2"></div><div class="fra-core"></div><div class="fra-cracks"></div></div><div class="fra-flash"></div>');
  const parts = Array.from(document.querySelectorAll<HTMLElement>('main, .nav, .foot'));
  const main = document.querySelector<HTMLElement>('main');
  const portal = root.querySelector<HTMLElement>('.fra-portal')!;
  // The page must not scroll while it is being pulled in: the pivot is the middle of the screen as it is now.
  const hold = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
  };
  root.addEventListener('wheel', hold, { passive: false });
  root.addEventListener('touchmove', hold, { passive: false });
  document.body.append(root);
  introActive = true;

  const timers: number[] = [];
  let phase: 'open' | 'pull' | 'push' = 'open';
  let revealed = false;
  let ended = false;
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));

  const doReveal = (): void => {
    if (revealed) return;
    revealed = true;
    reveal();
  };
  const setOrigins = (): void =>
    parts.forEach((el) => el.style.setProperty('--oy', `${window.innerHeight / 2 - el.getBoundingClientRect().top}px`));
  const clearPage = (): void => {
    html.classList.remove('fra-suck', 'fra-push');
    parts.forEach((el) => el.style.removeProperty('--oy'));
  };
  const end = (): void => {
    if (ended) return;
    ended = true;
    timers.forEach((t) => window.clearTimeout(t));
    document.removeEventListener('keydown', skip);
    main?.removeEventListener('animationend', onPage);
    clearPage();
    doReveal();
    root.remove();
    introActive = false;
    finish();
  };
  const closeOut = (): void => {
    root.classList.add('is-out');
    timers.push(window.setTimeout(end, 320));
  };

  /** The portal is open: pull the page in. */
  const startPull = (): void => {
    if (phase !== 'open') return;
    phase = 'pull';
    root.classList.add('is-pulling');
    if (wide) {
      setOrigins();
      html.classList.add('fra-suck');
    } else {
      timers.push(window.setTimeout(afterPull, 550)); // phones: no spinning page, just the portal
    }
  };
  /** The page is gone: change the theme, then push the new page out. */
  const afterPull = (): void => {
    if (phase !== 'pull') return;
    phase = 'push';
    html.classList.remove('fra-suck');
    doReveal();
    root.classList.remove('is-pulling');
    root.classList.add('is-closing');
    if (wide) {
      setOrigins();
      html.classList.add('fra-push');
    }
  };
  function onPage(e: AnimationEvent): void {
    if (e.target !== main) return;
    if (e.animationName === 'fra-suck') afterPull();
    else if (e.animationName === 'fra-push') {
      clearPage();
      closeOut();
    }
  }
  function skip(): void {
    if (ended) return;
    timers.forEach((t) => window.clearTimeout(t));
    timers.length = 0;
    phase = 'push';
    clearPage();
    doReveal();
    root.classList.add('is-out');
    timers.push(window.setTimeout(end, 320));
  }

  portal.addEventListener('animationend', (e) => {
    if (e.target !== portal) return;
    if (e.animationName === 'fra-open') startPull();
    else if (e.animationName === 'fra-close' && !wide) closeOut();
  });
  main?.addEventListener('animationend', onPage);
  root.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip);
  // If the animations never run (a hidden tab), the page still ends up revealed and clean.
  timers.push(window.setTimeout(skip, SAFETY_MS));
  return { done, skip };
}

// ---- Eggs -------------------------------------------------------------------

type Egg = 'rift' | 'jace' | 'alt' | 'mirror';
let busy = false;

/** Mark the screen busy for a while, so eggs never overlap. */
function hold(ms: number): void {
  busy = true;
  window.setTimeout(() => (busy = false), ms);
}

/** Jace, drawn as our own hooded silhouette. Not official art. */
const JACE = `<svg viewBox="0 0 160 260" aria-hidden="true">
  <defs>
    <linearGradient id="fraCloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c55c8"/><stop offset=".6" stop-color="#1a3592"/><stop offset="1" stop-color="#0d1c5a"/></linearGradient>
    <radialGradient id="fraOrb"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#9fe8ff"/><stop offset="1" stop-color="#3b82ff" stop-opacity="0"/></radialGradient>
  </defs>
  <path d="M80 14 C50 14 38 46 42 74 C28 112 14 192 6 252 L154 252 C146 192 132 112 118 74 C122 46 110 14 80 14Z" fill="url(#fraCloak)"/>
  <path d="M80 14 C62 16 52 30 50 48 C60 38 70 34 80 34 C90 34 100 38 110 48 C108 30 98 16 80 14Z" fill="#4b78ea" opacity=".6"/>
  <ellipse cx="80" cy="64" rx="23" ry="27" fill="#030c24"/>
  <ellipse cx="71" cy="62" rx="4" ry="2.6" fill="#a8eeff"/><ellipse cx="89" cy="62" rx="4" ry="2.6" fill="#a8eeff"/>
  <path d="M116 100 C134 94 144 86 147 72 L154 76 C153 96 136 114 118 124Z" fill="#14297a"/>
  <circle cx="150" cy="62" r="17" fill="url(#fraOrb)"/>
  <path d="M80 118 L80 240" stroke="#7fb8ff" stroke-width="1.4" opacity=".4"/>
  <path d="M52 170 C62 160 70 160 80 170 C90 160 98 160 108 170" fill="none" stroke="#7fb8ff" stroke-width="1.4" opacity=".4"/>
  <path d="M40 200 L120 200" stroke="#7fb8ff" stroke-width="1.2" opacity=".3"/>
</svg>`;

const JACE_LINES = [
  'This reality has a crack in it. Hm.',
  "Don't mind me. Just checking which of you is the real one.",
  'Rifts are my specialty. Mostly I just walk into them.',
  'Forty life, a hundred cards. I know how this ends.',
  'I was never here. Neither were you.',
];

function jace(line?: string): void {
  hold(4800);
  const side = Math.random() < 0.5 ? 'left' : 'right';
  const text = line ?? JACE_LINES[Math.floor(Math.random() * JACE_LINES.length)]!;
  const node = div(`fra-egg fra-jace ${side}`, `<div class="fra-say"><b>Jace Beleren</b>${text}</div>${JACE}`);
  document.body.append(node);
  window.setTimeout(() => node.remove(), 4700);
}

/** Alternate-reality lines for headings. They flicker in over the real ones and are not facts about the club. */
const ALT: Array<[selector: string, text: string]> = [
  ['#top h1', 'Fracture up. Draw nine.'],
  ['#table h2', 'Pull up a chair. We start at which six?'],
  ['#club h2', 'A club in every reality.'],
  ['#nights h2', 'Two nights. Infinite timelines.'],
  ['#members h2', 'Who is not at the table.'],
  ['#events h2', 'Two ways to lose. Just kidding.'],
  ['#watch h2', 'See the club out of order.'],
  ['#join h2', 'The last card is also you.'],
];

function altHeading(): boolean {
  const seen = ALT.flatMap(([selector, text]) => {
    const heading = document.querySelector<HTMLElement>(selector);
    if (!heading) return [];
    const r = heading.getBoundingClientRect();
    return r.top > 60 && r.bottom < window.innerHeight ? [{ heading, text }] : [];
  });
  const pick = seen[Math.floor(Math.random() * seen.length)];
  if (!pick) return false;
  hold(1900);
  const { heading, text } = pick;
  heading.dataset.alt = text;
  heading.style.setProperty('--alt-color', getComputedStyle(heading).color);
  heading.classList.add('fra-alt');
  window.setTimeout(() => {
    heading.classList.remove('fra-alt');
    heading.style.removeProperty('--alt-color');
    delete heading.dataset.alt;
  }, 1750);
  return true;
}

/** A rift: a jagged window onto a copy of the original design, which stitches itself shut. */
function rift(): boolean {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const options = Array.from(document.querySelectorAll<HTMLElement>('main > section'))
    .map((section) => {
      const r = section.getBoundingClientRect();
      const top = Math.max(r.top, 70);
      const bottom = Math.min(r.bottom, vh);
      return { section, r, top, visible: bottom - top };
    })
    .filter((o) => o.visible > 260);
  const pick = options[Math.floor(Math.random() * options.length)];
  if (!pick) return false;
  hold(4600);

  const { section, r } = pick;
  const wide = vw > 700;
  const rx = (wide ? 150 : 90) + Math.random() * (wide ? 110 : 50);
  const ry = Math.min(rx * (0.6 + Math.random() * 0.2), pick.visible * 0.4);
  const cx = r.width * (0.25 + Math.random() * 0.5);
  const cy = pick.top - r.top + pick.visible * (0.35 + Math.random() * 0.3);

  // A jagged outline: points around an ellipse, each at a random distance.
  const N = 16;
  const jitter = (): number[] => Array.from({ length: N }, () => 0.62 + Math.random() * 0.5);
  const outline = (scale: number, radii: number[], grow = 0): string =>
    radii
      .map((k, i) => {
        const a = (i / N) * Math.PI * 2;
        const ex = scale === 0 ? 0 : rx * k * scale + grow;
        const ey = scale === 0 ? 0 : ry * k * scale + grow;
        return `${(cx + Math.cos(a) * ex).toFixed(1)}px ${(cy + Math.sin(a) * ey).toFixed(1)}px`;
      })
      .join(', ');
  const base = jitter();
  const breathe = jitter();
  const stitch1 = jitter();
  const stitch2 = jitter();
  const frames = (grow: number): Keyframe[] => [
    { clipPath: `polygon(${outline(0, base)})`, offset: 0, easing: 'ease-out' },
    { clipPath: `polygon(${outline(1, base, grow)})`, offset: 0.16 },
    { clipPath: `polygon(${outline(1.05, breathe, grow)})`, offset: 0.5 },
    { clipPath: `polygon(${outline(1, base, grow)})`, offset: 0.72, easing: 'ease-in' },
    { clipPath: `polygon(${outline(0.6, stitch1, grow)})`, offset: 0.82 },
    { clipPath: `polygon(${outline(0.3, stitch2, grow)})`, offset: 0.91 },
    { clipPath: `polygon(${outline(0, base)})`, offset: 1 },
  ];

  // The copy is placed over the section, exactly where it is on the page, and sits
  // outside <main>, so it is drawn in the club's original colors and shapes.
  const holder = div('fra-egg fra-rift');
  holder.setAttribute('inert', '');
  const box = (className: string): HTMLDivElement => {
    const node = document.createElement('div');
    node.className = className;
    node.style.left = `${r.left + window.scrollX}px`;
    node.style.top = `${r.top + window.scrollY}px`;
    node.style.width = `${r.width}px`;
    node.style.height = `${r.height}px`;
    return node;
  };
  const rim = box('fra-rift-rim');
  const view = box('fra-rift-view');
  const copy = section.cloneNode(true) as HTMLElement;
  copy.classList.add('fra-rift-copy');
  copy.style.width = `${r.width}px`;
  copy.style.height = `${r.height}px`;
  view.append(copy);
  holder.append(rim, view);
  document.body.append(holder);

  const timing: KeyframeAnimationOptions = { duration: 4200, fill: 'both' };
  rim.animate(frames(14), timing);
  const heal = view.animate(frames(0), timing);
  const remove = (): void => holder.remove();
  heal.finished.then(remove, remove);
  window.setTimeout(remove, 5200);
  return true;
}

function toast(text: string): void {
  const node = div('fra-egg fra-toast', text);
  document.body.append(node);
  window.setTimeout(() => node.remove(), 3300);
}

/** The Konami code: the colors turn inside out for a moment. */
function mirror(): void {
  hold(4000);
  html.classList.add('fra-mirror');
  toast('You found the other side.');
  window.setTimeout(() => html.classList.remove('fra-mirror'), 3600);
}

function play(egg: Egg): void {
  if (egg === 'mirror') mirror();
  else if (egg === 'jace') jace();
  else if (egg === 'alt') {
    if (!altHeading()) play('jace'); // no heading on screen
  } else if (!rift()) play('jace'); // no section tall enough on screen
}

function canPlay(): boolean {
  return (
    document.visibilityState === 'visible' &&
    !introActive &&
    !busy &&
    !html.classList.contains('cutscene') &&
    !document.querySelector('.adm-bar') // not while an officer is editing
  );
}

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

function startEggs(): () => void {
  let timer = 0;
  let stopped = false;
  let last: Egg | null = null;

  const schedule = (minSeconds: number, maxSeconds: number): void => {
    timer = window.setTimeout(tick, (minSeconds + Math.random() * (maxSeconds - minSeconds)) * 1000);
  };
  const tick = (): void => {
    if (stopped) return;
    if (canPlay()) {
      const pool: Egg[] = ['rift', 'rift', 'jace', 'jace', 'alt'];
      const choices = pool.filter((e) => e !== last);
      last = choices[Math.floor(Math.random() * choices.length)]!;
      play(last);
    }
    schedule(35, 80);
  };

  // Hidden ways in.
  let typed: string[] = [];
  const onKey = (e: KeyboardEvent): void => {
    typed = [...typed, e.key.toLowerCase()].slice(-KONAMI.length);
    if (typed.length === KONAMI.length && typed.every((k, i) => k === KONAMI[i])) {
      typed = [];
      if (canPlay()) mirror();
    }
  };
  let presses = 0;
  let reset = 0;
  const onBrand = (): void => {
    presses += 1;
    window.clearTimeout(reset);
    reset = window.setTimeout(() => (presses = 0), 1500);
    if (presses >= 3) {
      presses = 0;
      if (canPlay()) jace('You called?');
    }
  };
  const brand = document.querySelector('.nav .brand');
  document.addEventListener('keydown', onKey);
  brand?.addEventListener('click', onBrand);

  const wanted = new URLSearchParams(window.location.search).get('egg');
  if (wanted && ['rift', 'jace', 'alt', 'mirror'].includes(wanted)) timer = window.setTimeout(() => play(wanted as Egg), 1500);
  else schedule(20, 35);

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.clearTimeout(reset);
    document.removeEventListener('keydown', onKey);
    brand?.removeEventListener('click', onBrand);
    document.querySelectorAll('.fra-egg').forEach((node) => node.remove());
    document.querySelectorAll('.fra-alt').forEach((node) => node.classList.remove('fra-alt'));
    html.classList.remove('fra-mirror');
    busy = false;
  };
}

// Development only: lets a test play an egg at a chosen moment (window.__fraEgg('rift')).
if (import.meta.env.DEV) Object.assign(window, { __fraEgg: play });

const extras: Extras = { intro, startEggs };
export default extras;
