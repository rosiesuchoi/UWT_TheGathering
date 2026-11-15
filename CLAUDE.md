# MTG @ UWT showcase site

A static showcase website for a brand new Magic: The Gathering club at the
University of Washington Tacoma. Its job: make a visitor think "I want to go to
that club" within ten seconds, then let them explore the club, its members and
its events. Treat it like a portfolio piece, not an app.

This is Artifact 5 for TCSS 490 (Autumn 2026).

## Dates
- Weekly check-in: portfolio link showing progress at the end of each of Weeks 6-9.
- Final show and tell in class: Monday, December 7, 2026. The site should be
  presentable by then.
- Due: Sunday, December 13, 2026, 11:59 PM.
- Graded on a genuine attempt at something big. Required by the rubric: a plan
  broken into pieces, this CLAUDE.md, a log (LOG.md), a deployed site, and a
  portfolio card with title, link and a short reflection.

## Scope
- In: static front-end site with three.js 3D moments, parallax, scroll-driven
  animation, and sections for the club, members and events.
- Out: no backend, no auth, no database, no store or payments.
- Content lives in local data files (members.json, events.json, club.json) so
  officers can update it without touching components.

## Club facts (from the club, 2026-11-14)
- Brand new club. Format: Commander.
- Thursdays 6 PM at Iruda Cafe. Fridays 6 PM at Silver King Games & Hobby.
- Events: a raffle with prizes every week; a Mutant Menace deck giveaway at the
  end of the school quarter.
- Discord: https://discord.gg/VwcpCWfbz
- Logo: gold crown-W on purple. Original in design/assets/logo-original.webp.
- Venue addresses found in online directories, NOT yet confirmed by the club:
  Iruda Cafe, 4916 Center St, Tacoma. Silver King Games & Hobby, 5442 S Tacoma
  Way, Tacoma, WA 98409.

Never invent real-sounding facts about the club. Where content is missing, use
obvious placeholders and list them under "Content still owed" below.

## Content still owed
- Member list (names, roles, favorite commanders, photos). Coming last.
- Official club name as it should appear on the site.
- Confirmation of the two venue addresses.
- Whether there is a vector (SVG/AI) version of the logo.
- Event photos, once the club has some.

## Constraints
- No official Magic card art, mana symbols, or Wizards of the Coast logos.
  Build an original visual language inspired by the game. Footer carries the
  Wizards Fan Content Policy disclaimer.
- Stack: Vite + TypeScript, three.js, GSAP ScrollTrigger, Lenis. No UI framework.
- Architecture rules learned in discovery: one persistent WebGL canvas behind
  the page; Lenis driven from gsap.ticker so scroll, ScrollTrigger and three.js
  share one clock.
- Hold 60fps on a mid-range laptop, respect prefers-reduced-motion, and give
  phones a lighter fallback for heavy WebGL.
- Fully responsive, keyboard navigable, readable contrast.
- Deploy: GitHub Pages. The URL should read "mtguwt" (repo or org name).

