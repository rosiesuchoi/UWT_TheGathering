// Refreshes src/content/sets.json: the Magic sets a visitor can pick as their
// favorite. The site never calls Scryfall; this snapshot is all it reads.
// Run by hand (one request to Scryfall's /sets):
//
//   npm run sets
//
// To work from a copy you already saved, so nothing is requested again:
//
//   SETS_FILE=path/to/sets.json npm run sets
//
// Which sets: released between FROM and TO (inclusive), in paper, and either a
// full expansion or a masters-type set. Commander decks, Eternal sets, bonus
// sheets, promos, tokens, art series and Alchemy ride with their parent set and
// are not choices of their own. Secret Lair is parked for now (club decision,
// 2026-11-22): it is one Scryfall set dated 2019 whose drops are not separate
// sets, so it cannot be filtered by date. To bring it back, add `sld` to LINES
// as 'secret-lair', include it in `picked` below, and give it a palette.
//
// Scryfall's set data does not say whether a set is Universes Beyond, so LINES
// below is our own, written by hand. Check a new set there before it is listed.
//
// Follows Scryfall's API rules (https://scryfall.com/docs/api): a User-Agent and
// an Accept header. This makes one request, so there is nothing to pace.
import { readFile, writeFile } from 'node:fs/promises';

const AGENT = 'MTGatUWT-ClubSite/1.0 (mtgclub@uw.edu)';
const FROM = '2024-11-21';
const TO = '2026-11-21';
const OUT = new URL('../src/content/sets.json', import.meta.url);

/** Which line each set belongs to. Written by hand. */
const LINES = {
  // Magic's own settings
  inr: 'in-universe', // Innistrad Remastered
  dft: 'in-universe', // Aetherdrift
  tdm: 'in-universe', // Tarkir: Dragonstorm
  eoe: 'in-universe', // Edge of Eternities
  ecl: 'in-universe', // Lorwyn Eclipsed
  sos: 'in-universe', // Secrets of Strixhaven
  fra: 'in-universe', // Reality Fracture. NOT YET CONFIRMED by the club: check it is a Magic-only set.
  // Crossovers (Universes Beyond): other companies' properties
  fin: 'universes-beyond', // Final Fantasy
  spm: 'universes-beyond', // Marvel's Spider-Man
  tla: 'universes-beyond', // Avatar: The Last Airbender
  tmt: 'universes-beyond', // Teenage Mutant Ninja Turtles
  msh: 'universes-beyond', // Marvel Super Heroes
  hob: 'universes-beyond', // The Hobbit
  trk: 'universes-beyond', // Star Trek
};

const body = process.env.SETS_FILE
  ? JSON.parse(await readFile(process.env.SETS_FILE, 'utf8'))
  : await (async () => {
      const res = await fetch('https://api.scryfall.com/sets', { headers: { 'User-Agent': AGENT, Accept: 'application/json;q=0.9,*/*;q=0.8' } });
      if (res.status === 429) throw new Error('Scryfall says slow down (HTTP 429). Stopping; try again later.');
      if (!res.ok) throw new Error(`Scryfall answered HTTP ${res.status}`);
      return (await res.json()).data;
    })();

const inRange = body.filter(
  (s) => s.released_at && s.released_at >= FROM && s.released_at <= TO && !s.digital && (s.set_type === 'expansion' || s.set_type === 'masters'),
);
const picked = inRange;

const unknown = picked.filter((s) => !LINES[s.code]);
if (unknown.length > 0) {
  console.log('Sets with no line yet. Add them to LINES (and a palette to set-themes.json):');
  unknown.forEach((s) => console.log(`  ${s.code}  ${s.name}  (${s.released_at})`));
}

const sets = picked
  .filter((s) => LINES[s.code])
  .map((s) => ({ code: s.code, name: s.name, releasedAt: s.released_at, line: LINES[s.code] }))
  .sort((a, b) => a.releasedAt.localeCompare(b.releasedAt));

// A set listed in LINES that Scryfall no longer returns would silently vanish.
const missing = Object.keys(LINES).filter((code) => !sets.some((s) => s.code === code));
if (missing.length > 0) console.log(`In LINES but not found in range: ${missing.join(', ')}`);

await writeFile(OUT, JSON.stringify(sets, null, 2) + '\n');
console.log(`Wrote ${sets.length} sets to src/content/sets.json`);
sets.forEach((s) => console.log(`${s.releasedAt}  ${s.code.padEnd(4)} ${s.line.padEnd(17)} ${s.name}`));
