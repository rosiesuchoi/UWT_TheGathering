import '@fontsource/anton/400.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/caveat/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/card.css';
import './styles/hero.css';
import './styles/table.css';

import { fx } from './core/fx';
import { gsap, initScroll } from './core/scroll';
import { initHero } from './sections/hero';
import { initTable } from './sections/table';
import { applyClubContent, initNav } from './ui/chrome';

applyClubContent();
initNav();
initScroll();
initTable();
initHero();

// three.js is the heaviest part of the site, so it loads after the page is
// readable instead of blocking it.
async function start3D(): Promise<void> {
  const canvas = document.getElementById('stage');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const [{ initStage }, { initDeck }] = await Promise.all([import('./core/stage'), import('./core/deck')]);
  const stage = initStage(canvas);
  if (stage) fx.deck = initDeck(stage);
}
void start3D();

// Development only: lets a test pause or step animations from the console.
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap });
