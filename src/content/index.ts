// All site content comes from the JSON files in this folder. Officers edit
// those files; nothing here needs to change when content changes.
import clubData from './club.json';
import eventsData from './events.json';
import membersData from './members.json';

/** One of the five accent colors a card can take. */
export type CardColor = 'chalk' | 'tide' | 'dusk' | 'ember' | 'grove';

export interface Night {
  id: string;
  day: string;
  time: string;
  venue: string;
  address: string;
  /** False until the club confirms the address found online. */
  addressConfirmed: boolean;
}

export interface Club {
  name: string;
  nameConfirmed: boolean;
  school: string;
  format: string;
  discord: string;
  /** Officer-written intro. Null until provided. */
  blurb: string | null;
  nights: Night[];
}

export interface ClubEvent {
  id: string;
  title: string;
  cadence: string;
  text: string;
  date: string | null;
  /** Details the club still owes. Shown as placeholders until empty. */
  owed: string[];
}

export interface Member {
  name: string;
  role: string;
  /** Favorite commander, as free text. */
  commander: string;
  /** Colors of that commander. Sets the card's look. */
  colors: CardColor[];
  /** Path under public/members/, or null for the default silhouette. */
  photo: string | null;
}

export const club: Club = clubData;
export const events: ClubEvent[] = eventsData;
export const members: Member[] = membersData as Member[];
