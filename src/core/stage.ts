// The one WebGL canvas for the whole page.
//
// The camera is set up so that one world unit equals one CSS pixel at z = 0,
// with the origin at the center of the viewport and y pointing up. That lets
// any 3D object be placed exactly over a DOM element by reading its
// getBoundingClientRect().
import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { gsap } from './scroll';

const FOV = 35;

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** Viewport size in CSS pixels. */
  size: { width: number; height: number };
  /** Run a callback every frame, before the scene is drawn. Time is in seconds. */
  onFrame(fn: (time: number, delta: number) => void): void;
  /** Run a callback after every resize. Also runs once right away. */
  onResize(fn: (width: number, height: number) => void): void;
  /**
   * Ask for the scene to be drawn on the next frame. The scene is only drawn
   * when something has changed, so a still page costs the graphics card
   * nothing. Anything that moves a 3D object must call this.
   */
  invalidate(): void;
  /** Convert a viewport position in CSS pixels to world x/y. */
  toWorld(clientX: number, clientY: number): { x: number; y: number };
}

export function initStage(canvas: HTMLCanvasElement): Stage | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    // No WebGL. The page still works; it just has no 3D layer.
    canvas.hidden = true;
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 10, 10000);
  scene.add(new AmbientLight(0xffffff, 1.6));
  const key = new DirectionalLight(0xfff1d6, 2.2);
  key.position.set(-300, 500, 800);
  scene.add(key);

  const size = { width: 0, height: 0 };
  const frameFns: Array<(time: number, delta: number) => void> = [];
  const resizeFns: Array<(width: number, height: number) => void> = [];
  let dirty = true;
  /** Frames actually drawn. Read by the ?fps readout and by tests. */
  let drawn = 0;

  function resize(): void {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    // Phones get a lower pixel ratio: sharp enough, far fewer pixels to fill.
    const cap = size.width < 700 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, cap));
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.position.z = size.height / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.updateProjectionMatrix();
    resizeFns.forEach((fn) => fn(size.width, size.height));
    dirty = true;
  }
  window.addEventListener('resize', resize);
  resize();

  // Drawn from GSAP's ticker: the same clock as Lenis and ScrollTrigger.
  gsap.ticker.add((time, deltaMs) => {
    const delta = deltaMs / 1000;
    frameFns.forEach((fn) => fn(time, delta));
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
    drawn++;
  });
  if (import.meta.env.DEV) Object.assign(window, { __stage: { drawn: () => drawn, info: () => renderer.info.render } });

  return {
    scene,
    camera,
    renderer,
    size,
    onFrame: (fn) => void frameFns.push(fn),
    onResize: (fn) => {
      resizeFns.push(fn);
      fn(size.width, size.height);
    },
    invalidate: () => {
      dirty = true;
    },
    toWorld: (clientX, clientY) => ({ x: clientX - size.width / 2, y: size.height / 2 - clientY }),
  };
}
