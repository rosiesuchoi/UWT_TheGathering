// The seven cards that are dealt to the table. Six describe the club and the
// seventh is the visitor's. They are built from club.json and events.json, so
// editing those files changes the cards everywhere they appear.
import type { CardData } from '../ui/card';
import { cardTexts, club, events } from './index';

export interface SiteCard extends CardData {
  /** Slot on the table this card is dealt to. See index.html, [data-card]. */
  slot: string;
  /** Section the card jumps to. */
  href: string;
  /** Handwritten label under the card on the table. */
  label: string;
}

const numbered = (n: number): string => `${String(n).padStart(3, '0')}/100`;

function build(): SiteCard[] {
  const cards: Array<Omit<SiteCard, 'number'>> = [
    {
      slot: 'club',
      href: '#club',
      ...cardTexts.club,
      tone: 'gold',
      glyph: 'mark',
    },
    ...club.nights.map((n, i) => ({
      slot: `night-${i}`,
      href: '#nights',
      label: n.day.toLowerCase(),
      name: n.day,
      type: `Land — ${n.venueShort}`,
      text: `${n.day}s, ${n.time}.`,
      flavor: n.flavor,
      tone: n.tone,
      glyph: n.glyph,
    })),
    {
      slot: 'members',
      href: '#members',
      ...cardTexts.members,
      tone: 'grove',
      glyph: 'people',
    },
    ...events.map((e, i) => ({
      slot: `event-${i}`,
      href: '#events',
      label: '',
      name: e.cardName,
      type: `${e.cardType?.trim() || 'Event'} — ${e.cadenceShort}`,
      text: e.cardText,
      flavor: e.flavor,
      tone: e.tone,
      glyph: e.glyph,
      rare: e.rare,
      foil: e.rare,
    })),
  ];
  const numberedCards: SiteCard[] = cards.map((c, i) => ({ ...c, number: numbered(i + 1) }));

  // The visitor's card is always the 100th.
  numberedCards.push({
    slot: 'you',
    href: '#join',
    label: '',
    name: 'Your name here',
    type: cardTexts.you.type,
    text: cardTexts.you.text,
    flavor: cardTexts.you.flavor,
    number: '100/100',
    tone: 'foil',
    glyph: 'plus',
    foil: true,
  });
  return numberedCards;
}

export const siteCards: SiteCard[] = build();

/** Rebuild the cards from club.json and events.json after the admin panel edits them. Same array, new contents. */
export function rebuildSiteCards(): void {
  siteCards.splice(0, siteCards.length, ...build());
}

export function siteCard(slot: string): SiteCard | undefined {
  return siteCards.find((c) => c.slot === slot);
}
