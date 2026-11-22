// Checks every favorite-set theme for readable text (WCAG AA). Run by hand:
//
//   npm run contrast
//
// Uses the same color code as the site (src/ui/themecolors.ts), so these are
// the numbers the page really gets. The club's own colors are checked too, as
// the baseline. Exits with an error if any theme has a pair that fails.
import { readFile } from 'node:fs/promises';
import { checks, deriveTokens, ratio } from '../src/ui/themecolors.ts';

const themes = JSON.parse(await readFile(new URL('../src/content/set-themes.json', import.meta.url), 'utf8'));
const sets = JSON.parse(await readFile(new URL('../src/content/sets.json', import.meta.url), 'utf8'));
const nameOf = (code) => sets.find((s) => s.code === code)?.name ?? code;

// The club's own colors, as written in src/styles/tokens.css.
const club = {
  paper: '#f1edf9', 'paper-2': '#e4dcf4', ink: '#1b1033', 'ink-2': '#2a1b4d', purple: '#4b2e83', 'purple-deep': '#32096b',
  gold: '#c9a23f', 'gold-pale': '#f0dc9c', felt: '#3d1d7a', lamp: '#ffb84d',
};

let failures = 0;
const report = (title, tokens) => {
  const rows = checks(tokens).map((c) => ({ ...c, got: ratio(c.fg, c.bg) }));
  const bad = rows.filter((r) => r.got < r.min);
  const lowest = rows.reduce((a, b) => (a.got / a.min < b.got / b.min ? a : b));
  console.log(`${bad.length === 0 ? 'PASS' : 'FAIL'}  ${title.padEnd(34)} lowest margin: ${lowest.got.toFixed(2)} (needs ${lowest.min}) ${lowest.what}`);
  bad.forEach((r) => console.log(`        ${r.got.toFixed(2)} < ${r.min}  ${r.what}  (${r.fg} on ${r.bg})`));
  return bad.length;
};

report('The club colors (baseline)', club);
for (const [code, theme] of Object.entries(themes)) {
  failures += report(`${code}  ${nameOf(code)}`, deriveTokens(theme.palette));
}
console.log(failures === 0 ? '\nEvery theme passes.' : `\n${failures} failing pair(s).`);
process.exit(failures === 0 ? 0 : 1);
