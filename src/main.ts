// Display, mono and handwriting faces ship in their Latin form only: they set
// headings, labels and scribbles written here. The text face (Hanken Grotesk)
// keeps every script, since it shows member names.
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/caveat/latin-600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/card.css';
import './styles/hero.css';
import './styles/table.css';
import './styles/motion.css';
import './styles/club.css';
import './styles/nights.css';
import './styles/members.css';
import './styles/events.css';
import './styles/prizebox.css';
import './styles/join.css';

import { fx } from './core/fx';
import { ScrollTrigger, gsap, initScroll } from './core/scroll';
import { initClub } from './sections/club';
import { initEvents } from './sections/events';
import { initHero } from './sections/hero';
import { initJoin } from './sections/join';
import { initMembers } from './sections/members';
import { initNights } from './sections/nights';
import { initTable } from './sections/table';
import { applyClubContent, initNav } from './ui/chrome';
import { applyTextEdits } from './ui/edits';
import { initDotsParallax, initOffscreenPause, initReveals } from './ui/motion';
import { initTracker } from './ui/tracker';

// Words the officers have edited replace the text in index.html first.
applyTextEdits();
applyClubContent();
initNav();
initScroll();
initTable();
initHero();
initClub();
initNights();
initMembers();
initEvents();
initJoin();
// Reveals go last: they number the pieces each section has just built.
initReveals();
initDotsParallax();
initOffscreenPause();
initTracker();

// three.js is the heaviest part of the site, so it loads in its own chunk
// and never blocks the text. Until it is ready, a click on the hero card
// falls back to the plain card flip (see dealIn in sections/table.ts).
const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
async function start3D(): Promise<void> {
  const canvas = document.getElementById('stage');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  // Done in three separate steps with a breath between them, so the page
  // can still respond to a tap or a scroll while the 3D layer starts up.
  const t0 = performance.now();
  const [{ initStage }, { initDeck }] = await Promise.all([import('./core/stage'), import('./core/deck')]);
  await nextTask();
  const t1 = performance.now();
  const stage = initStage(canvas);
  await nextTask();
  const t2 = performance.now();
  if (stage) fx.deck = initDeck(stage);
  const t3 = performance.now();
  // Development only: how long each step took, for the QA notes.
  if (import.meta.env.DEV) Object.assign(window, { __t3d: { load: t1 - t0, stage: t2 - t1, deck: t3 - t2 } });
}
let started = false;
function begin3D(): void {
  if (started) return;
  started = true;
  fx.loading = start3D().catch(() => undefined);
}

// Wide screens start 3D right away. Phones wait for the first touch, scroll
// or key press. Measured in Phase 7 with Lighthouse's slow-phone test:
// starting three.js at load kept the page busy for about a second just
// after it appeared. On a phone the visitor's first move is a touch, and
// touch scrolling stays smooth while this work happens in the background.
if (window.matchMedia('(max-width: 700px)').matches) {
  const events = ['touchstart', 'pointerdown', 'scroll', 'keydown'] as const;
  const go = (): void => {
    events.forEach((name) => window.removeEventListener(name, go));
    begin3D();
  };
  events.forEach((name) => window.addEventListener(name, go, { passive: true }));
} else {
  begin3D();
}

// Officer panel. It loads in its own chunk, only when the footer button is
// pressed, so visitors never download it. See src/admin/admin.ts.
const ADMIN_RESUME = 'mtguwt:admin-open';
function openAdmin(): void {
  void import('./admin/admin').then((m) => m.openAdmin());
}
document.querySelectorAll('[data-admin-open]').forEach((btn) => btn.addEventListener('click', openAdmin));
try {
  // After "Discard" the page reloads itself, then reopens the panel.
  if (sessionStorage.getItem(ADMIN_RESUME)) {
    sessionStorage.removeItem(ADMIN_RESUME);
    openAdmin();
  }
} catch {
  // Storage blocked: the officer presses the button again.
}

// Add ?fps to the address to see a frame-rate readout.
if (new URLSearchParams(window.location.search).has('fps')) {
  void import('./ui/fps').then(({ initFps }) => initFps());
}

// Development only: lets a test pause or step animations from the console.
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __st: ScrollTrigger });
