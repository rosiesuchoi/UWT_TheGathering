// The prize box: a six-sided box that turns when dragged, for an event that
// gives something away. Styles are in src/styles/prizebox.css.
//
// Two looks. If the prize has `photos`, each side is the club's own photo of
// the real box (the club's decision for the giveaway prize, the one place
// the site shows official packaging). Otherwise the sides are our own
// drawing in the site's style, and the box says so.
//
// It is built from page elements with CSS 3D, not WebGL, so the lettering
// stays sharp and it costs a phone almost nothing. This file only sets
// numbers as CSS variables: --ry / --rx (degrees) on the box, --sh (shade)
// on each side, --sheen on the box, --sw on the shadow.
import type { ClubEvent } from '../content';
import { gsap, reducedMotion } from '../core/scroll';

type Vec = [number, number, number];

/** Which way each side faces before the box is turned. */
const NORMALS: Record<string, Vec> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, -1, 0],
  bottom: [0, 1, 0],
};
/** Toward the light: up, a little left, and in front. */
const LIGHT: Vec = [-0.4, -0.6, 0.7];
const LIGHT_LENGTH = Math.hypot(...LIGHT);

const REST_YAW = -28;
const REST_PITCH = -10;
const MAX_PITCH = 72;
/** Degrees a second while nobody is touching it. */
const IDLE_SPEED = 16;
/** How long after the last touch the box starts turning by itself again. */
const IDLE_AFTER_MS = 3500;

// An original moth: the deck is called Mutant Menace.
const MOTH = `<svg viewBox="0 0 100 80" aria-hidden="true" focusable="false">
  <g fill="currentColor">
    <path d="M50 32C41 9 13 5 6 21c-4 17 20 26 44 20z"/>
    <path d="M50 32c9-23 37-27 44-11 4 17-20 26-44 20z"/>
    <path d="M50 42c-14 3-27 11-24 24 6 10 20 0 24-13z"/>
    <path d="M50 42c14 3 27 11 24 24-6 10-20 0-24-13z"/>
    <ellipse cx="50" cy="42" rx="4.2" ry="17"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M49 27c-3-9-8-13-14-13"/>
    <path d="M51 27c3-9 8-13 14-13"/>
  </g>
  <g class="pz-eye">
    <circle cx="27" cy="25" r="7"/>
    <circle cx="73" cy="25" r="7"/>
  </g>
  <g class="pz-pupil">
    <circle cx="27" cy="25" r="2.6"/>
    <circle cx="73" cy="25" r="2.6"/>
  </g>
</svg>`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The deck's colors as plain dots, in the site's accents. */
function dots(colors: string[]): HTMLElement {
  const row = el('span', 'pz-dots');
  colors.forEach((c) => {
    const dot = el('span', 'pz-dot');
    dot.style.background = `var(--${c})`;
    row.append(dot);
  });
  return row;
}

function side(name: string, ...children: Array<Node | string>): HTMLElement {
  const face = el('div', `pz-side pz-${name}`);
  face.dataset.side = name;
  face.append(...children);
  return face;
}

