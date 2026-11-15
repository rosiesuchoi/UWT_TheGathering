// The deck: a stack of 3D cards that lives in the bottom right corner for the
// whole page, turning as the page scrolls. For the cutscene it flies to the
// middle of the screen, riffles, deals cards onto the table, and goes home.
//
// Coordinates: stage.ts makes one world unit equal one CSS pixel at z = 0, so
// a dealt card can land exactly on a DOM card.
import {
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
} from 'three';
import markUrl from '../assets/logo-mark.svg';
import type { DealTarget, DeckFx } from './fx';
import { ScrollTrigger, gsap, reducedMotion } from './scroll';
import type { Stage } from './stage';

const CARD_W = 50;
const CARD_H = 70; // 5:7, the real card ratio
const CARD_T = 1.1;
const CARD_R = 3.2; // corner radius, in the same units as the card
const COUNT = 22;
const HOME_TILT = -0.95; // leaning back in the corner, so the stack of edges shows
const SHOW_TILT = -0.5; // facing the visitor more during the shuffle
const TAU = Math.PI * 2;

/** A small fixed wobble per stack position, so the deck is not perfectly square. */
const jitter = (index: number): number => Math.sin(index * 12.9898) * 0.03;

/** Draw the card back (ink, gold border, gold mark) to a texture. */
function makeBackTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 500;
  c.height = 700;
  const ctx = c.getContext('2d')!;
  const paint = (img?: HTMLImageElement) => {
    ctx.fillStyle = '#1b1033';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#c9a23f';
    ctx.lineWidth = 22;
    // The border follows the card's rounded corners.
    const inset = 11;
    const radius = (CARD_R / CARD_W) * c.width - inset;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(inset, inset, c.width - inset * 2, c.height - inset * 2, radius);
    else ctx.rect(inset, inset, c.width - inset * 2, c.height - inset * 2);
    ctx.stroke();
    if (img) {
      const w = c.width * 0.46;
      const h = (w * 910) / 720;
      ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    }
  };
  paint();
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  // The card's faces are cut from a shape centered on zero, and their texture
  // coordinates are that shape's own x and y. Map those onto the image.
  tex.repeat.set(1 / CARD_W, 1 / CARD_H);
  tex.offset.set(0.5, 0.5);
  const img = new Image();
  img.onload = () => {
    paint(img);
    tex.needsUpdate = true;
  };
  img.src = markUrl;
  return tex;
}

/** A card with rounded corners: a rounded rectangle given a little thickness. */
function makeCardGeometry(): ExtrudeGeometry {
  const w = CARD_W / 2;
  const h = CARD_H / 2;
  const r = CARD_R;
  const shape = new Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  const geo = new ExtrudeGeometry(shape, { depth: CARD_T, bevelEnabled: false, curveSegments: 5 });
  geo.translate(0, 0, -CARD_T / 2);
  return geo;
}

