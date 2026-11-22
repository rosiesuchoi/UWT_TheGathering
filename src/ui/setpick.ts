// The visitor's favorite Magic set, and the theme it brings.
//
// The site has no server, so the pick is kept in this browser only
// (localStorage), like the name on the visitor's card. Nobody else sees it.
// A visitor who has not picked anything downloads no theme code at all: the
// theme module (src/ui/themes.ts) is loaded only when there is one to show.
//
// Test switch, usable on any build: add ?set=fin to the address to see a theme
// without saving it, or ?set=none for the club's own colors.
import sets from '../content/sets.json';

type Line = 'in-universe' | 'universes-beyond' | 'secret-lair';
interface SetInfo {
  code: string;
  name: string;
  releasedAt: string;
  line: Line;
}

const KEY = 'mtguwt:set';
const list = sets as SetInfo[];
const GROUPS: Array<[Line, string]> = [
  ['in-universe', 'Magic sets'],
  ['universes-beyond', 'Universes Beyond'],
  ['secret-lair', 'Secret Lair'],
];

const known = (code: string | null): code is string => code !== null && list.some((s) => s.code === code);

function readSaved(): string | null {
  try {
    const value = localStorage.getItem(KEY);
    return known(value) ? value : null;
  } catch {
    return null; // storage can be blocked; the pick just lasts until the page closes
  }
}

function save(code: string | null): void {
  try {
    if (code) localStorage.setItem(KEY, code);
    else localStorage.removeItem(KEY);
  } catch {
    // Not saved. The theme still shows until the page is closed.
  }
}

/** The pick shown right now. */
let current: string | null = null;

async function show(code: string | null, intro = false): Promise<void> {
  current = code;
  const { applyTheme } = await import('./themes');
  await applyTheme(code, { intro });
}

/** Apply a saved pick, or a test pick from the address, as early as possible. */
export function initTheme(): void {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('set');
  const code = param === null ? readSaved() : known(param) ? param : null;
  current = code;
  // A returning visitor's theme just appears. Add ?intro to the test address to see a theme's opening.
  if (code) void show(code, params.has('intro'));
}

/** The "Favorite set" drop-down in the join section. */
export function initSetPicker(): void {
  const select = document.getElementById('setPick');
  const reset = document.getElementById('setReset');
  const status = document.getElementById('setStatus');
  if (!(select instanceof HTMLSelectElement)) return;

  const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  for (const [line, label] of GROUPS) {
    const group = document.createElement('optgroup');
    group.label = label;
    for (const set of list.filter((s) => s.line === line)) {
      const option = document.createElement('option');
      option.value = set.code;
      // Secret Lair is one set across many years, so it has no single month.
      option.textContent = line === 'secret-lair' ? set.name : `${set.name} (${month.format(new Date(`${set.releasedAt}T00:00:00`))})`;
      group.append(option);
    }
    select.append(group);
  }

  const sync = (): void => {
    select.value = current ?? '';
    if (reset) reset.hidden = current === null;
  };
  const choose = (code: string | null): void => {
    save(code);
    current = code;
    sync();
    const name = list.find((s) => s.code === code)?.name;
    if (status) status.textContent = name ? `Colors changed to ${name}.` : 'Back to the club colors.';
    // A pick made just now plays the theme's opening, if it has one.
    void show(code, code !== null);
  };

  select.addEventListener('change', () => choose(known(select.value) ? select.value : null));
  reset?.addEventListener('click', () => {
    choose(null);
    select.focus();
  });
  // Another tab changed the pick.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    void show(readSaved()).then(sync);
  });
  sync();
}