/** Build the prize box for an event. Returns null if the event has no prize. */
export function createPrizeBox(event: ClubEvent): HTMLElement | null {
  const prize = event.prize;
  if (!prize) return null;

  const words = prize.name.split(' ');
  const title = el('span', 'pz-title');
  words.forEach((w) => title.append(el('span', '', w)));

  const art = el('span', 'pz-art');
  art.innerHTML = MOTH; // static, trusted markup defined above

  const front = side(
    'front',
    (() => {
      const top = el('span', 'pz-row');
      top.append(el('span', 'pz-kicker', prize.kind), dots(prize.colors));
      return top;
    })(),
    art,
    title,
    (() => {
      const foot = el('span', 'pz-row pz-foot');
      foot.append(el('span', 'mark'), el('span', 'pz-kicker', 'Club giveaway'));
      return foot;
    })(),
  );

  const back = side(
    'back',
    el('span', 'pz-kicker', event.cadence),
    el('span', 'pz-back-title', 'The prize'),
    el('span', 'pz-back-text', event.text),
    el('span', 'pz-back-text', event.date ? `When: ${event.date}` : 'Date to be announced.'),
    el('span', 'pz-kicker pz-small', 'Drawn for this site. Not the real box.'),
  );

  const spine = (text: string, withDots: boolean): HTMLElement => {
    const wrap = el('span', 'pz-spine');
    wrap.append(el('span', '', text));
    if (withDots) wrap.append(dots(prize.colors));
    return wrap;
  };

  // With photos, each side is a photo of the real box, cut out and squared
  // up, from public/prizes/<folder>/. Without, the sides are our drawing.
  const photoSides: HTMLImageElement[] = [];
  const photoSide = (name: string): HTMLElement => {
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.src = `${import.meta.env.BASE_URL}prizes/${prize.photos}/${name}.webp`;
    photoSides.push(img);
    const face = side(name, img);
    face.classList.add('pz-photo');
    return face;
  };

  const box = el('div', 'pz-box');
  const sides = prize.photos
    ? ['front', 'back', 'right', 'left', 'top', 'bottom'].map(photoSide)
    : [
        front,
        back,
        side('right', spine(prize.name, true)),
        side('left', spine('Club giveaway', false)),
        side('top', el('span', 'mark'), el('span', 'pz-kicker', prize.kind)),
        side('bottom', el('span', 'pz-kicker pz-small', 'Our drawing, not the real packaging')),
      ];
  box.append(...sides);

  const scene = el('div', 'pz-scene');
  // The sides repeat what the entry beside the box already says.
  scene.setAttribute('aria-hidden', 'true');
  const shadow = el('div', 'pz-shadow');
  scene.append(box, shadow);

  const turnBtn = el('button', 'pz-btn', 'Turn the box');
  turnBtn.type = 'button';
  const caption = el('p', 'pz-cap');
  caption.append(
    el('span', 'sr-only', `${prize.photos ? 'Photos' : 'A drawing'} of the prize box: a ${prize.name} ${prize.kind}. `),
    prize.photos ? 'The real box. Drag it to look around.' : 'Our drawing of the prize, not the real box. Drag it to look around.',
  );

  // Width, height and depth of the box, as shares of its width.
  const [, heightShare, depthShare] = prize.size ?? [1, 1.4, 0.44];
  const root = el('div', 'prize');
  root.style.setProperty('--hr', String(heightShare));
  root.style.setProperty('--dr', String(depthShare));
  // A box wider than it is tall sits under its entry's text, not beside it.
  if (heightShare < 1) root.classList.add('wide');
  root.append(scene, turnBtn, caption);

  // The photos are fetched when the box is about to scroll into view, all six
  // together, so no side is still blank when the box turns to it.
  if (photoSides.length > 0) {
    const load = (): void => photoSides.forEach((img) => (img.src = img.dataset.src ?? ''));
    if ('IntersectionObserver' in window) {
      const near = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          load();
          near.disconnect();
        },
        { rootMargin: '900px 0px' },
      );
      near.observe(root);
      // Belt and braces: touching the box fetches them too.
      scene.addEventListener('pointerdown', load, { once: true });
    } else {
      load();
    }
  }

  // ---- Turning -----------------------------------------------------------
  const pose = { yaw: REST_YAW, pitch: REST_PITCH };
  let spin = 0; // degrees per millisecond, left over from a flick
  let dirty = true;
  let touchedAt = -Infinity;
  let press: { id: number; x: number; y: number; t: number; touch: boolean } | null = null;
  let tween: gsap.core.Tween | null = null;

  const draw = (): void => {
    const ry = (pose.yaw * Math.PI) / 180;
    const rx = (pose.pitch * Math.PI) / 180;
    box.style.setProperty('--ry', pose.yaw.toFixed(2));
    box.style.setProperty('--rx', pose.pitch.toFixed(2));
    // Each side is lit by how squarely it faces the light once turned.
    sides.forEach((face) => {
      const n = NORMALS[face.dataset.side ?? ''];
      if (!n) return;
      // Same order as the stylesheet: turn about the upright axis, then tip.
      const x1 = n[0] * Math.cos(ry) + n[2] * Math.sin(ry);
      const z1 = -n[0] * Math.sin(ry) + n[2] * Math.cos(ry);
      const y2 = n[1] * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = n[1] * Math.sin(rx) + z1 * Math.cos(rx);
      const lit = Math.max(0, (x1 * LIGHT[0] + y2 * LIGHT[1] + z2 * LIGHT[2]) / LIGHT_LENGTH);
      const shade = Math.min(0.55, Math.max(0, 0.55 * (1 - lit / 0.72)));
      face.style.setProperty('--sh', shade.toFixed(3));
    });
    // A band of light slides across the wide sides as the box turns.
    box.style.setProperty('--sheen', (Math.sin(ry) * 130).toFixed(1));
    // The shadow on the floor is as wide as the box looks from the front.
    shadow.style.setProperty('--sw', (Math.abs(Math.cos(ry)) + Math.abs(Math.sin(ry)) * depthShare).toFixed(3));
    dirty = false;
  };
  draw();

  const section = (): Element | null => root.closest('section');
  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(64, now - last);
    last = now;
    // Nothing moves while the section is off screen (see motion.ts).
    if (section()?.hasAttribute('data-offscreen')) return;
    if (!press && !tween) {
      if (Math.abs(spin) > 0.002) {
        pose.yaw += spin * dt;
        spin *= Math.pow(0.92, dt / 16.7);
        dirty = true;
      } else if (!reducedMotion && now - touchedAt > IDLE_AFTER_MS) {
        pose.yaw += (IDLE_SPEED * dt) / 1000;
        // Ease the tip of the box back to its resting angle.
        pose.pitch += (REST_PITCH - pose.pitch) * Math.min(1, dt / 600);
        dirty = true;
      }
    }
    if (dirty) draw();
  });

  scene.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    tween?.kill();
    tween = null;
    spin = 0;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, touch: e.pointerType === 'touch' };
    try {
      scene.setPointerCapture(e.pointerId);
    } catch {
      // Not every pointer can be captured. Dragging still works over the box.
    }
    scene.classList.add('is-dragging');
  });
  scene.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    const dt = Math.max(1, e.timeStamp - press.t);
    pose.yaw += dx * 0.6;
    // On a touch screen, up and down scrolls the page, so a finger only spins the box.
    if (!press.touch) pose.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pose.pitch - dy * 0.45));
    spin = reducedMotion ? 0 : Math.max(-0.35, Math.min(0.35, (dx * 0.6) / dt));
    press.x = e.clientX;
    press.y = e.clientY;
    press.t = e.timeStamp;
    dirty = true;
  });
  const release = (e: PointerEvent): void => {
    if (!press || e.pointerId !== press.id) return;
    // Held still before letting go: no flick.
    if (e.timeStamp - press.t > 90) spin = 0;
    press = null;
    touchedAt = performance.now();
    scene.classList.remove('is-dragging');
  };
  scene.addEventListener('pointerup', release);
  scene.addEventListener('pointercancel', release);

  // The button turns the box a quarter at a time, for keyboards and for
  // anyone who would rather not drag.
  turnBtn.addEventListener('click', () => {
    tween?.kill();
    spin = 0;
    touchedAt = performance.now();
    const target = Math.round((pose.yaw - REST_YAW) / 90) * 90 + 90 + REST_YAW;
    if (reducedMotion) {
      pose.yaw = target;
      pose.pitch = REST_PITCH;
      dirty = true;
      return;
    }
    tween = gsap.to(pose, {
      yaw: target,
      pitch: REST_PITCH,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: () => {
        dirty = true;
      },
      onComplete: () => {
        tween = null;
        touchedAt = performance.now();
      },
    });
  });

  return root;
}