## Creative direction: Top Deck
Bright and collectible. The card is the interface.
- Page flow (club's request, 2026-11-14): the hero is the Top Deck concept
  frame exactly as drawn in design/concepts.html (two card backs, the foil
  "Your name here" card numbered 100/100, "Shuffle up. Draw seven."). Clicking
  that card plays a cutscene: the deck shuffles and deals onto a table. That
  lands on the Pod Night table scene (concept B), then the content sections
  follow below. The site must feel alive: idle motion everywhere.
- The table is the hub. Seven cards are dealt to it: Club and Members (top
  seat), Thursday (left), Friday (right), Raffle and Giveaway (center, as
  prizes), and the visitor's card at the open seat. Each card links to its
  section. The open "your seat" carries the Discord call to action.
- Table scene palette: espresso #17100c, felt #3d1d7a, lamp #ffb84d, cream
  #f3e7d3, with Caveat for handwritten life totals and labels.
- Section cards are numbered 001/100 to 006/100. The visitor's card is
  always 100/100.
- Every card uses the real 5:7 card ratio and one shared anatomy: name bar,
  art box, type bar, text box, collector number.
- Palette: paper #f1edf9, ink #1b1033, purple #4b2e83, gold #c9a23f, plus five
  accents in the game's order (chalk, tide, dusk, ember, grove) and holo foil.
- Type: Anton for display, Hanken Grotesk for text, JetBrains Mono for
  collector numbers and labels.
- 3D: a 100-card deck that shuffles and deals onto a lit 3D table, then stays
  on screen as a scroll tracker. Member cards have foil and pointer tilt. The
  cutscene must be skippable and must be skipped under reduced motion.
- The other two concepts are in design/concepts.html for reference only.

## Commands
- `npm run dev` - dev server at http://localhost:5173
- `npm run build` - type-check, then production build into dist/
- `npm run typecheck` - type-check only
- Mockups: `python -m http.server 4173 --directory design`, then
  http://localhost:4173/mockup.html

## Code map
- index.html - all section markup and headings. Static text lives here.
- src/content/*.json - club, events and members data. index.ts holds the types.
- src/styles/tokens.css - every color, font and layer. Change values here only.
- src/styles/base.css, layout.css - reset, type, nav, section shells, footer.
- src/core/scroll.ts - Lenis on GSAP's ticker, ScrollTrigger, scrollToTarget().
- src/core/stage.ts - the single WebGL canvas. 1 world unit = 1 CSS pixel at
  z = 0, origin at viewport center, so 3D objects can be placed over DOM
  elements from getBoundingClientRect().
- src/core/deck.ts - the 3D deck. Rests in the corner; for the cutscene it
  gathers, riffles, deals and goes home.
- src/core/fx.ts - where page code asks for a 3D effect. fx.deck is null
  until the three.js chunk has loaded, so callers must have a plain fallback.
- src/content/cards.ts - the seven table cards, built from club.json and
  events.json. Numbered 001/100 to 006/100, plus the visitor's 100/100.
- src/sections/table.ts - mounts the table cards and runs the cutscene:
  overlay, scroll jump, measuring where each DOM card rests, handing those
  spots to the deck, and revealing each DOM card as its 3D twin lands.
- src/ui/chrome.ts - nav, footer, club name and Discord links from club.json.
- src/ui/card.ts + src/styles/card.css - the one card component used by
  every section. Tones (gold, chalk, tide, dusk, ember, grove, foil), rare
  frame, foil layer. src/ui/glyphs.ts holds the art-box pictures.
- src/ui/tilt.ts - pointer tilt and foil tracking for any card.
- src/sections/*.ts + src/styles/<section>.css - one pair per section.
  hero.ts is the pattern to follow.
- design/ - concept board, approved mockup, logo sources. Reference only.

## Rules the code depends on
- Layering: section backgrounds are painted on ::before / ::after at
  z-index -2, the canvas is at -1, text is above. A section must never create
  a stacking context (no transform, opacity, filter, z-index or
  container-type on .sec or .hero), or its background will cover the canvas.
- Do not let GSAP transform an element whose pose is set with the CSS
  `rotate` / `translate` properties. GSAP bakes those into an inline
  transform and CSS keyframes on them stop working. Instead have JS set a
  CSS variable and let the stylesheet use it (see --px, --py, --sp in
  hero.css).
- Entrance animations hide their start state only under `.js` and only
  until the section gets `.is-ready`, with a CSS failsafe that reveals
  everything after 4 seconds if the script never runs.
- The cutscene is hybrid on purpose: table cards are DOM (crisp text, real
  links, readable by screen readers) and only the flying deck is 3D. During
  it, html gets class `cutscene`, which lifts the canvas above everything.
- The table layout assumes exactly two nights and two events.
- Testing animation: in dev, `window.__gsap` is exposed. Pause with
  `__gsap.globalTimeline.pause()` and set a timeline's `.time()` to inspect
  a frame. If the browser pane is hidden, frames only advance on capture.
- three.js is loaded with a dynamic import so the text shows first. Keep
  three imports out of main.ts and anything main.ts imports statically.
- The mockup is the visual spec. When building a section, port its markup
  and CSS from design/mockup.html, then replace the 2D stand-ins with 3D.
- Sections still to build are marked with a dashed `.stub` note in the page.

## How we work
Work in phases. At the end of each phase: stop, show the result (with
screenshots), and wait for approval before starting the next. Do not jump
ahead. Commit at the end of every phase and add an entry to LOG.md every
session.

1. Discovery - done 2026-11-14
2. Creative direction - done 2026-11-14. Picked C, "Top Deck" (see below)
3. Design - done 2026-11-14. Approved mockup: design/mockup.html
4. Foundation - done 2026-11-14
5. Sections - one at a time, each approved before the next:
   hero (done 2026-11-14), table + shuffle cutscene (built 2026-11-15,
   awaiting approval), club, nights, members, events, join
6. Motion and 3D polish
7. QA - real browser at desktop, tablet, phone; report what was measured
8. Deploy

Verify by running the site and looking at it. If something is not working or
was skipped, say so plainly.
