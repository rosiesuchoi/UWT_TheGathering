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
- Out: no backend, no database, no store or payments. The site has no
  accounts of its own. The one exception, added at the club's request on
  2026-11-15: an officer panel that signs in with a GitHub token (GitHub does
  the checking) and saves edits as a commit. It is still no server.
- Content lives in local data files (members.json, events.json, club.json) so
  officers can update it without touching components.

## Club facts (from the club, 2026-11-14)
- Brand new club. Format: Commander.
- Thursdays 6 PM at Iruda Cafe. Fridays 6 PM at Silver King Games & Hobby.
- Events: a raffle with prizes every week; a Mutant Menace deck giveaway at the
  end of the school quarter.
- Discord: https://discord.gg/kbevMqAuxD (from the club 2026-11-15; checked
  the same day: valid, never expires). The server is named "UW the
  Gathering".
- Logo: gold crown-W on purple. Original in design/assets/logo-original.webp.
- Venue addresses, found in online directories and confirmed by the club
  (told to the owner, entered in the officer panel 2026-11-15): Iruda Cafe,
  4916 Center St, Tacoma. Silver King Games & Hobby, 5442 S Tacoma Way,
  Tacoma, WA 98409.
- Club name on the site: "MTG @ UWT", confirmed by the club (set in the
  officer panel 2026-11-15). The Discord server and repository are still
  named "UW the Gathering".

Never invent real-sounding facts about the club. Where content is missing, use
obvious placeholders and list them under "Content still owed" below.

## Content still owed
- The four officers are in members.json (from the club, 2026-11-15). Still
  owed for each: favorite commander, its colors, and a photo. Their cards
  say "to be announced" until then. The rest of the member list is owed too.
- The giveaway date. Until then the prize box's back says "Date to be
  announced".
- Whether there is a vector (SVG/AI) version of the logo.
- Event photos, once the club has some.

## Constraints
- No official Magic card art, mana symbols, or Wizards of the Coast logos.
  Build an original visual language inspired by the game. Footer carries the
  Wizards Fan Content Policy disclaimer.
- One exception, by the club's decision on 2026-11-15: the giveaway prize
  box shows the club's own photos of the real Mutant Menace box, which
  carry Magic and Fallout logos and card art. It applies to that prize
  only. Everything else on the site stays original. The footer also names
  Bethesda as the owner of the Fallout marks and says the club is not
  affiliated with either company. Note for the club: the Wizards Fan
  Content Policy does not cover Fallout, which belongs to Bethesda.
- Stack: Vite + TypeScript, three.js, GSAP ScrollTrigger, Lenis. No UI framework.
- Architecture rules learned in discovery: one persistent WebGL canvas behind
  the page; Lenis driven from gsap.ticker so scroll, ScrollTrigger and three.js
  share one clock.
- Hold 60fps on a mid-range laptop, respect prefers-reduced-motion, and give
  phones a lighter fallback for heavy WebGL.
- Fully responsive, keyboard navigable, readable contrast.
- Deploy: GitHub Pages (owner's final decision, 2026-11-15, after a short
  try of Vercel). Live at https://rosiesuchoi.github.io/UWT_TheGathering/.
  The repository is public.
- That address is the club's official link (owner's choice, 2026-11-15).
  Use it in the README, the portfolio card and anything shared. index.html
  names it in a `rel="canonical"` tag.
- How it publishes: on every push to main, .github/workflows/deploy.yml
  builds the site and force-pushes dist/ to the `gh-pages` branch, which
  Pages serves. Never edit `gh-pages` by hand; it is replaced on each
  deploy. The build uses a relative base, so it works at any address.
- The run and the live build can be checked without signing in: the
  repository's Actions tab, or compare the file names in the live page's
  source with dist/assets after `npm run build`.
- The club wanted "mtguwt" in the URL. Renaming the repository to `mtguwt`
  would give rosiesuchoi.github.io/mtguwt (then update the `origin` remote
  and the addresses in this file and README.md). Not done.
- Second copy on Vercel: the project `mtguwt` from the Vercel try is still
  connected and serves the same site at https://mtguwt.vercel.app. It
  ignored pushes while the repository was private and has deployed them
  since it went public (first seen with commit 2a34ec5). It builds with
  Vercel's defaults; there is no vercel.json. Its dashboard cannot be read
  from this machine. It is not the official link. The owner may keep it as
  a spare or delete it.
- Repository: https://github.com/rosiesuchoi/UWT_TheGathering (remote
  `origin`, branch `main`). Push at the end of each approved step.
- Keep local machine paths and personal details out of committed files.

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
  club.ts is the pattern for content sections.
