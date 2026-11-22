// Stand-in pictures for member cards: the art of famous mythic commanders,
// from a snapshot of Scryfall (commander-art.json, made by `npm run art`).
// The site never calls Scryfall: visitors' browsers only load the pictures.
// A member's own photo always wins over this. It is a stand-in, not a claim
// about anyone's favorite commander.
import poolData from './commander-art.json' with { type: 'json' };
import type { ArtRecord, Member } from './index';

export const artPool = poolData as ArtRecord[];

/** FNV-1a. The same name gives the same number in every browser. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (const ch of text.toLowerCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A two-faced card is known by its front face. */
export const artName = (art: ArtRecord): string => art.name.split(' // ')[0] ?? art.name;

/** Ids of the cards other members already wear. */
export function takenBy(others: readonly Member[], except?: Member): Set<string> {
  return new Set(others.flatMap((m) => (m !== except && m.art ? [m.art.id] : [])));
}

/** The same card for the same name every time, skipping cards another member wears. */
export function pickStandIn(name: string, taken: ReadonlySet<string> = new Set()): ArtRecord {
  const start = hash(name) % artPool.length;
  for (let i = 0; i < artPool.length; i++) {
    const card = artPool[(start + i) % artPool.length]!;
    if (!taken.has(card.id)) return card;
  }
  return artPool[start]!; // more members than cards: repeats cannot be avoided
}

/** A card nobody wears yet, chosen at random. For a member just added in the panel. */
export function randomStandIn(taken: ReadonlySet<string> = new Set()): ArtRecord {
  const free = artPool.filter((c) => !taken.has(c.id));
  const from = free.length > 0 ? free : artPool;
  return from[Math.floor(Math.random() * from.length)]!;
}

/** The next card in the pool after `current` that nobody else wears. */
export function nextStandIn(current: ArtRecord | null, taken: ReadonlySet<string> = new Set()): ArtRecord {
  const at = current ? artPool.findIndex((c) => c.id === current.id) : -1;
  for (let i = 1; i <= artPool.length; i++) {
    const card = artPool[(at + i + artPool.length) % artPool.length]!;
    if (!taken.has(card.id)) return card;
  }
  return artPool[(at + 1 + artPool.length) % artPool.length]!;
}

/** The art a member's card wears when it has no photo. */
export function memberArt(member: Member, all: readonly Member[]): ArtRecord {
  return member.art ?? pickStandIn(member.name, takenBy(all, member));
}
