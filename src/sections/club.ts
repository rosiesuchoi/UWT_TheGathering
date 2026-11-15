// Club section: the club card, the officers' blurb, and four Commander facts.
// Styles are in src/styles/club.css. The reveal is in src/styles/motion.css.
import { club } from '../content';
import { siteCard } from '../content/cards';
import { gsap, reducedMotion } from '../core/scroll';
import { createCard } from '../ui/card';
import { onEnter } from '../ui/motion';
import { attachTilt } from '../ui/tilt';

export function initClub(): void {
  const section = document.getElementById('club');
  if (!section) return;

  // The same card that sits on the table, now full size.
  const mount = document.getElementById('clubCard');
  const data = siteCard('club');
  if (mount && data) {
    const card = createCard(data);
    attachTilt(card);
    mount.append(card);
  }

  // The officers' own words replace the "owed" note once club.json has them.
  const blurb = document.getElementById('clubBlurb');
  if (blurb && club.blurb) {
    blurb.textContent = club.blurb;
    blurb.classList.remove('owed');
  }

  // Count each fact up from zero as the section arrives.
  if (reducedMotion) return;
  const facts = Array.from(section.querySelectorAll<HTMLElement>('[data-count]'));
  onEnter(section, () => {
    facts.forEach((el, i) => {
      const end = Number(el.dataset.count);
      const counter = { value: 0 };
      gsap.to(counter, {
        value: end,
        duration: 1.1,
        delay: 0.45 + i * 0.12,
        ease: 'power2.out',
        onStart: () => { el.textContent = '0'; },
        onUpdate: () => { el.textContent = String(Math.round(counter.value)); },
        onComplete: () => { el.textContent = String(end); },
      });
    });
  });
}
