// Members section: a binder page of member cards, built from members.json.
// Until the club supplies its member list, the binder shows clearly marked
// placeholder cards. Styles are in src/styles/members.css.
import { members, type CardColor, type Member } from '../content';
import { createCard, type CardData, type CardTone } from '../ui/card';
import { attachTilt } from '../ui/tilt';

const PLACEHOLDER_COUNT = 8;
const CYCLE: CardColor[] = ['chalk', 'tide', 'dusk', 'ember', 'grove'];

const number = (i: number): string => `#${String(i + 1).padStart(2, '0')}`;

function memberCard(member: Member, index: number): CardData {
  // A card takes the first color of the member's favorite commander. A
  // commander with no colors gets the club's gold.
  const tone: CardTone = member.colors[0] ?? 'gold';
  return {
    name: member.name,
    type: member.role,
    text: `Favorite commander: ${member.commander}`,
    number: number(index),
    tone,
    glyph: 'person',
    image: member.photo ? `${import.meta.env.BASE_URL}members/${member.photo}` : undefined,
    foil: true,
  };
}

function placeholderCard(index: number): CardData {
  return {
    name: 'Member name',
    type: 'Role',
    text: 'Favorite commander goes here.',
    number: number(index),
    tone: CYCLE[index % CYCLE.length]!,
    glyph: 'person',
    foil: true,
  };
}

/** For commanders of several colors, the pip shows each one as a slice. */
function pipFor(colors: CardColor[]): string | null {
  if (colors.length < 2) return null;
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `var(--${c}) ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `conic-gradient(${stops.join(', ')})`;
}

function pocket(data: CardData, index: number, colors: CardColor[] = []): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'pocket';
  const card = createCard(data);
  card.style.setProperty('--i', String(index));
  const pip = pipFor(colors);
  if (pip) card.style.setProperty('--pip', pip);
  attachTilt(card);
  wrap.append(card);
  return wrap;
}

function openPocket(index: number): HTMLElement {
  const link = document.createElement('a');
  link.className = 'pocket slotcard';
  link.href = '#join';
  link.style.setProperty('--i', String(index));
  const title = document.createElement('b');
  title.textContent = 'Open pocket';
  const text = document.createElement('span');
  text.textContent = 'Your card goes here.';
  link.append(title, text);
  return link;
}

export function initMembers(): void {
  const binder = document.getElementById('binder');
  if (!binder) return;

  const real = members.length > 0;
  const pockets = real
    ? members.map((m, i) => pocket(memberCard(m, i), i, m.colors))
    : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => pocket(placeholderCard(i), i));
  pockets.push(openPocket(pockets.length));
  binder.replaceChildren(...pockets);

  // The "placeholder cards" note is only true while the list is empty.
  if (real) document.getElementById('membersNote')?.remove();
}