/** A soft dark patch under the deck, so it sits on the page instead of floating. */
function makeShadow(): Mesh {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, 'rgba(10, 4, 24, 0.55)');
  g.addColorStop(0.55, 'rgba(10, 4, 24, 0.22)');
  g.addColorStop(1, 'rgba(10, 4, 24, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new CanvasTexture(c);
  const mesh = new Mesh(
    new PlaneGeometry(CARD_W * 2.1, CARD_H * 1.9),
    new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  mesh.position.set(0, -5, -2);
  mesh.renderOrder = -1;
  return mesh;
}

export function initDeck(stage: Stage): DeckFx {
  const group = new Group();
  const geo = makeCardGeometry();
  const edge = new MeshStandardMaterial({ color: 0xe9e2f5, roughness: 0.9 });
  const back = new MeshStandardMaterial({ map: makeBackTexture(), roughness: 0.5, metalness: 0.15 });
  // An extruded shape has two material slots: its two faces, then its rim.
  const materials = [back, edge];
  group.add(makeShadow());

  /** Cards from the bottom of the stack to the top. Shuffling reorders this. */
  let order: Mesh[] = [];
  for (let i = 0; i < COUNT; i++) {
    const card = new Mesh(geo, materials);
    order.push(card);
    group.add(card);
  }
  stage.scene.add(group);

  /** True while the deck is resting in its corner. False during the cutscene. */
  let idle = true;
  const spin = { turn: 0 };
  const home = { x: 0, y: 0, scale: 1 };

  function restack(): void {
    order.forEach((card, i) => {
      if (card.parent !== group) group.add(card);
      card.position.set(0, 0, i * CARD_T);
      card.rotation.set(0, 0, jitter(i));
      card.scale.setScalar(1);
      card.visible = true;
    });
  }
  function placeHome(): void {
    group.position.set(home.x, home.y, 0);
    group.scale.setScalar(home.scale);
    group.rotation.set(HOME_TILT, 0, spin.turn * TAU);
  }
  restack();

  stage.onResize((width, height) => {
    const small = width < 700;
    home.scale = small ? 0.8 : 1;
    home.x = width / 2 - (small ? 44 : 64);
    home.y = -height / 2 + (small ? 52 : 70);
    if (idle) placeHome();
  });

  if (!reducedMotion) {
    // Scroll turns the deck once over the length of the page.
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        spin.turn = self.progress;
      },
    });
    stage.onFrame((time) => {
      if (!idle) return;
      group.rotation.z = spin.turn * TAU + Math.sin(time * 0.8) * 0.05;
      group.position.z = Math.sin(time * 1.3) * 3;
    });
  }

  function gather(): gsap.core.Timeline {
    idle = false;
    // Unwind the scroll spin the short way.
    group.rotation.z %= TAU;
    // Big enough to read as the star of the scene, small enough that the two
    // riffle piles still fit side by side on a phone.
    const show = Math.min((stage.size.height * 0.34) / CARD_H, (stage.size.width * 0.26) / CARD_W);
    const tl = gsap.timeline();
    const fly = { duration: 0.65, ease: 'power3.inOut' };
    tl.to(group.position, { x: 0, y: stage.size.height * 0.04, z: 0, ...fly }, 0)
      .to(group.scale, { x: show, y: show, z: show, ...fly }, 0)
      .to(group.rotation, { x: SHOW_TILT, y: 0, z: 0, ...fly }, 0);

    // Two riffles. Each: split into two piles, then interleave them.
    let sim = order.slice();
    let t = 0.7;
    for (let round = 0; round < 2; round++) {
      const half = Math.ceil(sim.length / 2);
      const left = sim.slice(0, half);
      const right = sim.slice(half);
      const split = (pile: Mesh[], dir: number) =>
        pile.forEach((card, j) => {
          tl.to(card.position, { x: dir * CARD_W * 0.62, z: j * CARD_T, duration: 0.26, ease: 'power2.out' }, t)
            .to(card.rotation, { z: -dir * 0.1, duration: 0.26, ease: 'power2.out' }, t);
        });
      split(left, -1);
      split(right, 1);

      const next: Mesh[] = [];
      for (let j = 0; j < half; j++) {
        next.push(left[j]!);
        const r = right[j];
        if (r) next.push(r);
      }
      const t2 = t + 0.34;
      next.forEach((card, k) => {
        const at = t2 + k * 0.012;
        const rest = k * CARD_T;
        tl.to(card.position, { x: 0, duration: 0.3, ease: 'power2.inOut' }, at)
          .to(card.position, { z: rest + 10, duration: 0.15, ease: 'power1.out' }, at) // a small hop
          .to(card.position, { z: rest, duration: 0.15, ease: 'power1.in' }, at + 0.15)
          .to(card.rotation, { z: jitter(k), duration: 0.3, ease: 'power2.inOut' }, at);
      });
      t = t2 + next.length * 0.012 + 0.3 + 0.08;
      sim = next;
    }
    const final = sim;
    tl.call(() => { order = final; }, [], t);
    // Square the deck up with a small tap.
    tl.to(group.scale, { x: show * 1.05, y: show * 1.05, z: show * 1.05, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut' }, t);
    return tl;
  }

  function deal(targets: DealTarget[], onLand: (index: number) => void): gsap.core.Timeline {
    const tl = gsap.timeline();
    const fromTop = order.slice(-targets.length).reverse();
    targets.forEach((target, k) => {
      const card = fromTop[k];
      if (!card) return;
      const at = k * 0.13;
      const world = stage.toWorld(target.x, target.y);
      const scale = target.width / CARD_W;
      const flight = { duration: 0.6, ease: 'power2.inOut' };
      // Lift the card out of the deck into the scene, keeping where it is on
      // screen, then fly it to its spot on the table with one full turn.
      tl.call(() => { stage.scene.attach(card); }, [], at)
        .to(card.position, { x: world.x, y: world.y, ...flight }, at)
        .to(card.position, { z: 160, duration: 0.3, ease: 'power2.out' }, at)
        .to(card.position, { z: 1 + k * 0.2, duration: 0.3, ease: 'power2.in' }, at + 0.3)
        .to(card.rotation, { x: 0, y: 0, z: (-target.rotation * Math.PI) / 180 - TAU, ...flight }, at)
        .to(card.scale, { x: scale, y: scale, z: scale, ...flight }, at)
        // Turn edge-on, then hand over to the DOM card, which flips in face up.
        .to(card.rotation, { y: Math.PI / 2, duration: 0.16, ease: 'power1.in' }, at + 0.62)
        .call(() => {
          card.visible = false;
          onLand(k);
        }, [], at + 0.78);
    });
    return tl;
  }

  function goHome(): gsap.core.Timeline {
    const fly = { duration: 0.6, ease: 'power3.inOut' };
    return gsap
      .timeline({
        onComplete: () => {
          restack();
          idle = true;
        },
      })
      .to(group.position, { x: home.x, y: home.y, z: 0, ...fly }, 0)
      .to(group.scale, { x: home.scale, y: home.scale, z: home.scale, ...fly }, 0)
      .to(group.rotation, { x: HOME_TILT, y: 0, z: spin.turn * TAU, ...fly }, 0);
  }

  function reset(): void {
    restack();
    idle = true;
    placeHome();
  }

  return { gather, deal, home: goHome, reset };
}
