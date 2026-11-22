// The Hobbit extras: a round-door opening when the visitor picks the theme, and,
// while it is on, a few quiet eggs and two hidden ones. Loaded only with the
// theme (src/ui/themes.ts). Styles, including the warm handmade look, are in
// src/styles/hob.css.
//
// The opening: a round green door in a hillside swings open on warm light; we
// walk through it (the whole scene zooms), the light floods the screen, the
// theme changes under the light, and the light fades on the new page. Any click
// or key skips it.
//
// The eggs, one at a time, every 35 to 80 seconds while the tab is visible and
// nobody is editing:
//   fireflies  soft lights drift up the screen and fade
//   ember      a slow red-gold glow washes in from an edge, with a ripple
//   glint      a card on screen catches the light and sparkles
//   map        a moonlit map shows marks nobody can read, then fades
// Hidden: the Konami code starts a shower of gold, and pressing the club mark in
// the nav three times opens a small round door in the middle of the screen.
// Test switch: ?set=hob&egg=fireflies (or ember, glint, map, door, coins).
//
// Everything is our own drawing and generic. The map's marks are random strokes,
// not any real script.
import '../../styles/hob.css';
import type { Extras } from '../themes';

const html = document.documentElement;

const div = (className: string, markup = ''): HTMLDivElement => {
  const node = document.createElement('div');
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = markup;
  return node;
};

const DOOR = '<div class="hob-frame"><div class="hob-door"><span class="hob-knob"></span></div></div>';

const SCENE = `<div class="hob-scene">
  <div class="hob-sky"></div>
  <svg class="hob-hill" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 360 C120 300 260 330 380 350 C520 372 640 300 780 320 C880 334 950 350 1000 340 L1000 600 L0 600Z" fill="#3f6b3a"/>
    <path d="M0 430 C140 380 300 400 440 420 C600 442 760 380 1000 410 L1000 600 L0 600Z" fill="#2f5a2c"/>
    <path d="M0 520 C200 480 420 500 620 520 C800 536 920 510 1000 500 L1000 600 L0 600Z" fill="#244a24"/>
  </svg>
  ${DOOR}
</div><div class="hob-light"></div>`;

// ---- The opening ------------------------------------------------------------

const SAFETY_MS = 6500;
let introActive = false;

function intro(reveal: () => void): { done: Promise<void>; skip: () => void } {
  const root = div('hob-intro', SCENE);
  const scene = root.querySelector<HTMLElement>('.hob-scene')!;
  document.body.append(root);
  introActive = true;

  const timers: number[] = [];
  let revealed = false;
  let ended = false;
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));

  const doReveal = (): void => {
    if (revealed) return;
    revealed = true;
    reveal();
  };
  const end = (): void => {
    if (ended) return;
    ended = true;
    timers.forEach((t) => window.clearTimeout(t));
    document.removeEventListener('keydown', skip);
    doReveal();
    root.remove();
    introActive = false;
    finish();
  };
  function skip(): void {
    if (ended) return;
    timers.forEach((t) => window.clearTimeout(t));
    timers.length = 0;
    doReveal();
    root.classList.add('is-out');
    timers.push(window.setTimeout(end, 650));
  }

  // The zoom through the door ends: the screen is full of light, so change the page now and fade.
  scene.addEventListener('animationend', (e) => {
    if (e.target !== scene || e.animationName !== 'hob-walk') return;
    doReveal();
    root.classList.add('is-out');
  });
  root.addEventListener('animationend', (e) => {
    if (e.target === root && e.animationName === 'hob-out') end();
  });
  root.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip);
  // If the animations never run (a hidden tab), the page still ends up revealed and the cover gone.
  timers.push(window.setTimeout(skip, SAFETY_MS));
  return { done, skip };
}

// ---- Eggs -------------------------------------------------------------------

type Egg = 'fireflies' | 'ember' | 'glint' | 'map' | 'door' | 'coins';
let busy = false;

