// Refreshes src/content/commander-art.json: a snapshot of well-known mythic
// legendary creatures that can be a commander, with their art crops. The site
// never calls Scryfall itself; visitors only load the pictures. Run by hand:
//
//   npm run art
//
// Which cards: a hand-picked list of famous commanders (CANDIDATES below).
// Scryfall's own popularity rank counts how often a card is played in the 99,
// not how often it leads a deck, so it ranks the wrong cards first. Each name
// is checked against Scryfall: it must be a legendary creature, mythic in some
// printing, legal in Commander and in paper, or it is dropped and reported.
//
// Follows Scryfall's API rules (https://scryfall.com/docs/api): a User-Agent
// and an Accept header on every request, a pause between requests, image
// addresses taken from the response and never built by hand.
import { writeFile } from 'node:fs/promises';

const AGENT = 'MTGatUWT-ClubSite/1.0 (mtgclub@uw.edu)';
const POOL_SIZE = 40;
const PAUSE_MS = 500; // Scryfall asks for 50-100 ms at least; a slow run is cheap, a ban is not.
const OUT = new URL('../src/content/commander-art.json', import.meta.url);

/**
 * Famous commanders, roughly most recognised first. Edit freely; the script verifies each.
 * Keep to Magic's own settings: crossover (Universes Beyond) cards carry other companies' art and marks.
 */
const CANDIDATES = [
  'Atraxa, Praetors\' Voice',
  'Edgar Markov',
  'The Ur-Dragon',
  'Korvold, Fae-Cursed King',
  'Muldrotha, the Gravetide',
  'Sheoldred, the Apocalypse',
  'Elesh Norn, Grand Cenobite',
  'Urza, Lord High Artificer',
  'Yawgmoth, Thran Physician',
  'Avacyn, Angel of Hope',
  'Kenrith, the Returned King',
  'Omnath, Locus of Creation',
  'Lyra Dawnbringer',
  'Griselbrand',
  'Nicol Bolas, the Ravager',
  'Kruphix, God of Horizons',
  'Purphoros, God of the Forge',
  'Heliod, Sun-Crowned',
  'Erebos, God of the Dead',
  'Sliver Overlord',
  'Jodah, Archmage Eternal',
  'Nekusar, the Mindrazer',
  'Vorinclex, Voice of Hunger',
  'Ao, the Dawn Sky',
  'Uro, Titan of Nature\'s Wrath',
  'Jin-Gitaxias, Core Augur',
  'Elenda, the Dusk Rose',
  'Sheoldred, Whispering One',
  'Emrakul, the Aeons Torn',
  'Ulamog, the Ceaseless Hunger',
  'Kozilek, Butcher of Truth',
  'Aurelia, Exemplar of Justice',
  'Ragavan, Nimble Pilferer',
  'Ghalta, Primal Hunger',
  'Toski, Bearer of Secrets',
  'Selvala, Heart of the Wilds',
  'Jhoira, Weatherlight Captain',
  'Sakashima of a Thousand Faces',
  'Prossh, Skyraider of Kher',
  'Zacama, Primal Calamity',
  'Tasigur, the Golden Fang',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': AGENT, Accept: 'application/json;q=0.9,*/*;q=0.8' } });
  if (res.status === 404) return null; // "no results" is a 404 on /cards/search
  if (res.status === 429) throw new Error('Scryfall says slow down (HTTP 429). Stopping; try again later.');
  if (!res.ok) throw new Error(`Scryfall answered HTTP ${res.status} for ${url}`);
  return res.json();
}

/** The fields the site needs, or null if this card cannot be used. */
function pick(card) {
  const face = card.image_uris ? card : card.card_faces?.[0];
  const art = face?.image_uris?.art_crop;
  const artist = card.artist ?? face?.artist;
  if (!art || !artist) return null;
  if (card.content_warning) return null; // Scryfall flags cards with content warnings
  return {
    id: card.id,
    name: card.name,
    artist,
    set: card.set,
    setName: card.set_name,
    art,
    page: card.scryfall_uri,
  };
}

const pool = [];
const dropped = [];
for (const name of CANDIDATES) {
  if (pool.length === POOL_SIZE) break;
  // Exact name, the earliest mythic printing in paper (not a promo or Secret Lair).
  const query = `!"${name}" f:commander t:legendary t:creature r:mythic game:paper -is:promo -s:sld prefer:oldest`;
  const result = await get(`https://api.scryfall.com/cards/search?${new URLSearchParams({ q: query, unique: 'cards' })}`);
  const entry = result?.data?.map(pick).find(Boolean);
  if (entry) pool.push(entry);
  else dropped.push(name);
  await sleep(PAUSE_MS);
}

await writeFile(OUT, JSON.stringify(pool, null, 2) + '\n');
console.log(`Wrote ${pool.length} cards to src/content/commander-art.json`);
pool.forEach((c, i) => console.log(`${String(i + 1).padStart(2)}. ${c.name} - ${c.setName} (${c.set}), art by ${c.artist}`));
if (dropped.length > 0) console.log(`\nDropped (not mythic, not legal, no art, or not found): ${dropped.join('; ')}`);
