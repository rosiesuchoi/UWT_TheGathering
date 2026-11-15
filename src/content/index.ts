// All site content comes from the JSON files in this folder. Officers edit
// those files; nothing here needs to change when content changes.
import clubData from './club.json';
import eventsData from './events.json';
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
  school: string;
  city: string;
  format: string;
  discord: string;
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

export interface Member {
  name: string;
  role: string;
  /** Favorite commander, as free text. Null until the member says. */
  commander: string | null;
  /** Colors of that commander. Sets the card's look. Empty gives club gold. */
  colors: CardColor[];
  /** Path under public/members/, or null for the default silhouette. */
  photo: string | null;
}

export const club = clubData as Club;
export const events = eventsData as ClubEvent[];
export const members = membersData as Member[];