- src/ui/motion.ts + src/styles/motion.css - scroll reveals. Mark a section
  [data-reveal] and its pieces [data-rv] (or [data-rv="card"] for a played
  card) and they play in order when the section scrolls into view. Also
  onEnter() for one-off effects and the dotted-paper parallax.
- Owed content shows as a dashed `.owed` box or `.tbd` tag. Search for both
  before launch.
- Officer panel (src/admin/, src/styles/admin.css, src/ui/edits.ts). The
  footer's "Officer sign-in" button loads src/admin/admin.ts as its own
  chunk, so visitors never download it. There is no server and no password:
  an officer pastes a fine-grained GitHub token (this repository only,
  Contents: Read and write) and GitHub decides whether it may write. The
  token is kept in that browser (this tab only, or the device if ticked),
  never in the repository, and goes only to api.github.com.
  - Three things can be edited: words (any element with `data-edit="key"` in
    index.html; edits live in src/content/text.json as { key: html }),
    members (members.json), and club details and the two nights (club.json).
  - Save makes ONE commit on `main` with all changed files (git trees API),
    so it is one deploy. Nothing is forced: if the branch moved, GitHub
    refuses. Before committing, each changed file on GitHub must still equal
    what the page was built from, or the save stops with "changed on GitHub
    since this page loaded" (so two officers cannot overwrite each other).
    A save made a minute ago also trips this until the site republishes.
  - Edited words are stored as text plus <em> only, and rebuilt from text
    nodes on load, never inserted as markup (see ui/edits.ts). Keep it so.
    Names typed by visitors and officers always go in with textContent.
  - Add a new editable text by putting `data-edit="a-unique-key"` on an
    element in index.html whose content is plain text and <em>. Do not put
    it on elements that JS fills from JSON (cards, nights, the club blurb);
    those have their own fields in the panels.
  - The live preview in the panels redraws the members binder, the nights
    section, the footer, the club blurb and the join recap. The hero card
    and table cards update after the site republishes.
  - Anyone with a token that can write to the repository can change the
    site, and also its code. Treat officer tokens like keys. Tokens should
    expire (the sign-in link asks for 90 days).
  - Not covered: events, photos, adding or removing nights, new sections.
  - Built and tested against a pretend GitHub (every call mocked); the
    owner's first real save on 2026-11-15 then worked.
- src/ui/visitor.ts - the visitor's own name for the 100/100 card. The join
  section has a form that sets it; the hero, table, join and binder cards
  all show it. It is kept in localStorage (`mtguwt:visitor`) in that
  visitor's browser only. There is no server, so nobody else sees it, and
  the page must keep saying so. Real members are added by an officer in
  members.json.
- src/ui/prizebox.ts + src/styles/prizebox.css - the prize box. An event
  in events.json with a `prize` ({ name, kind, colors }) gets a six-sided
  box beside its entry that spins when dragged, idles slowly, and has a
  "Turn the box" button. It is CSS 3D made of page elements, not WebGL, so
  it needs no three.js and costs a phone almost nothing. Every size is a
  share of --bw. JS sets --ry, --rx, --sh, --sheen, --sw, and the box's
  proportions --hr and --dr. It rests while its section is off screen and
  does not idle or coast under reduced motion.
- The prize box has two looks. With `"photos": "<folder>"` in the prize,
  each side is a photo from public/prizes/<folder>/ (front, back, left,
  right, top, bottom .webp), and `"size": [1, height, depth]` gives the
  box's proportions as shares of its width. Without `photos` the sides are
  an original drawing that says it is a drawing. The photos are fetched
  only when the box nears the screen. A box wider than tall sits under its
  entry's text.
- Making the side photos: each side was cut out of a phone photo and
  squared up (a perspective warp from its four corners), which also removes
  the background. Orientation that the box depends on: top.webp has the
  back edge of the box at the top of the picture; bottom.webp has the front
  edge at the top; left and right are upright.
- The binder (src/sections/members.ts): pages of nine pockets (six on a
  phone), always with at least one page of spare sleeves so there is a page
  to turn to. Order: members, then the visitor's card or an open pocket,
  then empty sleeves.
- Members: while members.json is `[]` the binder shows eight marked
  placeholder cards. Each real entry is
  `{ "name", "role", "commander", "colors": ["tide", ...], "photo": null }`.
  `commander` may be null and `colors` may be `[]` while they are owed; the
  card then says "to be announced" and uses club gold.
  `colors` uses chalk, tide, dusk, ember, grove (white, blue, black, red,
  green); the first sets the card's look and several show as a split pip.
  `photo` is a file name inside public/members/, or null for the silhouette.
  Only add members who have agreed to appear on a public site.
