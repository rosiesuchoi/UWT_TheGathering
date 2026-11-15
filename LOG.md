# Project log

Newest entry first. One entry per working session: what was done, what was
decided, what is next.

## 2026-11-15 (Sun) - The table and the shuffle cutscene

**Done**
- Club approved the hero. Built the second Phase 5 section: the table.
  - The Pod Night table from the mockup: felt, four seats, swaying lamp,
    pulsing open seat with its Discord button, and seven cards that each
    jump to their section. Cards lift and straighten when pointed at.
  - The seven cards come from a new content file (cards.ts) that builds
    them out of club.json and events.json.
  - The shuffle cutscene, in three.js. Clicking the hero card dims the
    screen; the corner deck flies to the middle, riffles twice (splits into
    two piles and interleaves), then deals seven cards that fly to their
    exact spots on the table. Each 3D card turns edge-on as it lands and the
    real card flips in face up. The deck then returns to its corner.
  - Click or Escape skips it. Reduced motion skips it entirely. If 3D has
    not loaded, the cards flip in without the deck. Scrolling to the table
    instead of clicking also flips the cards in.
- Check, in a real browser at 1280 and 375 wide: build and type-check pass;
  no console errors; the cutscene runs start to finish and ends with all
  seven cards visible, the overlay gone and focus on the table; skipping by
  Escape and by click both end in the same clean state; paused frames show
  the split and the riffle; cards land on their mats; phone layout holds.
- Not confirmed: real-time speed and smoothness (the pane was hidden, so
  frames only advanced on capture). In two captures the first frame after a
  page load came out blank; a third capture of the same moment and a check
  of the page state were normal, so this looks like a capture artifact, but
  it is worth watching for a flash when the card is clicked.
- Not built: scrolling from the top does not scrub through the shuffle as
  the mockup note promised. It flips the cards in instead. Candidate for
  Phase 6.

- Club approved the table. Built the third Phase 5 section: the club.
  - The club card at full size with pointer tilt, the introduction, a dashed
    "owed" box where the officers' blurb will go (filled automatically once
    club.json has a blurb), and the four Commander facts.
  - Scroll reveal: the card arrives turned and lands face up, the text rises
    in line by line, and the four numbers count up from zero.
  - New shared helpers (motion.ts, motion.css) that the remaining sections
    will reuse, plus a slow drift on the dotted paper for depth.
- Check, in a real browser at 1280 and 375 wide: build and type-check pass,
  no console errors, no sideways scroll, the reveal looks right at its
  start, middle and end, the counters finish on 100, 1, 4 and 40, and the
  phone layout matches the mockup. Real-time feel still not watched.

- Club approved the club section. Built the fourth Phase 5 section: nights.
  - One block per night, generated from club.json: the night's card with
    pointer tilt, day, time, venue, address and an "Open in Maps" link (a
    map search for the venue, opening in a new tab).
  - Each address shows a "confirm" tag until addressConfirmed is set to true
    in club.json.
  - Reveal: the section darkens as it arrives, and the two cards come in
    from opposite sides.
- Check, in a real browser at 1280 and 375 wide: build and type-check pass,
  no console errors, no sideways scroll, both blocks render with the right
  venue and map link, the reveal looks right mid-way and at rest. The map
  links were checked for the right address text but not opened.

- Club approved the nights section. Built the fifth Phase 5 section: members.
  - A binder page of foil cards built from members.json, with the last
    pocket left open for the visitor (it links to the join section).
  - members.json is still empty, so the binder shows eight placeholder cards
    and a "Placeholder cards" tag. Both disappear on their own once the file
    has real entries.
  - A member's card takes the first color of their favorite commander, shows
    several colors as a split pip, and uses their photo if one is given.
  - Arrival: the page rises in and the cards drop into their pockets one by
    one. Foil is faint at rest and brightens under the pointer.
- Check, in a real browser at 1280 and 375 wide: build and type-check pass,
  no console errors, no sideways scroll, placeholders render in a 3 by 3
  page. Real entries were tested with four temporary test members (one
  color, two colors, five colors, no colors, and one very long name): cards,
  tones, split pips and the open pocket all rendered, long text clipped
  cleanly, and the placeholder note went away. The test entries were removed
  and members.json is back to empty. Member photos were not tested, since
  there are none yet.
