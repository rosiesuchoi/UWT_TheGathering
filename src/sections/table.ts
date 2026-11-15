// The table: mounts the seven cards, and runs the shuffle cutscene that deals
// them. Styles are in src/styles/table.css.
import { siteCards } from '../content/cards';
import type { DealTarget, DeckFx } from '../core/fx';
import { fx } from '../core/fx';
import { ScrollTrigger, gsap, jumpTo, lockScroll, reducedMotion } from '../core/scroll';
import { createCard } from '../ui/card';

type TableState = 'armed' | 'dealing' | 'revealing' | 'done';

/** Remembers, for this browser tab, that the visitor has seen the shuffle. */
const SEEN_KEY = 'mtguwt:dealt';
/** Keys that mean "I want to scroll on". They skip the cutscene. */
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End']);
/** Ignore scroll input right at the start, so the scroll that triggered the cutscene does not also skip it. */
const SKIP_GRACE_MS = 700;

let tbl: HTMLElement | null = null;
let cut: HTMLElement | null = null;
let cards: HTMLElement[] = [];
let playing = false;
let skip: (() => void) | null = null;
/** True for a moment after an in-page link is clicked, while the page travels to it. */
let navigating = false;
let resetLife: () => void = () => undefined;

function hasSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function markSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage can be blocked. The only cost is that the shuffle may replay.
  }
}

function setState(state: TableState): void {
  if (tbl) tbl.dataset.state = state;
}

/** Scroll so the table sits in the middle of the space below the nav. */
function centerTable(): void {
  if (!tbl) return;
  const navh = document.getElementById('nav')?.offsetHeight ?? 0;
  const r = tbl.getBoundingClientRect();
  const room = Math.max(24, (window.innerHeight - navh - r.height) / 2);
  jumpTo(Math.max(0, window.scrollY + r.top - navh - room));
}

/** Where a table card rests on screen right now. */
function measure(card: HTMLElement): DealTarget {
  const r = card.getBoundingClientRect();
  const rotate = getComputedStyle(card).rotate;
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    width: card.offsetWidth,
    rotation: rotate && rotate !== 'none' ? parseFloat(rotate) : 0,
  };
}

/** The plain version: cards flip in one after another, no 3D. */
function reveal(): void {
  if (!tbl) return;
  setState('armed');
  void tbl.offsetWidth; // restart the CSS animation if it has played before
  setState('revealing');
  window.setTimeout(() => {
    if (tbl?.dataset.state === 'revealing') setState('done');
  }, 500 + cards.length * 90 + 100);
}

/**
 * The cutscene. `speed` above 1 plays it faster; the version that starts by
 * itself on scroll is a little quicker than the one the visitor asks for.
 */
async function playCutscene(deck: DeckFx, speed = 1): Promise<void> {
  if (!tbl || !cut) return;
  const bg = cut.querySelector('.cut-bg');
  playing = true;
  let finished = false;
  const startedAt = performance.now();
  const active: gsap.core.Animation[] = [];
  /** Run an animation and wait for it. If the cutscene is skipped it is killed and never resolves. */
  const run = (anim: gsap.core.Animation): Promise<void> => {
    anim.timeScale(speed);
    active.push(anim);
    return new Promise((resolve) => anim.eventCallback('onComplete', () => resolve()));
  };

  // Scrolling on is a way of saying "skip".
  const onIntent = (e: Event): void => {
    if (performance.now() - startedAt < SKIP_GRACE_MS) return;
    if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
    skip?.();
  };
  window.addEventListener('wheel', onIntent, { passive: true });
  window.addEventListener('touchmove', onIntent, { passive: true });
  window.addEventListener('keydown', onIntent);

  const end = (): void => {
    if (finished) return;
    finished = true;
    window.removeEventListener('wheel', onIntent);
    window.removeEventListener('touchmove', onIntent);
    window.removeEventListener('keydown', onIntent);
    if (cut) cut.hidden = true;
    document.documentElement.classList.remove('cutscene');
    cards.forEach((c) => c.classList.remove('landed'));
    setState('done');
    lockScroll(false);
    markSeen();
    playing = false;
    skip = null;
    // Keyboard and screen reader users continue from the table, not the hero.
    document.getElementById('table')?.focus({ preventScroll: true });
  };
  skip = () => {
    active.forEach((a) => a.kill());
    deck.reset();
    centerTable();
    end();
  };

  // The table lies flat while cards are dealt onto it.
  resetLife();
  lockScroll(true);
  setState('dealing');
  cut.hidden = false;
  document.documentElement.classList.add('cutscene');
  void run(gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }));

  // The deck gathers and riffles. While the screen is dark, move to the table.
  const gather = deck.gather();
  gather.call(centerTable, [], 0.45);
  await run(gather);
  if (finished) return;

  // Lights up on the table as the cards fly to their real places on it.
  void run(gsap.to(bg, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }));
  await run(deck.deal(cards.map(measure), (i) => cards[i]?.classList.add('landed')));
  if (finished) return;

  await run(deck.home());
  end();
}

