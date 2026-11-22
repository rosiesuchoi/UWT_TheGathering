// Applies a favorite-set theme. Loaded only when a theme is chosen, so a visitor
// who never picks one downloads none of this (see src/ui/setpick.ts).
//
// A theme is six colors (src/content/set-themes.json). deriveTokens works out
// the rest, and one style rule sets them on the nav, the page and the footer.
// The officer panel sits outside those, so it keeps its own colors.
import themeData from '../content/set-themes.json';
import { deriveTokens, type Palette } from './themecolors';

export type Motion = 'drift' | 'shimmer' | 'pulse' | 'rain';

interface Theme {
  fx: Motion;
  /** Turns the cards' rainbow foil toward the set's colors. */
  foilHue: number;
  palette: Palette;
}

const themes = themeData as Record<string, Theme>;

/** Where the tokens apply. #themeFx is the ambient light layer, which sits outside <main>. */
const SCOPE = ':is(.nav, main, .foot, .tally, #themeFx)';
const STYLE_ID = 'setTheme';

/** Show a set's colors and mood, or pass null to go back to the club's own. */
export function applyTheme(code: string | null): void {
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
