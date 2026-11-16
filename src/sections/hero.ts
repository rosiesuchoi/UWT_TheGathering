// Hero: the fan of cards. Styles are in src/styles/hero.css.
import { cardTexts, club } from '../content';
import { ScrollTrigger, gsap, reducedMotion } from '../core/scroll';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';
import { bindVisitorCard } from '../ui/visitor';
import { dealIn } from './table';

export function initHero(): void {
  const hero = document.getElementById('top');
  const fan = document.getElementById('heroFan');
  if (!hero || !fan) return;

  // "Thursdays and Fridays, 6 PM, Tacoma." built from club.json.
  const days = club.nights.map((n) => `${n.day}s`).join(' and ');
  const time = club.nights[0]?.time;
  const card = createCard(
    {
      name: 'Your name here',
      type: cardTexts.you.type,
      text: [days, time, club.city].filter(Boolean).join(', ') + '.',
      number: '100/100',
      set: '',
      tone: 'gold',
      glyph: 'mark',
      foil: true,
    },
    { as: 'button', className: 'herocard idle', label: 'Shuffle up: deal me in at the table' },
  );
  fan.append(card);
  bindVisitorCard(card);
  attachTilt(card);

  // Clicking the card plays the shuffle and deals the visitor in at the table.
  card.addEventListener('click', dealIn);

  // Play the entrance once the display font is in, so the headline does not
  // jump. Never wait longer than a moment for it.
  const fontsIn = document.fonts.ready.then(() => undefined);
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 900));
  void Promise.race([fontsIn, timeout]).then(() => hero.classList.add('is-ready'));

  if (reducedMotion) return;

  // Parallax. This code only supplies numbers as CSS variables; hero.css
  // decides what each piece does with them. GSAP is deliberately not given
  // these elements to transform: it would bake their CSS resting pose into an
  // inline transform and break the entrance keyframes.
  //   --px / --py  pointer position across the hero, -0.5 to 0.5, smoothed
  //   --sp         how far the hero has scrolled away, 0 to 1
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ty = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener('pointerleave', () => {
    pointer.tx = 0;
    pointer.ty = 0;
  });
  gsap.ticker.add(() => {
    const dx = pointer.tx - pointer.x;
    const dy = pointer.ty - pointer.y;
    if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return;
    pointer.x += dx * 0.08;
    pointer.y += dy * 0.08;
    fan.style.setProperty('--px', pointer.x.toFixed(4));
    fan.style.setProperty('--py', pointer.y.toFixed(4));
  });

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => hero.style.setProperty('--sp', self.progress.toFixed(4)),
  });
}