- design/ - concept board, approved mockup, logo sources. Reference only.
- .github/workflows/deploy.yml - builds the site and publishes it to GitHub
  Pages on every push to main. Every push to main goes live, so only push
  work that has been approved.
- public/.nojekyll - tells Pages to serve the files as they are.

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
- Binder page turns. At rest a page is a plain grid in reading order. For
  the length of a turn its pockets are moved into column strips nested
  inside each other, so each column hinges on the one before and the page
  bends. Rules that keep it working:
  - The folded layout must match the resting grid to the pixel (same gap,
    same pocket size), or the page jumps when a turn starts. All pockets
    share one aspect ratio for this reason.
  - Nothing between .b-stage and a .b-strip may get opacity, filter or
    overflow: those flatten the 3D bend.
  - Moving pockets replays CSS arrival animations, so the binder gets
    `.settled` before the first turn and the arrival rule excludes it.
  - JS only sets --a, --sh and --under; members.css applies them.
  - Buttons turn pages too, and under reduced motion pages swap at once.
- When the cutscene plays: on a click of the hero card or "Replay the
  shuffle" (always), and by itself the first time the visitor scrolls from
  the top into the table (once per browser tab, remembered in
  sessionStorage under `mtguwt:dealt`). It never auto-plays when the
  visitor arrived part-way down the page or is travelling to an in-page
  link. Click, Escape, or trying to scroll on all skip it.
- The table leans toward the pointer (--tx / --ty on #table). It must lie
  flat while cards are dealt, because their landing spots are measured on
  it: `.cutscene .tbl { transform: none }`.
- src/ui/tracker.ts - the "N / 7 played" counter under the corner deck.
- Testing scroll logic in a hidden pane: `__st.update()` (dev only) forces
  ScrollTrigger to re-check after a scripted scroll.
- Testing animation: in dev, `window.__gsap` is exposed. Pause with
  `__gsap.globalTimeline.pause()` and set a timeline's `.time()` to inspect
  a frame. If the browser pane is hidden, frames only advance on capture.
- Performance rules that came out of QA, each backed by a measurement:
  - Screens 700px wide or less load three.js on the first touch, scroll or
    key press, not at page load (main.ts). At load it blocked a slow phone
    for about a second.
  - The scene is drawn only when something changed. Anything that moves a
    3D object must call `stage.invalidate()`. On phones the resting deck
    does not sway, so a still page draws nothing.
  - The hero headline must not fade in from invisible. It is the largest
    element on the first screen and the fade delayed "largest paint" from
    1.4 s to 3.5 s in the phone test. It rises without fading.
  - The headline and text fonts are preloaded in index.html. Display, mono
    and handwriting fonts ship Latin only.
  - Looping animations pause while their section is off screen. Add new
    loops to the [data-offscreen] list in motion.css. Do not use a
    catch-all selector there.
- A timeline handed to `run()` in table.ts gets its onComplete replaced.
  Put end-of-timeline work in a `.call()` step, never in the timeline's own
  onComplete (this once left the deck stuck after a full shuffle).
- Reduced motion zeroes animation delays as well as durations.
- Test switches, usable on any build: add `?reduce-motion` to force reduced
  motion, `?fps` for a frame-rate readout.
- Card links and buttons take their accessible name from their visible
  text. Extra words for screen readers go in the `label` option, which adds
  hidden text; do not use aria-label on cards.
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
   hero (done 2026-11-14), table + shuffle cutscene (done 2026-11-15),
   club (done 2026-11-15), nights (done 2026-11-15), members (done
   2026-11-15), events (done 2026-11-15), join (done 2026-11-15)
6. Motion and 3D polish - first pass done 2026-11-15
7. QA - done 2026-11-15. Results are in LOG.md.
8. Deploy - live on GitHub Pages 2026-11-15 at
   https://rosiesuchoi.github.io/UWT_TheGathering/. Checks are in LOG.md.
9. Additions asked for on 2026-11-15, each approved before it is pushed
   (a push goes live):
   - Officers in the binder, visitors sign their own card, binder pages
     turn by drag - approved and pushed 2026-11-15.
   - A prize box for the giveaway that can be turned around, in the events
     section. First as an original drawing - approved and pushed
     2026-11-15. The club then sent photos of all six sides and asked for
     the real box - approved and pushed 2026-11-15.
   - Officer panel: sign in with a GitHub token, edit words, members, club
     details and the two nights, and save as one commit that deploys by
     itself - built, approved and pushed 2026-11-15. First real save
     with a real token worked 2026-11-15 (two commits, both deployed).

Verify by running the site and looking at it. If something is not working or
was skipped, say so plainly.
