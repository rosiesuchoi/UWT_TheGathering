// Color math for the favorite-set themes. Pure functions with no page code, so
// the site and scripts/check-contrast.mjs run the very same numbers.
//
// A theme is six colors. Everything else a page needs (the tinted paper, the
// foil gradient, the felt shades) is worked out from them here, so a new theme
// is six lines of data and cannot forget a token.

/** The six colors that make a theme. */
export interface Palette {
  /** Light page color. */
  paper: string;
  /** Text and dark sections. */
  ink: string;
  /** Main brand color: the violet section, links, headings' colored words. */
  purple: string;
  /** Accent: buttons, the club mark, colored words on dark sections. */
  gold: string;
  /** The table's cloth and the video poster. */
  felt: string;
  /** The lamp's glow and the table's labels. */
  lamp: string;
}

/** CSS custom property names (without the leading --) and their values. */
export type Tokens = Record<string, string>;

type RGB = [number, number, number];

const parse = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
};
const toHex = (c: RGB): string =>
  `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

/** t = 0 gives a, t = 1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const [pa, pb] = [parse(a), parse(b)];
  return toHex(pa.map((v, i) => v + (pb[i]! - v) * t) as RGB);
}

const linear = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = parse(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}
/** WCAG contrast ratio, from 1 to 21. */
export function ratio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE = '#ffffff';
const BLACK = '#000000';

/** Every color token a theme sets, worked out from its six colors. */
export function deriveTokens(p: Palette): Tokens {
  const paper2 = mix(p.paper, p.purple, 0.08);
  return {
    paper: p.paper,
    'paper-2': paper2,
    ink: p.ink,
    'ink-2': mix(p.ink, p.purple, 0.22),
    purple: p.purple,
    'purple-deep': mix(p.purple, BLACK, 0.35),
    gold: p.gold,
    'gold-pale': mix(p.gold, WHITE, 0.6),
    'gold-lite': mix(p.gold, WHITE, 0.2),
    'gold-foil': `linear-gradient(135deg, ${mix(p.gold, BLACK, 0.12)}, ${mix(p.gold, WHITE, 0.7)} 42%, ${mix(p.gold, WHITE, 0.2)} 60%, ${mix(p.gold, BLACK, 0.25)})`,
    felt: p.felt,
    'felt-hi': mix(p.felt, WHITE, 0.1),
    'felt-lo': mix(p.felt, BLACK, 0.3),
    lamp: p.lamp,
    'art-a': mix(p.purple, WHITE, 0.15),
    'art-b': mix(p.purple, BLACK, 0.55),
    line: mix(paper2, p.purple, 0.12),
    'line-2': mix(paper2, p.purple, 0.28),
    fx1: p.gold,
    fx2: p.lamp,
  };
}

/** The table's wood. Not part of a theme, but the lamp's labels sit on it. */
export const ESPRESSO = '#17100c';

export interface Check {
  what: string;
  fg: string;
  bg: string;
  /** WCAG AA: 4.5 for ordinary text, 3 for large headings. */
  min: number;
}

/** The text-on-background pairs the site actually draws, for one set of tokens. */
export function checks(t: Tokens): Check[] {
  return [
    { what: 'Body text on the page', fg: t.ink!, bg: t.paper!, min: 4.5 },
    { what: 'Body text on the tinted section', fg: t.ink!, bg: t['paper-2']!, min: 4.5 },
    { what: 'Text on dark sections and the footer', fg: t.paper!, bg: t.ink!, min: 4.5 },
    { what: 'Small labels on dark sections', fg: t['gold-pale']!, bg: t.ink!, min: 4.5 },
    { what: 'Big colored words on dark sections', fg: t.gold!, bg: t.ink!, min: 3 },
    { what: 'Text on the violet section', fg: t.paper!, bg: t.purple!, min: 4.5 },
    { what: 'Small labels on the violet section', fg: t['gold-pale']!, bg: t.purple!, min: 4.5 },
    { what: 'Links, nav and labels on the page', fg: t.purple!, bg: t.paper!, min: 4.5 },
    { what: 'Gold buttons', fg: t.ink!, bg: t.gold!, min: 4.5 },
    { what: 'Ink buttons', fg: t.paper!, bg: t.ink!, min: 4.5 },
    { what: 'Table labels on the wood', fg: t.lamp!, bg: ESPRESSO, min: 4.5 },
    { what: 'Video poster text on the felt', fg: t.paper!, bg: t.felt!, min: 4.5 },
    { what: 'Video poster labels on the felt', fg: t['gold-pale']!, bg: t.felt!, min: 4.5 },
  ];
}
