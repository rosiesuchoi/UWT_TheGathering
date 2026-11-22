// Small original pictures for card art boxes. Simple shapes only: no official
// game symbols. Each uses currentColor so the card's tone colors it.
import type { CardGlyph } from '../content';

export const GLYPHS = {
  cup: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 40h48v18a24 24 0 0 1-48 0z" fill="currentColor" stroke="none"/><path d="M70 44h6a9 9 0 0 1 0 18h-8"/><path d="M16 90h60"/><path d="M36 28c-4-6 4-8 0-14M54 28c-4-6 4-8 0-14"/></svg>',
  d20: '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="currentColor"/><path d="M50 24 77 68H23ZM50 4v20M90 27 77 68M10 27l13 41M50 96 23 68M50 96l27-28M10 73l13-5M90 73l-13-5M10 27l40-3M90 27l-40-3" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  people: '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><circle cx="68" cy="42" r="10" opacity=".65"/><path d="M50 84a19 19 0 0 1 38 0z" opacity=".65"/><circle cx="38" cy="36" r="13"/><path d="M12 84a26 26 0 0 1 52 0z"/></svg>',
  person: '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><circle cx="50" cy="38" r="16"/><path d="M18 92a32 32 0 0 1 64 0z"/></svg>',
  ticket: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 30h80v13a8 8 0 0 0 0 16v13H10V59a8 8 0 0 0 0-16z" fill="currentColor"/><path d="M64 35v32" stroke="rgba(255,255,255,.75)" stroke-width="3" stroke-dasharray="5 5"/></svg>',
  deck: '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><rect x="20" y="12" width="46" height="64" rx="6" opacity=".4"/><rect x="27" y="19" width="46" height="64" rx="6" opacity=".7"/><rect x="34" y="26" width="46" height="64" rx="6"/></svg>',
  plus: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" aria-hidden="true"><rect x="16" y="16" width="68" height="68" rx="12" stroke-dasharray="10 10"/><path d="M50 34v32M34 50h32"/></svg>',
  play: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="currentColor"/><polygon points="42,32 70,50 42,68" fill="rgba(0,0,0,.5)"/></svg>',
} as const;

/** 'mark' is the club logo, drawn with a CSS mask instead of inline SVG. */
export type GlyphName = keyof typeof GLYPHS | 'mark';

// Keeps the list in src/content/index.ts (which content files are typed
// against) in step with the pictures that exist here.
const _inSync: GlyphName extends CardGlyph ? (CardGlyph extends GlyphName ? true : never) : never = true;
void _inSync;
