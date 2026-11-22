// All site content comes from the JSON files in this folder. Officers edit
// those files; nothing here needs to change when content changes.
import clubData from './club.json';
import eventsData from './events.json';
import cardsData from './cards.json';
import membersData from './members.json';

/** One of the five accent colors a card can take. */
export type CardColor = 'chalk' | 'tide' | 'dusk' | 'ember' | 'grove';

/** Pictures available for a card's art box. See src/ui/glyphs.ts. */
export type CardGlyph = 'mark' | 'cup' | 'd20' | 'people' | 'person' | 'ticket' | 'deck' | 'plus';

export interface Night {
  id: string;
  day: string;
  time: string;
  venue: string;
  /** Short venue name that fits on a card's type line. */
  venueShort: string;
  address: string;
  /** False until the club confirms the address found online. */
  addressConfirmed: boolean;
  tone: CardColor;
  glyph: CardGlyph;
}

export interface Club {
  name: string;
  nameConfirmed: boolean;
  /** The browser tab's title and the description search engines show. */
  pageTitle: string;
  pageDescription: string;
  school: string;
  city: string;
  format: string;
  discord: string;
  /** GitHub repository ("owner/name") and branch the admin panel saves to. */
  repo: string;
  branch: string;
  /** Officer-written intro. Null until provided. */
  blurb: string | null;
  nights: Night[];
}

export interface ClubEvent {
  id: string;
  title: string;
  /** Short name for the card's name bar. */
  cardName: string;
  cadence: string;
  cadenceShort: string;
  text: string;
  /** Short text for the card's text box. */
  cardText: string;
  date: string | null;
  /** Details the club still owes. Shown as placeholders until empty. */
  owed: string[];
  tone: CardColor;
  glyph: CardGlyph;
  /** Gold frame. */
  rare: boolean;
  /**
   * Something the event gives away. Shown as a box the visitor can turn
   * (src/ui/prizebox.ts). `colors` are the deck's colors, as dots.
   */
  prize?: {
    name: string;
    kind: string;
    colors: CardColor[];
    /**
     * Folder under public/prizes/ holding front, back, left, right, top and
     * bottom .webp photos of the real box. Leave out for a drawn box.
     */
    photos?: string;
    /** Width, height and depth of the box as shares of its width, e.g. [1, 0.78, 0.24]. */
    size?: [number, number, number];
  };
}

/**
 * One card's art, as recorded from Scryfall by `npm run art` (see
 * scripts/fetch-commander-art.mjs). `art` is the picture's address, taken from
 * Scryfall's own response; `page` is the card's page, for the credit link.
 */
export interface ArtRecord {
  id: string;
  name: string;
  artist: string;
  set: string;
  setName: string;
  art: string;
  page: string;
}

export interface Member {
  name: string;
  role: string;
  /** Favorite commander, as free text. Null until the member says. */
  commander: string | null;
  /** Colors of that commander. Sets the card's look. Empty gives club gold. */
  colors: CardColor[];
  /** Path under public/members/, or null for the default silhouette. */
  photo: string | null;
  /**
   * Stand-in card art shown when there is no photo. Stored here so a member's
   * picture never changes by itself. Missing means "pick one from the pool"
   * (src/content/art.ts). A stand-in, not the member's favorite commander.
   */
  art?: ArtRecord | null;
}

/** The words on one of the table's cards. */
export interface CardWords {
  /** Handwritten label under the card on the table. */
  label: string;
  name: string;
  type: string;
  text: string;
}

/** Words for the cards that are not built from a night or an event. */
export interface CardTexts {
  club: CardWords;
  members: CardWords;
  you: { type: string; text: string };
}

export const club = clubData as Club;
export const cardTexts = cardsData as CardTexts;
export const events = eventsData as ClubEvent[];
export const members = membersData as Member[];
