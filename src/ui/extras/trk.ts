// Star Trek theme extras: an opening when the visitor picks the theme, and a few
// Easter eggs that pop up now and then while it is on. Loaded only with the
// theme (see src/ui/themes.ts). Styles are in src/styles/trek.css.
//
// The opening: a starship glides in, jumps to warp in a flash, and the page
// changes colors underneath the flash. Any click or key skips it.
// The eggs: warp streaks, red alert, a card beaming away and back, and a Vulcan
// salute. One at a time, every 45 to 110 seconds, only while the tab is visible
// and nobody is editing. Test switch: add ?egg=warp (or redalert, beam, vulcan)
// together with ?set=trk to see one a moment after the page loads.
//
// The starship is our own drawing and is not the Enterprise: no registry, no
// insignia. See the note at the top of trek.css.
import '../../styles/trek.css';
import type { Extras } from '../themes';

const SHIP = `<svg class="trek-ship" viewBox="0 0 560 190" aria-hidden="true">
  <defs>
    <linearGradient id="trkHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4fc"/><stop offset=".5" stop-color="#aebfd6"/><stop offset="1" stop-color="#66789a"/></linearGradient>
    <linearGradient id="trkDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa3be"/><stop offset="1" stop-color="#46577a"/></linearGradient>
    <radialGradient id="trkGlow"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#7fe0e6"/><stop offset="1" stop-color="#7fe0e6" stop-opacity="0"/></radialGradient>
    <linearGradient id="trkAmber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2b84b" stop-opacity="0"/><stop offset="1" stop-color="#ffd98a"/></linearGradient>
    <linearGradient id="trkTrail" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#7fe0e6" stop-opacity=".9"/><stop offset="1" stop-color="#7fe0e6" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="8" y="46" width="90" height="6" rx="3" fill="url(#trkTrail)" opacity=".8"/>
  <rect x="8" y="136" width="90" height="6" rx="3" fill="url(#trkTrail)" opacity=".8"/>
  <path d="M268 78 L236 60 L252 54 L296 72Z" fill="url(#trkDark)"/>
  <path d="M268 112 L236 130 L252 136 L296 118Z" fill="url(#trkDark)"/>
  <path d="M96 44 L236 40 C252 40 262 50 262 58 C262 66 252 72 236 72 L96 66 C86 62 86 48 96 44Z" fill="url(#trkHull)"/>
  <path d="M96 124 L236 118 C252 118 262 124 262 132 C262 140 252 148 236 148 L96 144 C86 140 86 128 96 124Z" fill="url(#trkHull)"/>
  <rect x="110" y="52" width="104" height="8" rx="4" fill="url(#trkAmber)" opacity=".9"/>
  <rect x="110" y="130" width="104" height="8" rx="4" fill="url(#trkAmber)" opacity=".9"/>
  <ellipse cx="256" cy="56" rx="13" ry="12" fill="url(#trkGlow)"/>
  <ellipse cx="256" cy="134" rx="13" ry="12" fill="url(#trkGlow)"/>
  <path d="M536 95 C486 50 396 34 292 64 C300 78 312 88 322 95 C312 102 300 112 292 126 C396 156 486 140 536 95Z" fill="url(#trkHull)"/>
  <path d="M520 95 C478 62 400 52 318 74 C380 62 458 66 520 95Z" fill="#fff" opacity=".5"/>
  <path d="M322 95 L520 95" stroke="#46577a" stroke-width="1.6" opacity=".55"/>
  <path d="M380 80 C420 74 462 80 492 94 C456 88 416 86 380 92Z" fill="url(#trkDark)" opacity=".5"/>
  <ellipse cx="452" cy="88" rx="20" ry="6" fill="#46577a" opacity=".55"/>
  <g fill="#bfe9ff"><circle cx="350" cy="84" r="1.7"/><circle cx="374" cy="88" r="1.7"/><circle cx="398" cy="90" r="1.7"/><circle cx="350" cy="106" r="1.7"/><circle cx="374" cy="102" r="1.7"/><circle cx="398" cy="100" r="1.7"/></g>
  <ellipse cx="528" cy="95" rx="10" ry="6" fill="url(#trkGlow)"/>
</svg>`;

/**
 * The opening is driven by its own animations, not by a separate clock: when the
 * flash starts, the page changes a moment later, under the brightest part, and
 * the cover fades once the cover's fade-out ends it. If the animations never run
 * (a hidden tab), a safety timer still reveals the page and removes the cover.
 */
const REVEAL_AFTER_FLASH_START = 170;
const FADE_AFTER_FLASH_START = 240;
const SAFETY_REVEAL = 4000;
const SAFETY_END = 4700;