- Not built: clicking a member card to flip it, which the mockup note
  mentioned. There is nothing extra to show on the back yet. Needs a
  decision from the club on what goes there.

- Club approved the members section. Built the sixth Phase 5 section: events.
  - The raffle and giveaway cards in a loose pile with the gold-framed rare
    on top, beside one entry per event built from events.json.
  - Each entry names what the club still owes ("prizes and how to enter:
    owed", "date: owed"). Those tags follow the `owed` list in events.json
    and vanish as it empties; a `date` shows in bold once set.
  - Arrival: the raffle card lands, the giveaway drops on top, and a gold
    flash marks the rare.
- Check, in a real browser: build and type-check pass, no console errors, no
  sideways scroll at 1280 or 375 wide; at 1280 the pile, both entries and
  the owed tags look right mid-reveal and at rest. At 375 the pile was
  checked by measurement only (it sits inside the screen with room to
  spare); the text below it was seen and reads correctly.

- Club approved the events section. Built the last Phase 5 section: join.
  - The visitor's foil card (100/100, "Your name here") on a gold block,
    rocking when idle and following the pointer, beside the invitation, the
    Discord button and a recap of the nights read from club.json.
  - Removed the last "Phase 5" placeholder notes; every section is now real.
- Check, in a real browser at 1280 and 375 wide: build and type-check pass,
  no console errors, no sideways scroll, the card, recap and Discord link
  are right, and both layouts match the mockup. The phone view of the
  events pile was also seen this time and looks right.
- Set the project up on GitHub at the club's request: added a README,
  connected the repository as `origin` and pushed `main`. Before pushing,
  removed a local folder path from this log and from an early preview
  config, including from earlier commits, since the repository may be
  public.

- Club approved the join section, completing Phase 5. Started Phase 6
  (motion and 3D polish). First pass:
  - Scrolling plays the shuffle. The first time a visitor scrolls from the
    top into the table, the cutscene plays by itself, a little faster than
    the clicked version. Once per browser tab. Trying to scroll on skips
    it, as do click and Escape. It does not start when the visitor arrived
    part-way down the page or clicked a link that travels past the table.
  - A "N / 7 played" counter under the corner deck that follows the section
    on screen (0, 1, 3, 4, 6, 7). Wide screens only.
  - The 3D deck now has rounded card corners, a border that follows them,
    and a soft shadow so it sits on the page.
  - The table responds to the pointer: the lamp drifts toward it and the
    table leans a few degrees. It lies flat during the cutscene.
  - The hero card gives slightly under the click.
- Check, in a real browser: build and type-check pass, no console errors.
  At 1280 wide: scrolling into the table started the shuffle and it ran to a
  clean end; a second visit in the same tab flipped the cards in instead; a
  nav link that travels past the table did not start it; an early wheel
  event was ignored and a later one skipped; the counter read 0, 0, 1, 3, 4,
  6, 7, 7 going down and followed back up; the table's lean and the lamp's
  drift both responded to a pointer. At 375 wide: no sideways scroll and the
  counter is hidden. Still not watched at real speed, and frame rate is
  still unmeasured (Phase 7).
- Phase 6 work is committed locally and not yet pushed; it goes to GitHub
  when approved.

- Club approved the Phase 6 pass; pushed it. Ran Phase 7 (QA). Everything
  below was measured, on the production build unless noted.

  **Lighthouse** (headless Chrome on the development laptop, three runs
  each, performance / accessibility / best practices / SEO):
  - Phone preset (slow 4G, CPU slowed 4x): start 87 / 96 / 100 / 91, end
    99-100 / 100 / 100 / 100. First paint 1.3-1.4 s, largest paint 3.4 s ->
    1.3-1.4 s, main thread blocked 250 ms -> 30-110 ms, layout shift 0,
    page weight 373 -> 219 KiB.
  - Desktop preset: start 99 / 100 / 100 / 91, end 94-96 / 100 / 100 / 100.
    First and largest paint 0.3-0.4 s, blocked 160-200 ms, layout shift 0,
    page weight 360 KiB.
  - The desktop performance number fell a few points while paint times
    improved (largest paint 0.8 s -> 0.4 s). The page now paints earlier, so
    more of the unchanged startup work is counted as "after first paint".
  - The phone score describes the first load before any touch. three.js
    then loads on the first touch, and that cost is not in the score.

  **Fixed because of QA**
  - Headline painted late on phones: its fade-in hid it for most of a
    second. It now rises without fading.
  - three.js startup blocked slow phones for about a second after the page
    appeared. Phones now load it on first touch.
  - Bug: after a full, unskipped shuffle the corner deck never returned to
    rest. It stopped swaying and turning, and redrew every frame.
  - Accessibility: the hero card's accessible name did not include its
    visible text; the home link had no name on phones.
  - Reduced motion left staggered pieces appearing late; delays now zero.
  - The scene now draws only when something changed.
  - Styles 23 -> 9.6 kB compressed (Latin-only display fonts). Added
    robots.txt. The hero hint no longer wraps at tablet width.

  **Layout** at 320, 375, 768, 1024, 1280 and 1440 wide, every section
  revealed: no sideways scroll, nothing sticking out, no clipped text.
  Smallest text 11 px (the small capital labels).

  **Reduced motion** (forced with ?reduce-motion; the system setting could
  not be changed in the test browser): no hidden content, table shown at
  once and flat, the hero card goes to the table with no cutscene and focus
  lands there, the 3D scene drew once and then stayed still.

  **Keyboard and structure**: 27 focusable elements, all named; tab order
  follows the page; one h1, then h2 and h3 with no skipped level; one each
  of header, nav, main, footer; no duplicate ids; all 7 external links open
  safely in a new tab.

  **3D cost** (dev build, this laptop's real graphics card): three.js
  starts in about 63 ms (load 43, canvas 18, deck 2.5). One frame is 45
  draw calls and 2,026 triangles. Resting on a phone-sized screen: 0 frames
  drawn over 180 ticks.

  **Links**: both map links answer. The Discord invite is valid but
  EXPIRES 2026-11-30, before the show and tell on December 7.

  **Not measured**
  - Frame rate during the shuffle and while scrolling. The test browser
    pane was hidden, so frames only advanced on capture. Use ?fps on a real
    screen.
  - Any real phone or tablet. Phone results are emulation on a laptop.
  - Browsers other than Chrome (Safari and Firefox untested).
  - A real screen reader. Names and structure were checked by tools only.
  - The site with JavaScript off. Headings and text are in the page, but
    cards, nights, members and events are built by script.

- Club approved the QA pass; pushed it. Started Phase 8 (deploy).
  - Added .github/workflows/deploy.yml: on every push to main, GitHub
    builds the site and publishes it to GitHub Pages. It can also be run by
    hand from the Actions tab.
  - Checked before pushing it: a fresh clone of the repository installs and
    builds with nothing but the committed files; the lockfile includes the
    Linux builds of the native tools the build machine needs; all 79 file
    references in the source match their file names exactly, including
    letter case (the build machine is Linux, where case matters); and the
    build, served from a /UWT_TheGathering/ sub-address like the one Pages
    uses, loads every file from under that address with no errors.
  - NOT LIVE YET. The repository is private, and GitHub Pages on a free
    account only publishes public repositories. Two settings on GitHub are
    needed, and only the repository owner can change them: make the
    repository public (or confirm the account has GitHub Pro), and set
    Settings > Pages > Source to "GitHub Actions". Until then the workflow's
    deploy step fails; the first push of the workflow will show one failed
    run.
  - Not verified: the workflow itself has not been seen running. The
    repository is private, so its Actions results cannot be read from here.
  - Noted for the owner before going public: every commit carries the
    author's email address, which becomes visible in a public repository.
    No local paths or personal details are in the files or their history.

- Owner decided to deploy through Vercel instead of GitHub Pages. The
  repository was still private when checked, and it can stay private.
  - Removed .github/workflows/deploy.yml. It never ran successfully and
    would have kept failing on every push.
  - Added vercel.json: build with `npm run build`, publish dist/, and cache
    the hashed files in /assets/ for a year.
  - NOT LIVE YET. This machine is not signed in to Vercel, so the project
    has to be created by the owner: sign in at vercel.com with GitHub,
    import the repository, name the project, deploy.
  - Checked: mtguwt.vercel.app is unclaimed, so a project named `mtguwt`
    should get that address.
  - Not verified: a build on Vercel. The same build command passed from a
    fresh clone on this machine.

- Owner imported the repository into Vercel as project `mtguwt`. Their
  screenshot shows a production deployment marked Ready, built in 7 seconds
  with 2 build warnings (not seen from here).
  - NOT REACHABLE BY THE PUBLIC YET. Checked from this machine:
    mtgforuwt.com, the domain attached to the project, does not resolve and
    the .com registry has no record of it; mtguwt.vercel.app returns "not
    found"; the two generated addresses redirect to a Vercel sign-in.
  - The deployment in the screenshot was built from the commit before the
    switch to Vercel and is marked "Stale", so the newest push may not have
    deployed. The pages are identical; only vercel.json (cache settings) is
    missing from it.
  - Not verified: anything on the live site. No public address worked.

- Owner added mtguwt.vercel.app to the project. THE SITE IS LIVE at
  https://mtguwt.vercel.app. Checked there, in Chrome:
  - The page, styles, scripts, fonts, favicon and robots.txt all load
    (12 files, none failing), over HTTPS, with no console errors. The page
    was ready in about 0.2 s on this connection.
  - The live files have the same fingerprinted names as a fresh local
    build, so the pages match the repository.
  - At 1024 wide: clicking the hero card played the whole shuffle in real
    time (riffle, deal, deck home) and ended with all seven cards on the
    table, the overlay gone and focus on the table.
  - At 375 wide: no sideways scroll, the menu button shows, three.js is not
    loaded until the first scroll and is loaded after it.
  - With ?reduce-motion: the hero card goes straight to the table, no
    cutscene, no hidden cards.
  - One phone-size capture taken right after load showed the hero part-way
    through its entrance (headline in, card fan not yet). The next capture
    was complete. Same capture quirk as before, but it has still not been
    ruled out on a real phone.
  - Not checked on the live site: a real phone, Safari, Firefox, frame rate.

**Open**
- Open https://mtguwt.vercel.app on a real phone and watch the first second
  and the shuffle. Add ?fps for a frame-rate readout.
- PUSHES ARE NOT REACHING THE LIVE SITE. The live build is still the one
  from the import. Four pushes since then (the switch to Vercel, two log
  updates, and an empty test commit with no co-author line) had not
  appeared three minutes after each of the last two. Tell: files under
  /assets/ are still served without the `immutable` caching that
  vercel.json sets. Cause unknown; the Vercel Deployments list will say
  whether they were blocked, failed or never started. The test commit
  rules out the co-author line as the only cause. The pages themselves are
  identical to the repository, so nothing visible is out of date yet.
- Replace the Discord invite with one that does not expire.
- Decide what, if anything, the back of a member card shows.
- Still owed by the club: official name, address confirmation, blurb,
  raffle details, giveaway date, member list.

**Next**
- Portfolio card: title, the live link, and a short reflection.
- Fill in the content the club still owes as it arrives.

## 2026-11-14 (Sat) - Discovery and creative direction

**Done**
- Wrote the working prompt for the project and ran Phase 1 (Discovery).
- Checked the machine: Node 24.20, npm 11.19, git 2.51 present. No GitHub CLI.
- Collected reference sites and one idea to borrow from each: Igloo Inc (3D
  world driven by plain scroll), Trionn (Lenis on GSAP's ticker), INK Games
  (one persistent canvas), "More Than a Portfolio" (scenes that settle), and
  pokemon-cards-css (CSS foil and pointer tilt for member cards).
- Got the rubric, club facts, Discord link and logo from the club.
- Created the project in a local folder outside OneDrive, so npm installs
  do not get synced.
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
