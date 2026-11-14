// Pointer tilt for cards. Sets CSS variables that card.css reads: --rx/--ry
// lean the face, --fx/--fy slide the foil, --gx/--gy move the glare.
import { reducedMotion } from '../core/scroll';

const PROPS = ['--rx', '--ry', '--fx', '--fy', '--gx', '--gy'] as const;

export interface TiltOptions {
  /** Largest lean left/right and up/down, in degrees. */
  maxY?: number;
  maxX?: number;
}

/** A card with class "idle" stops its own rocking while the pointer is on it. */
export function attachTilt(el: HTMLElement, { maxY = 13, maxX = 10 }: TiltOptions = {}): void {
  if (reducedMotion) return;
  const idles = el.classList.contains('idle');

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.classList.remove('idle');
    el.style.setProperty('--ry', `${((x - 0.5) * 2 * maxY).toFixed(1)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y) * 2 * maxX).toFixed(1)}deg`);
    const px = `${(x * 100).toFixed(0)}%`;
    const py = `${(y * 100).toFixed(0)}%`;
    el.style.setProperty('--fx', px);
    el.style.setProperty('--fy', py);
    el.style.setProperty('--gx', px);
    el.style.setProperty('--gy', py);
  });

  el.addEventListener('pointerleave', () => {
    PROPS.forEach((p) => el.style.removeProperty(p));
    if (idles) el.classList.add('idle');
  });
}
