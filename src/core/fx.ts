// A small meeting point between the page code (loaded first) and the 3D code
// (loaded after, in its own chunk). The page asks for an effect here; if the
// 3D chunk has not arrived, or WebGL is missing, the entry is null and the
// page falls back to a plain version.
// (The gsap.core types below come from GSAP's global type declarations.)

export interface DealTarget {
  /** Center of the card's landing spot, in viewport pixels. */
  x: number;
  y: number;
  /** Width of the card at rest, in pixels. */
  width: number;
  /** Resting rotation in degrees, clockwise, as CSS `rotate` gives it. */
  rotation: number;
}

export interface DeckFx {
  /** The corner deck flies to the middle of the screen and riffles twice. */
  gather(): gsap.core.Timeline;
  /** Deals one card from the top to each target. onLand(i) fires as card i arrives. */
  deal(targets: DealTarget[], onLand: (index: number) => void): gsap.core.Timeline;
  /** The deck returns to its corner. */
  home(): gsap.core.Timeline;
  /** Put everything back in the corner at once. Used when the cutscene is skipped. */
  reset(): void;
}

export const fx: {
  deck: DeckFx | null;
  /** Set while the 3D chunk is being fetched and started. Resolves either way. */
  loading: Promise<void> | null;
} = { deck: null, loading: null };
