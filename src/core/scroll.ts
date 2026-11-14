// Smooth scroll. Lenis is driven from GSAP's ticker so that scrolling,
// ScrollTrigger and the three.js render loop all advance on one clock.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

function navHeight(): number {
  return document.getElementById('nav')?.offsetHeight ?? 0;
}

export function initScroll(): Lenis {
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.11,
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

export { gsap, ScrollTrigger };
