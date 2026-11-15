// The table: mounts the seven cards, and runs the shuffle cutscene that deals
// them. Styles are in src/styles/table.css.
import { siteCards } from '../content/cards';
import type { DealTarget, DeckFx } from '../core/fx';
import { fx } from '../core/fx';
import { ScrollTrigger, gsap, jumpTo, lockScroll, reducedMotion } from '../core/scroll';
import { createCard } from '../ui/card';

type TableState = 'armed' | 'dealing' | 'revealing' | 'done';

let tbl: HTMLElement | null = null;
let cut: HTMLElement | null = null;
let cards: HTMLElement[] = [];
let playing = false;
let skip: (() => void) | null = null;

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

function endCutscene(): void {
  if (cut) cut.hidden = true;
  document.documentElement.classList.remove('cutscene');
  cards.forEach((c) => c.classList.remove('landed'));
  setState('done');
  lockScroll(false);
  playing = false;
  skip = null;
  // Keyboard and screen reader users continue from the table, not the hero.
  document.getElementById('table')?.focus({ preventScroll: true });
}

async function playCutscene(deck: DeckFx): Promise<void> {
  if (!tbl || !cut) return;
  const bg = cut.querySelector('.cut-bg');
  playing = true;
  let skipped = false;
  const active: gsap.core.Animation[] = [];
  /** Run an animation and wait for it. If the cutscene is skipped it is killed and never resolves. */
  const run = (anim: gsap.core.Animation): Promise<void> => {
    active.push(anim);
    return new Promise((resolve) => anim.eventCallback('onComplete', () => resolve()));
  };
  skip = () => {
    skipped = true;
    active.forEach((a) => a.kill());
    deck.reset();
    centerTable();
    endCutscene();
  };

  lockScroll(true);
  setState('dealing');
  cut.hidden = false;
  document.documentElement.classList.add('cutscene');
  void run(gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }));

  // The deck gathers and riffles. While the screen is dark, move to the table.
  const gather = deck.gather();
  gather.call(centerTable, [], 0.45);
  await run(gather);
  if (skipped) return;

  // Lights up on the table as the cards fly to their real places on it.
  void run(gsap.to(bg, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }));
  await run(deck.deal(cards.map(measure), (i) => cards[i]?.classList.add('landed')));
  if (skipped) return;

  await run(deck.home());
  if (skipped) return;
  endCutscene();
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

export function initTable(): void {
  tbl = document.getElementById('tbl');
  cut = document.getElementById('cut');
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

  if (reducedMotion) {
    setState('done');
  } else {
    // Hide the cards until the visitor arrives. If they scroll here instead of
    // clicking the hero card, flip the cards in without the cutscene.
    setState('armed');
    ScrollTrigger.create({
      trigger: tbl,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (tbl?.dataset.state === 'armed') reveal();
      },
    });
  }

  document.getElementById('replayBtn')?.addEventListener('click', dealIn);
  cut?.addEventListener('click', () => skip?.());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') skip?.();
  });
}
