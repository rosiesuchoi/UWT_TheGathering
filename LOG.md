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
- Preview: `python -m http.server 4173 --directory design`, then open
  http://localhost:4173/mockup.html

**Decided**
- Stack: Vite + TypeScript, three.js, GSAP ScrollTrigger, Lenis, no framework.
- Hosting: GitHub Pages with "mtguwt" in the URL.
- Members content comes last; use marked placeholders until then.

**Open**
- Approve or change the page mockup.
- Confirm the official club name and the two venue addresses.
- Owed content marked in the mockup: club blurb, raffle prizes and how to
  enter, giveaway date, member list.

**Next**
- Phase 4: scaffold the Vite project, design tokens, layout and smooth scroll.
