// The visitor's own name, for the 100/100 card.
//
// The site has no server, so the name is kept in this browser only
// (localStorage). Nobody else sees it. An officer adds a real member for
// everyone by editing src/content/members.json.

const KEY = 'mtguwt:visitor';
const MAX_LENGTH = 24;

/** What the visitor's card says until they sign it. */
export const VISITOR_PLACEHOLDER = 'Your name here';

type Listener = (name: string | null) => void;
const listeners = new Set<Listener>();

/** Trims, collapses spaces and caps the length. Empty becomes null. */
function clean(raw: string | null): string | null {
  const name = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH).trim();
  return name === '' ? null : name;
}

function read(): string | null {
  try {
    return clean(localStorage.getItem(KEY));
  } catch {
    return null; // storage can be blocked; the card just stays unsigned
  }
}

let current: string | null = read();

export function visitorName(): string | null {
  return current;
}

/** Sign the card, or pass null to clear it. Returns the name as stored. */
export function setVisitorName(raw: string | null): string | null {
  current = clean(raw);
  try {
    if (current) localStorage.setItem(KEY, current);
    else localStorage.removeItem(KEY);
  } catch {
    // Not saved. The name still shows until the page is closed.
  }
  listeners.forEach((fn) => fn(current));
  return current;
}

/** Called whenever the name changes, including from another tab. */
export function onVisitorName(fn: Listener): void {
  listeners.add(fn);
}

/** Keeps a card's name bar showing the visitor's name. */
export function bindVisitorCard(card: HTMLElement): void {
  const label = card.querySelector<HTMLElement>('.c-name > span');
  if (!label) return;
  const show: Listener = (name) => {
    label.textContent = name ?? VISITOR_PLACEHOLDER;
  };
  show(current);
  onVisitorName(show);
}

window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  current = read();
  listeners.forEach((fn) => fn(current));
});
