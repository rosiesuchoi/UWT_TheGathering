// The corner deck: a small stack of cards that lives in the bottom right of
// the screen for the whole page. In Phase 4 it proves the pipeline (one
// canvas, one clock, scroll-linked 3D). Later it becomes the deck that
// shuffles in the cutscene and counts cards as they are drawn.
import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three';
import markUrl from '../assets/logo-mark.svg';
import { ScrollTrigger, reducedMotion } from './scroll';
import type { Stage } from './stage';

const CARD_W = 50;
const CARD_H = 70; // 5:7, the real card ratio
const CARD_T = 1.1;
const COUNT = 12;

/** Draw the card back (ink, gold border, gold mark) to a texture. */
function makeBackTexture(onReady: () => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 500;
  c.height = 700;
  const ctx = c.getContext('2d')!;
  const paint = (img?: HTMLImageElement) => {
    ctx.fillStyle = '#1b1033';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#c9a23f';
    ctx.lineWidth = 22;
    ctx.strokeRect(11, 11, c.width - 22, c.height - 22);
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
  const img = new Image();
  img.onload = () => {
    paint(img);
    tex.needsUpdate = true;
    onReady();
  };
  img.src = markUrl;
  return tex;
}

export function initDeck(stage: Stage): void {
  const group = new Group();
  const geo = new BoxGeometry(CARD_W, CARD_H, CARD_T);
  const edge = new MeshStandardMaterial({ color: 0xe9e2f5, roughness: 0.9 });
  const back = new MeshStandardMaterial({ map: makeBackTexture(() => undefined), roughness: 0.55, metalness: 0.1 });
  // Box faces: +x, -x, +y, -y, +z (front), -z (back)
  const materials = [edge, edge, edge, edge, back, back];
  for (let i = 0; i < COUNT; i++) {
    const card = new Mesh(geo, materials);
    card.position.z = i * CARD_T;
    card.rotation.z = (Math.sin(i * 12.9898) * 0.5) * 0.06; // slightly untidy stack
    group.add(card);
  }
  // Lean the deck back so the stack of edges is visible.
  group.rotation.x = -0.95;
  stage.scene.add(group);

  stage.onResize((width, height) => {
    const small = width < 700;
    const scale = small ? 0.8 : 1;
    group.scale.setScalar(scale);
    group.position.set(width / 2 - (small ? 44 : 64), -height / 2 + (small ? 52 : 70), 0);
  });

  if (reducedMotion) return;

  // Scroll turns the deck once over the length of the page.
  const spin = { turn: 0 };
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      spin.turn = self.progress;
    },
  });
  stage.onFrame((time) => {
    group.rotation.z = spin.turn * Math.PI * 2 + Math.sin(time * 0.8) * 0.05;
    group.position.z = Math.sin(time * 1.3) * 3;
  });
}
