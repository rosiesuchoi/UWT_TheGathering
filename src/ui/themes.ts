// Applies a favorite-set theme. Loaded only when a theme is chosen, so a visitor
// who never picks one downloads none of this (see src/ui/setpick.ts).
//
// A theme is six colors (src/content/set-themes.json). deriveTokens works out
// the rest, and one style rule sets them on the nav, the page and the footer.
// The officer panel sits outside those, so it keeps its own colors.
//
// A theme can also have extras (src/ui/extras/<code>.ts): an opening that plays
// when the visitor picks it, and Easter eggs that pop up while it is on. They
// are loaded only with that theme, and skipped under reduced motion.
import themeData from '../content/set-themes.json';
import { reducedMotion } from '../core/scroll';
import { deriveTokens, type Palette } from './themecolors';

export type Motion = 'drift' | 'shimmer' | 'pulse' | 'rain';

interface Theme {
  fx: Motion;
  /** Turns the cards' rainbow foil toward the set's colors. */
  foilHue: number;
  palette: Palette;
}

/** What a theme can add on top of its colors. */
export interface Extras {
  /**
   * An opening that plays when the visitor picks the theme. It calls `reveal`
   * once, at the moment the page should change, and `done` resolves when the
   * opening is over. `skip` ends it at once (reveal still happens).
   */
  intro?(reveal: () => void): { done: Promise<void>; skip(): void };
  /** Starts the Easter eggs and returns a function that stops them. */
  startEggs?(): () => void;
}

const themes = themeData as Record<string, Theme>;

/** Themes with extras, loaded only when that theme is shown. */
const extras: Record<string, () => Promise<Extras>> = {
  trk: () => import('./extras/trk').then((m) => m.default),
  fra: () => import('./extras/fra').then((m) => m.default),
};

/** Where the tokens apply. #themeFx is the ambient light layer, which sits outside <main>. */
const SCOPE = ':is(.nav, main, .foot, .tally, #themeFx)';
const STYLE_ID = 'setTheme';

/** Set the colors, or clear them for the club's own. */
function paint(code: string | null): void {
  const root = document.documentElement;
  const style = document.getElementById(STYLE_ID);
  const theme = code && Object.hasOwn(themes, code) ? themes[code] : undefined;
  if (!code || !theme) {
    root.removeAttribute('data-set');
    root.removeAttribute('data-fx');
    style?.remove();
    return;
  }
  const declarations = Object.entries(deriveTokens(theme.palette))
    .map(([name, value]) => `--${name}:${value};`)
    .join('');
  const rule = `html[data-set] ${SCOPE}{${declarations}--foil-hue:${theme.foilHue}deg;}html[data-set]{background-color:${theme.palette.paper};}`;
  const sheet = style ?? document.createElement('style');
  sheet.id = STYLE_ID;
  sheet.textContent = rule;
  if (!style) document.head.append(sheet);
  root.dataset.set = code;
  root.dataset.fx = theme.fx;
}

let run = 0;
let activeIntro: { skip(): void } | null = null;
let stopEggs: (() => void) | null = null;

/**
 * Show a set's colors and mood, or pass null to go back to the club's own.
 * `intro: true` plays the theme's opening, if it has one (a visitor picked it
 * just now). A newer call ends an opening that is still playing.
 */
export async function applyTheme(code: string | null, options: { intro?: boolean } = {}): Promise<void> {
  const mine = ++run;
  activeIntro?.skip();
  activeIntro = null;
  stopEggs?.();
  stopEggs = null;

  const load = code && Object.hasOwn(extras, code) ? extras[code] : undefined;
  if (!load) {
    paint(code);
    return;
  }
  let theme: Extras;
  try {
    theme = await load();
  } catch {
    paint(code); // the extras could not load (offline); the colors still work
    return;
  }
  if (mine !== run) return;

  if (options.intro && theme.intro && !reducedMotion) {
    const opening = theme.intro(() => {
      if (mine === run) paint(code);
    });
    activeIntro = opening;
    await opening.done;
    if (mine !== run) return;
    activeIntro = null;
  } else {
    paint(code);
  }
  if (theme.startEggs && !reducedMotion) stopEggs = theme.startEggs();
}
