// Smooth scroll. Lenis is driven from GSAP's ticker so that scrolling,
// ScrollTrigger and the three.js render loop all advance on one clock.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

// Reduced motion follows the visitor's system setting. Adding ?reduce-motion
// to the address forces it, for testing where that setting cannot be changed.
const forcedReduce = new URLSearchParams(window.location.search).has('reduce-motion');
if (forcedReduce) document.documentElement.classList.add('reduce-motion');
export const reducedMotion = forcedReduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

function navHeight(): number {
  return document.getElementById('nav')?.offsetHeight ?? 0;
}

export function initScroll(): Lenis {
  lenis = new Lenis({
    autoRaf: false,
    lerp: reducedMotion ? 1 : 0.11,
    // Lenis turns smoothing off by itself when the visitor prefers reduced motion.
    respectReducedMotion: true,
    // In-page links (#club, #nights...) scroll smoothly and stop below the nav.
    anchors: { offset: -navHeight() },
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Scroll to an element or selector, stopping below the sticky nav. */
export function scrollToTarget(target: string | HTMLElement, immediate = false): void {
  const offset = -navHeight();
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView();
}

/** Call fn with how far down the page the visitor is, from 0 to 1, whenever it changes. */
export function onScrollProgress(fn: (progress: number) => void): void {
  lenis?.on('scroll', (l: Lenis) => fn(l.progress));
}

/** Jump straight to a scroll position, even while scrolling is locked. */
export function jumpTo(y: number): void {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
  ScrollTrigger.update();
}

/** Stop or resume visitor scrolling. Used while the cutscene plays. */
export function lockScroll(lock: boolean): void {
  if (lock) lenis?.stop();
  else lenis?.start();
}

export { gsap, ScrollTrigger };
