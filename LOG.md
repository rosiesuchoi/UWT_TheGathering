# Project log

Newest entry first. One entry per working session: what was done, what was
decided, what is next.

## 2026-11-14 (Sat) - Discovery and creative direction

**Done**
- Wrote the working prompt for the project and ran Phase 1 (Discovery).
- Checked the machine: Node 24.20, npm 11.19, git 2.51 present. No GitHub CLI.
- Collected reference sites and one idea to borrow from each: Igloo Inc (3D
  world driven by plain scroll), Trionn (Lenis on GSAP's ticker), INK Games
  (one persistent canvas), "More Than a Portfolio" (scenes that settle), and
  pokemon-cards-css (CSS foil and pointer tilt for member cards).
- Got the rubric, club facts, Discord link and logo from the club.
- Created the project at a local folder, outside OneDrive so npm
  installs do not get synced.
- Traced the logo into a vector mark (design/assets/logo-mark.svg) and a
  transparent PNG, since the original is a flat image on a purple square.
- Built a board of three creative directions (design/concepts.html).

- Club picked direction C, "Top Deck".
- Built the Phase 3 page mockup (design/mockup.html): nav, hero, club, nights,
  members, events, join, footer. Static, with dashed "Motion" notes describing
  what will animate. Card faces are rendered from a small data array, which is
  the shape the content JSON will take.
- New idea that came out of the mockup: the opening hand of seven cards is the
  table of contents (Club, Thursday, Friday, Members, Raffle, Giveaway, You),
  and a small deck in the corner tracks how many have been drawn.
- Checked the mockup in a real browser at 1280, 768 and 375 wide: no sideways
  scroll at any width, all three fonts load, phone menu opens. Fixed along the
  way: heading wrapped too narrow in Nights, fan overlapped its caption, logo
  missing from the phone nav and the corner deck, foil too loud on member cards.
- Mockup revision 2, from club feedback: the hero is now the Top Deck concept
  frame exactly; clicking its card plays a shuffle-and-deal cutscene that
  lands on a new Pod Night table scene; the earlier sections stay below. The
  seven-card hand moved from the hero onto the table, where each card links to
  its section and the open seat carries the Discord button.
- Cutscene check: clicking the hero card runs every step, all seven cards
  land on their spots, the overlay clears and no errors are logged. The
  browser pane was hidden while testing, so animations only advanced when a
  frame was captured. Real-time speed and feel have NOT been watched yet.
- Preview: `python -m http.server 4173 --directory design`, then open
  http://localhost:4173/mockup.html

- Club approved the revised mockup. Built Phase 4 (Foundation):
  - Vite 8 + TypeScript 7 project, with three 0.187, gsap 3.15, lenis 1.3 and
    self-hosted fonts (fontsource), so the site needs no outside servers.
  - Design tokens, base type, nav with phone menu, a shell for every section
    with its real heading, and the footer.
  - Content files: club.json, events.json, members.json, with types. The
    footer nights, club name and every Discord link already read from them.
  - Smooth scroll: Lenis driven by GSAP's ticker, in-page links stop below
    the nav.
  - One WebGL canvas layered between section backgrounds and text, with a
    small 3D deck in the corner that turns as the page scrolls. It proves the
    canvas, the shared clock and the layering before any real 3D is built.
  - three.js is split into its own chunk and loaded after the text.
- Phase 4 check, in a real browser: build and type-check pass; no console
  errors; no sideways scroll at 1280 or 375 wide; the deck shows above every
  section color; clicking "Nights" lands on the section; the phone layout
  holds. Not checked: frame rate, and how the smooth scroll feels, because
  the browser pane was hidden during testing.
- Lesson: a container query on the hero trapped its background above the
  canvas (containment makes a stacking context). Moved it to an inner wrapper
  and wrote the rule into CLAUDE.md.

- Club approved the foundation. Built the first Phase 5 section, the hero:
  - The shared card component (card.ts, card.css, glyphs.ts) and pointer
    tilt (tilt.ts). Every later section reuses these.
  - The fan: two card backs and the foil "Your name here" card, built from
    club.json. The card rocks and shimmers when idle and follows the pointer.
  - Entrance: headline rises, the card drops in, the two backs fan out from
    behind it, then the hint appears.
  - Parallax: the three cards shift by different amounts with the pointer,
    and the fan drifts up and leans as the hero scrolls away.
  - Clicking the card goes to the table for now. The shuffle cutscene comes
    with the table section.
- Hero check, in a real browser: build and type-check pass, no console
  errors, no sideways scroll at 1280 or 375 wide, entrance mid-frame and end
  state both look right, pointer parallax and scroll progress variables
  update, phone layout matches the mockup. Not confirmed: the exact stopping
  point after clicking the card, and real-time feel, because the pane was
  hidden and frames only advanced on capture.
- Lesson: GSAP baked the cards' CSS resting pose into an inline transform,
  which broke the fan-out entrance. Switched parallax to CSS variables and
  wrote the rule into CLAUDE.md.

**Decided**
- Stack: Vite + TypeScript, three.js, GSAP ScrollTrigger, Lenis, no framework.
- Hosting: GitHub Pages with "mtguwt" in the URL.
- Members content comes last; use marked placeholders until then.

**Open**
- Approve the hero.
- Confirm the official club name and the two venue addresses.
- Owed content marked in the mockup: club blurb, raffle prizes and how to
  enter, giveaway date, member list.

**Next**
- Phase 5, second section: the table, its seven cards, and the shuffle
  cutscene in three.js.
