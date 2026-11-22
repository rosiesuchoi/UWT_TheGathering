// The turn tracker: a Magic turn laid over the page. As the visitor scrolls,
// the phase lights up (Untap at the top, Cleanup at the footer), the way the
// phase ribbon does in a digital Magic client. Decoration only: the nav and the
// headings do the real navigating, so all of it is aria-hidden.
import { ScrollTrigger } from '../core/scroll';

interface Phase {
  /** Shown in the HUD. */
  name: string;
  /** Sections that count as this phase, in page order. */
  sections: string[];
}

/** The eight steps of a turn, mapped onto the page. */
export const PHASES: Phase[] = [
  { name: 'Untap', sections: ['top'] },
  { name: 'Upkeep', sections: ['table'] },
  { name: 'Draw', sections: ['club'] },
  { name: 'Main phase 1', sections: ['nights'] },
  { name: 'Combat', sections: ['members'] },
  { name: 'Main phase 2', sections: ['events', 'watch'] },
  { name: 'End step', sections: ['join'] },
  { name: 'Cleanup', sections: ['foot'] },
];

export function initPhases(): void {
  const hud = document.getElementById('phases');
  const label = document.getElementById('phaseName');
  const track = document.getElementById('phaseTrack');
  if (!hud || !label || !track) return;

  const pips = PHASES.map(() => {
    const pip = document.createElement('i');
    track.append(pip);
    return pip;
  });

  let shown = -1;
  const show = (index: number): void => {
    if (index === shown) return;
    const first = shown === -1;
    shown = index;
    label.textContent = PHASES[index]!.name;
    pips.forEach((pip, i) => {
      pip.classList.toggle('done', i < index);
      pip.classList.toggle('now', i === index);
    });
    // Restart the small flip on each change (not on the first paint).
    if (!first) {
      hud.classList.remove('flip');
      void hud.offsetWidth;
      hud.classList.add('flip');
    }
  };
  show(0);

  PHASES.forEach((phase, index) => {
    for (const id of phase.sections) {
      const section = document.getElementById(id);
      if (!section) continue;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) show(index);
        },
      });
    }
  });
}