function hold(ms: number): void {
  busy = true;
  window.setTimeout(() => (busy = false), ms);
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

function layer(className: string, markup: string, lasts: number): HTMLElement {
  const node = div(`hob-egg ${className}`, markup);
  document.body.append(node);
  window.setTimeout(() => node.remove(), lasts);
  return node;
}

function fireflies(): void {
  hold(9500);
  const flies = Array.from({ length: 14 }, () => {
    const style = `--x:${rand(4, 94).toFixed(1)}vw;--y:${rand(48, 96).toFixed(1)}vh;--s:${rand(10, 18).toFixed(1)}px;--d:${rand(0, 3).toFixed(2)}s;--t:${rand(5, 7.5).toFixed(2)}s;--dx:${rand(-9, 9).toFixed(1)}vw`;
    return `<i style="${style}"></i>`;
  }).join('');
  layer('hob-flies', flies, 11000);
}

function ember(): void {
  hold(4300);
  const from = [
    ['50%', '118%'],
    ['-18%', '60%'],
    ['118%', '60%'],
  ][Math.floor(Math.random() * 3)]!;
  const node = layer('hob-ember', '', 4300);
  node.style.setProperty('--ox', from[0]!);
  node.style.setProperty('--oy', from[1]!);
}

/** A card the visitor can see right now. */
function visibleCard(): HTMLElement | null {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('main .card:not(.cardback)')).filter((card) => {
    const r = card.getBoundingClientRect();
    return r.width > 80 && r.top > 70 && r.bottom < window.innerHeight && r.left > 0 && r.right < window.innerWidth;
  });
  return cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)]! : null;
}

function glint(): boolean {
  const card = visibleCard();
  if (!card) return false;
  hold(2800);
  card.classList.add('hob-glint');
  window.setTimeout(() => card.classList.remove('hob-glint'), 2700);
  return true;
}

/** Rows of random strokes. They look like writing and are not any real script. */
function marks(): string {
  const paths: string[] = [];
  const rows = 4;
  const cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = 8 + c * 33;
      const y0 = 8 + r * 34;
      const points = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => `${(x0 + rand(0, 18)).toFixed(1)} ${(y0 + rand(0, 24)).toFixed(1)}`);
      paths.push(`<path pathLength="1" style="--d:${(0.8 + (r * cols + c) * 0.08).toFixed(2)}s" d="M${points.join(' L')}"/>`);
    }
  }
  return `<svg viewBox="0 0 280 150" aria-hidden="true">${paths.join('')}</svg>`;
}

function map(): void {
  hold(7300);
  layer('hob-map', `<div class="hob-map-sheet"><span class="hob-map-moon"></span>${marks()}<div class="hob-map-note">Visible only by moonlight.</div></div>`, 7200);
}

function door(line?: string): void {
  hold(3800);
  const node = layer('hob-mini', `${DOOR}<div class="hob-say">${line ?? 'Welcome. Mind the step.'}</div>`, 3700);
  // The line sits under the door, whatever size the door is on this screen.
  const frame = node.querySelector<HTMLElement>('.hob-frame');
  if (frame) node.style.setProperty('--dm', `${Math.round(frame.getBoundingClientRect().height / 2 + 36)}px`);
}

function coins(): void {
  hold(4800);
  const rain = Array.from({ length: 26 }, () => `<i style="--x:${rand(2, 96).toFixed(1)}vw;--d:${rand(0, 1.6).toFixed(2)}s;--t:${rand(1.9, 3).toFixed(2)}s"></i>`).join('');
  layer('hob-coins', rain, 5000);
  const toast = div('hob-egg hob-toast', 'A hoard of gold!');
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3300);
}

function play(egg: Egg): void {
  switch (egg) {
    case 'fireflies':
      fireflies();
      break;
    case 'ember':
      ember();
      break;
    case 'glint':
      if (!glint()) fireflies(); // no card on this screen
      break;
    case 'map':
      map();
      break;
    case 'door':
      door();
      break;
    case 'coins':
      coins();
      break;
  }
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
const EGGS: Egg[] = ['fireflies', 'ember', 'glint', 'map', 'door', 'coins'];

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
      const pool: Egg[] = ['fireflies', 'fireflies', 'glint', 'glint', 'ember', 'map'];
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
      if (canPlay()) coins();
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
      if (canPlay()) door();
    }
  };
  const brand = document.querySelector('.nav .brand');
  document.addEventListener('keydown', onKey);
  brand?.addEventListener('click', onBrand);

  const wanted = new URLSearchParams(window.location.search).get('egg');
  if (wanted && (EGGS as string[]).includes(wanted)) timer = window.setTimeout(() => play(wanted as Egg), 1500);
  else schedule(20, 35);

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.clearTimeout(reset);
    document.removeEventListener('keydown', onKey);
    brand?.removeEventListener('click', onBrand);
    document.querySelectorAll('.hob-egg').forEach((node) => node.remove());
    document.querySelectorAll('.hob-glint').forEach((card) => card.classList.remove('hob-glint'));
    busy = false;
  };
}

// Development only: lets a test play an egg at a chosen moment (window.__hobEgg('map')).
if (import.meta.env.DEV) Object.assign(window, { __hobEgg: play });

const extras: Extras = { intro, startEggs };
export default extras;
