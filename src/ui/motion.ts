// Scroll-driven motion shared by the content sections.
import { ScrollTrigger, reducedMotion } from '../core/scroll';

const ENTER_AT = 'top 72%';

/** Run fn once, when the element first scrolls into view. Runs at once under reduced motion. */
export function onEnter(el: Element, fn: () => void): void {
  if (reducedMotion) {
    fn();
    return;
  }
  ScrollTrigger.create({ trigger: el, start: ENTER_AT, once: true, onEnter: fn });
}

/**
 * Sections marked [data-reveal] hide their [data-rv] pieces until the section
 * scrolls into view, then play them in one after another (see motion.css).
 * The hiding is switched on from here, by adding .rv-armed, so nothing is ever
 * hidden if this script does not run.
 */
export function initReveals(): void {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((section) => {
    section.querySelectorAll<HTMLElement>('[data-rv]').forEach((piece, i) => {
      piece.style.setProperty('--rv', String(i));
    });
    section.classList.add('rv-armed');
    onEnter(section, () => section.classList.add('is-in'));
  });
}

/**
 * Looping animations (the lamp, the pulsing seat, a rocking card) keep
 * costing work even when their section is scrolled out of sight. This pauses
 * them while a section is off screen. See [data-offscreen] in motion.css.
 */
export function initOffscreenPause(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
      });
    },
    { rootMargin: '10% 0px' },
  );
  document.querySelectorAll('main > section').forEach((section) => observer.observe(section));
}

/** The dotted paper drifts slower than the page, which gives the sections depth. */
export function initDotsParallax(): void {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('.dots').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => section.style.setProperty('--dp', (self.progress * 90).toFixed(1)),
    });
  });
}