/** Called when the visitor clicks the hero card, or "Replay the shuffle". */
export function dealIn(): void {
  if (!tbl || playing) return;
  if (reducedMotion) {
    centerTable();
    setState('done');
    document.getElementById('table')?.focus({ preventScroll: true });
    return;
  }
  const deck = fx.deck;
  if (deck) {
    void playCutscene(deck);
    return;
  }
  // 3D is not available (still loading, or no WebGL): go there and flip the cards in.
  centerTable();
  reveal();
}

/**
 * Pointer life: the lamp drifts toward the pointer and the table leans a
 * little, like looking at it from a slightly different seat. This only
 * supplies --tx / --ty (-0.5 to 0.5); table.css decides what moves.
 */
function initLife(section: HTMLElement): void {
  const p = { x: 0, y: 0, tx: 0, ty: 0 };
  section.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || playing) return;
    const r = section.getBoundingClientRect();
    p.tx = (e.clientX - r.left) / r.width - 0.5;
    p.ty = (e.clientY - r.top) / r.height - 0.5;
  });
  section.addEventListener('pointerleave', () => {
    p.tx = 0;
    p.ty = 0;
  });
  gsap.ticker.add(() => {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return;
    p.x += dx * 0.06;
    p.y += dy * 0.06;
    section.style.setProperty('--tx', p.x.toFixed(4));
    section.style.setProperty('--ty', p.y.toFixed(4));
  });
  resetLife = () => {
    p.x = p.y = p.tx = p.ty = 0;
    section.style.removeProperty('--tx');
    section.style.removeProperty('--ty');
  };
}

export function initTable(): void {
  tbl = document.getElementById('tbl');
  cut = document.getElementById('cut');
  const section = document.getElementById('table');
  if (!tbl) return;

  // Mount each card into its slot, in deal order.
  cards = [];
  siteCards.forEach((data, i) => {
    const slot = tbl?.querySelector<HTMLElement>(`[data-card="${data.slot}"]`);
    if (!slot) return;
    const card = createCard(data, { as: 'a', href: data.href, className: 'tcard' });
    card.style.setProperty('--i', String(i));
    slot.append(card);
    if (data.label) {
      const label = document.createElement('span');
      label.className = 'scrib';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = data.label;
      slot.append(label);
    }
    cards.push(card);
  });

  document.getElementById('replayBtn')?.addEventListener('click', dealIn);
  cut?.addEventListener('click', () => skip?.());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') skip?.();
  });

  if (reducedMotion) {
    setState('done');
    return;
  }
  if (section) initLife(section);

  // An in-page link sends the page travelling, possibly straight past the
  // table. That must not start the cutscene.
  let navTimer = 0;
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('a[href^="#"]')) return;
    navigating = true;
    window.clearTimeout(navTimer);
    navTimer = window.setTimeout(() => { navigating = false; }, 1600);
  });

  // The shuffle also plays by itself the first time the visitor scrolls down
  // from the top into the table. Not if they arrived part-way down the page
  // (a link to a section, or a reload), and not twice in one browser tab.
  const fromTop = window.scrollY < 10 && (location.hash === '' || location.hash === '#top');
  const mayAutoPlay = fromTop && !hasSeen();

  // Hide the cards until the visitor arrives.
  setState('armed');
  ScrollTrigger.create({
    trigger: tbl,
    start: 'top 62%',
    once: true,
    onEnter: () => {
      if (tbl?.dataset.state !== 'armed') return;
      const deck = fx.deck;
      if (deck && mayAutoPlay && !navigating) void playCutscene(deck, 1.2);
      else reveal();
    },
  });
}