let introActive = false;

/** The opening. `reveal` changes the page; it is called once, under the flash. */
function intro(reveal: () => void): { done: Promise<void>; skip: () => void } {
  const root = document.createElement('div');
  root.className = 'trek-intro';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `<div class="trek-stars"></div><div class="trek-stars b"></div>${SHIP}<div class="trek-streak"></div><div class="trek-flash"></div>`;
  document.body.append(root);
  introActive = true;

  const timers: number[] = [];
  let revealed = false;
  let ended = false;
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));

  const doReveal = (withRing: boolean): void => {
    if (revealed) return;
    revealed = true;
    reveal();
    if (withRing) {
      const ring = document.createElement('div');
      ring.className = 'trek-pop';
      ring.setAttribute('aria-hidden', 'true');
      document.body.append(ring);
      window.setTimeout(() => ring.remove(), 950);
    }
  };
  const end = (): void => {
    if (ended) return;
    ended = true;
    timers.forEach((t) => window.clearTimeout(t));
    document.removeEventListener('keydown', skip);
    root.remove();
    introActive = false;
    finish();
  };
  const skip = (): void => {
    if (ended) return;
    timers.forEach((t) => window.clearTimeout(t));
    timers.length = 0;
    doReveal(false);
    root.classList.add('is-out', 'is-skip');
    timers.push(window.setTimeout(end, 260));
  };

  // The flash starts at the end of the ship's flight.
  root.querySelector('.trek-flash')?.addEventListener('animationstart', () => {
    timers.push(window.setTimeout(() => doReveal(true), REVEAL_AFTER_FLASH_START));
    timers.push(window.setTimeout(() => root.classList.add('is-out'), FADE_AFTER_FLASH_START));
  });
  root.addEventListener('animationend', (e) => {
    if (e.target === root && e.animationName === 'trek-out') end();
  });
  timers.push(
    window.setTimeout(() => {
      doReveal(false);
      root.classList.add('is-out');
    }, SAFETY_REVEAL),
    window.setTimeout(end, SAFETY_END),
  );
  root.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip);
  return { done, skip };
}

// ---- Easter eggs ------------------------------------------------------------

type Egg = 'warp' | 'redalert' | 'beam' | 'vulcan';
const EGGS: Egg[] = ['warp', 'redalert', 'beam', 'vulcan'];

function layer(className: string, html = '', lasts = 3200): HTMLElement {
  const node = document.createElement('div');
  node.className = `trek-egg ${className}`;
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = html;
  document.body.append(node);
  window.setTimeout(() => node.remove(), lasts);
  return node;
}

/** A card the visitor can see right now, for the transporter. */
function visibleCard(): HTMLElement | null {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('main .card:not(.cardback)')).filter((card) => {
    const r = card.getBoundingClientRect();
    return r.width > 80 && r.top > 70 && r.bottom < window.innerHeight && r.left > 0 && r.right < window.innerWidth;
  });
  return cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)]! : null;
}

function play(egg: Egg): void {
  switch (egg) {
    case 'warp':
      layer('trek-warp', '', 2000);
      break;
    case 'redalert':
      layer('trek-red', '', 2900);
      break;
    case 'vulcan':
      layer('trek-vulcan', '<span class="trek-hand">🖖</span><span class="trek-words">Live long and prosper.</span>', 3200);
      break;
    case 'beam': {
      const card = visibleCard();
      if (!card) {
        play('vulcan'); // nothing to beam on this screen
        break;
      }
      card.classList.add('trek-beam');
      window.setTimeout(() => card.classList.remove('trek-beam'), 2000);
      break;
    }
  }
}

function canPlay(): boolean {
  return (
    document.visibilityState === 'visible' &&
    !introActive &&
    !document.documentElement.classList.contains('cutscene') &&
    !document.querySelector('.adm-bar') // not while an officer is editing
  );
}

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
      const choices = EGGS.filter((e) => e !== last);
      last = choices[Math.floor(Math.random() * choices.length)]!;
      play(last);
    }
    schedule(45, 110);
  };

  const wanted = new URLSearchParams(window.location.search).get('egg');
  if (wanted && (EGGS as string[]).includes(wanted)) timer = window.setTimeout(() => play(wanted as Egg), 1500);
  else schedule(30, 55);

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    document.querySelectorAll('.trek-egg').forEach((node) => node.remove());
    document.querySelectorAll('.trek-beam').forEach((card) => card.classList.remove('trek-beam'));
  };
}

const extras: Extras = { intro, startEggs };
export default extras;
