// The counter beside the corner deck: how many of the seven cards have been
// played so far, going by the section on screen.
import { siteCards } from '../content/cards';
import { ScrollTrigger } from '../core/scroll';

/** Sections in page order. A card counts as played once its section is reached. */
const ORDER = ['top', 'table', 'club', 'nights', 'members', 'events', 'join', 'foot'];

function playedBy(sectionId: string): number {
  const reached = ORDER.indexOf(sectionId);
  return siteCards.filter((card) => {
    const at = ORDER.indexOf(card.href.slice(1));
    return at !== -1 && at <= reached;
  }).length;
}

export function initTracker(): void {
  const chip = document.getElementById('tally');
  const count = document.getElementById('tallyCount');
  const total = document.getElementById('tallyTotal');
  if (!chip || !count || !total) return;
  total.textContent = String(siteCards.length);

  let shown = 0;
  const show = (n: number): void => {
    if (n === shown) return;
    shown = n;
    count.textContent = String(n);
    // Restart the little pop on each change.
    chip.classList.remove('pop');
    void chip.offsetWidth;
    chip.classList.add('pop');
  };

  ORDER.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    const n = playedBy(id);
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) show(n);
      },
    });
  });
}
