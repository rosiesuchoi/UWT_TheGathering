# Project log

Newest entry first. One entry per working session: what was done, what was
decided, what is next.

## 2026-11-21 (Sat) - Scryfall art for the binder (integrations, step 1 of 3)

The club asked for three integrations: Scryfall art on the member cards, a
video section, and favorite-set themes. This session was the first only.
Built, committed locally, not pushed (a push goes live).

**Done**
- Member cards in the binder now wear stand-in commander art from Scryfall
  when the member has no photo. The four officers have Lyra Dawnbringer,
  Ulamog (the Ceaseless Hunger), Kruphix (God of Horizons) and Nekusar (the
  Mindrazer). No card CSS was changed; the picture fills the existing art box.
- `npm run art` (scripts/fetch-commander-art.mjs) builds
  src/content/commander-art.json: 37 famous mythic legendary creatures, from a
  hand-picked list that the script checks against Scryfall (legendary
  creature, mythic in some printing, legal in Commander, in paper, earliest
  non-promo, non-Secret-Lair printing). The club approved the list after
  seeing every card at the real art-box shape; cards 31 (Mondrak, an abstract
  pattern) and 32 (Elesh Norn, Mother of Machines, a grayscale sketch) were
  dropped, and Rhys the Redeemed was dropped earlier because his only mythic
  printing is from the Avatar crossover set.
- Why a hand-picked list: Scryfall's EDHREC order counts play in the 99, not as
  a commander, so it put Ragavan above Atraxa and surfaced obscure cards.
- The site makes no Scryfall API calls. Visitors' browsers load only the
  pictures (cards.scryfall.io). Each member's `art` record is stored in
  members.json so a picture never changes by itself; a member without one gets
  a stable pick from the pool (hash of the name).
- Officer panel: each member shows their stand-in card with a "Different
  picture" button; "Add a member" gives a random free card.
- Footer: a collapsed "Card art credits" list (card, artist, set, link to its
  Scryfall page) that follows the panel's live preview, and the legal notice now
  names Wizards as the owner of the Magic trademark. The binder's note says the
  pictures are stand-ins, not anyone's favorite.
- CLAUDE.md records the second art exception (member profile pictures only, no
  crossover cards), the code map entries and the script rules. README mentions
  `npm run art`.

**Checked** (dev build, Chrome pane, 1280 and 375 wide)
- Type-check and production build pass. Main bundle 169.4 -> 184.7 kB (62.6 ->
  67.6 kB gzip): the pool is about +5 kB gzip.
- The page made 4 image requests to cards.scryfall.io and none to
  api.scryfall.com. Layout shift 0. Art boxes are 163 x 131 px at 1280 wide.
- A picture that fails to load falls back to the card's drawing (forced with an
  error event). Alt text reads "Art of {card} by {artist}".
- Panel (against a pretend GitHub, fake token): "Different picture" changed a
  card and the footer credit; "Add a member" gave a new member a free card; the
  art control fits at 375 wide. A real reload put everything back.
- Binder page turn works, both under reduced motion and animated (the animated
  turn needed extra frame captures because the pane is hidden). No console
  errors. No sideways scroll at 375.

**Not verified**
- A real save from the panel with a changed `art` (the save path is the
  existing members.json commit; not run this time), a real phone, Safari,
  Firefox, a screen reader.
- Scryfall's image terms and Wizards' Fan Content Policy were only checked
  through search summaries, not read in full. The club should read both before
  this goes live, in particular the rule about cropped art and artist credit
  (we show a text credit) and the policy's position on card art.
- An early run of the script hit HTTP 429 (too many requests in a short time).
  It stopped as designed and was not retried; the pause is now 500 ms.

**Next**
- Approval to push step 1. Then step 2 (video section) and step 3 (favorite-set
  themes), each with its own plan first.

## 2026-11-15 (Sun) - The table and the shuffle cutscene

**Done**
- Friday event flyer for the club's event page (its photo slot asks for a
  2:1 image, 2000 x 1000 px recommended, with faces and text near the
  centre). Source: design/flyer/friday.html; picture:
  design/flyer/friday-flyer.png (2000 x 1000). Top Deck look on the lit table
  from concept B: huge Anton "FRIDAY", "Commander night" in the Friday teal,
  the site's own cards (Friday 003/100, Raffle 005/100, the foil 100/100) and
  card backs, 40-life scribble, gold raffle seal. Everything that matters
  sits in the middle 1000 px, so a square crop keeps it. Facts only from
  club.json: Fridays 6 PM, Silver King Games & Hobby with its address, the
  weekly raffle, the Discord link. No date, price or "newcomers welcome"
  claims. Inspiration from Awwwards' typography picks: oversized type, an
  accent word, dark lamp-lit scenes. Not pushed (not part of the site).
  Re-render: Chrome headless, command at the bottom of friday.html.
  - Revised at the club's request: cards, Discord link and the 40 life
    totals removed; calmer full-bleed design (felt-purple gradient, grain,
    faint club mark, left-aligned type). Added a QR code (design/flyer/qr.svg)
    for https://rosiesuchoi.github.io/UWT_TheGathering. Decoded from the
    rendered PNG with a QR reader: it returns exactly that address. If the
    site moves to a custom domain, remake qr.svg and the PNG.
    The printed web address under the QR was then removed at the club's
    request; the QR alone remains.
  - Also removed the "UW Tacoma Commander club" line. Pushed into the
    club's Canva account as an editable design (text, QR and background
    separated by Canva's layer tool): "MTG @ UWT - Friday Commander Night
    flyer". Canva swapped some fonts, so it is close to, not identical to,
    friday-flyer.png (which stays the master).
  - Optional in-joke version (design/flyer/friday-memes.html and
    friday-flyer-memes.png): two small touches in faint fine print. "No
    take-backs. Mulligans negotiable. Politics encouraged." and "*Sadly,
    not a Black Lotus." after the raffle's "with prizes". Words only, no
    card art. The clean flyer remains the default; the Canva copy is the
    clean one.
  - Added the club's accessibility notice to the main flyer (two small
    lines under the details, with mtgclub@uw.edu). The club's wording had
    "it's"; the flyer says "its", the correct word. The notice is not on the
    in-joke version. QR re-checked: still decodes. The Canva design was
    updated in place with the same notice (as an editable text box; Canva
    cannot bold just the email, and uses its own font for that box).
- Club asked for the entire site to be editable, including text, so the
  site can be handed to other members who do not code. Built it; approved
  and pushed (commit 1fe09e4). The deploy run succeeded; the live page serves
  the same bundle as a local build, the panel chunk loads (200), and the
  page carries the panel-only words.
  - Audit: before this, 12 headings and paragraphs, members, the club and
    nights were editable. Not editable: the labels, buttons, menu and footer
    words, events, the words on the table's cards, the page title, member
    photos.
  - Now editable: 26 more words typed on the page (labels, the Commander
    facts' captions, footer headings); 16 words inside links and buttons
    (menu, Discord buttons, replay, the table's handwriting, footer links),
    edited in a "Buttons and links" tab because typing in a link would follow
    it; events (title, description, date, owed list, card words); the words
    on the club, members and visitor cards (new cards.json); the browser tab
    title and search description (club.json, written into the page HTML at
    build time by a small Vite plugin so search engines see it); member
    photos (picked, shrunk to 720 px WebP in the browser, uploaded in the
    same commit as a binary blob).
  - The bar now has one "Edit details" button that opens a panel with five
    tabs, so the phone bar stays small (about 18% of the screen at 375x812).
  - Handing on: found and checked in GitHub's documentation that a
    fine-grained token cannot reach a repository owned by someone else's
    personal account. Invited officers therefore use a classic token with
    `public_repo`; the sign-in box now offers both routes. The README says
    how the owner adds and removes officers. Moving the repository into a
    GitHub organization would give every officer the safer token but
    changes the public address; left for the club to decide.
  - Not editable on purpose: the legal notice (fan content rules), the
    Commander facts' numbers (the count-up animation owns them), and adding
    or removing a night or event (the table fits exactly two of each).
  - Checked in the browser against a pretend GitHub (every call stubbed):
    26 words inline and 16 in the panel; edits in every tab appear on the
    page as typed (event date and cleared owed tag, button words, tab
    title); one save sent one commit with five JSON files plus the photo as
    a blob (webp, base64), nothing forced; a text file as a "photo" is
    refused with a plain message; sign-in box shows both token routes;
    a visitor's page loads no panel code and has nothing editable; no sideways
    scroll at 375 wide. Production build passes type-check.
  - Not checked: a real save with a photo or a classic token, a real phone,
    Safari and Firefox, a screen reader. Whether a classic token's `public_repo`
    scope is enough for a collaborator to write through the git data API is
    expected from GitHub's docs but not run here.
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

- Pushes never reached the Vercel site. The live build there stayed the one
  from the import; five pushes after it (including an empty test commit
  with no co-author line) did not appear. Cause not found: the Vercel
  dashboard cannot be read from this machine.
- Owner made the repository public and decided to go back to GitHub Pages.
  THE SITE IS LIVE at https://rosiesuchoi.github.io/UWT_TheGathering/.
  - Removed vercel.json. Restored .github/workflows/deploy.yml in a
    different form: it builds the site and force-pushes dist/ to a
    `gh-pages` branch, which needs no settings change on GitHub. Pushing
    that branch for the first time turned Pages on by itself; the site
    answered about 30 seconds later.
  - The earlier Pages run can now be read: on GitHub's Linux machine the
    install and the build both passed. Only its publish step failed,
    because Pages was off then.
- New Discord invite from the club: https://discord.gg/kbevMqAuxD. Checked
  with Discord: valid, never expires, same server as the old one ("UW the
  Gathering"). Replaced in club.json and in the design mockup.
- Checked after the push (commit 2a34ec5):
  - The "Deploy site" run on GitHub succeeded in under a minute and
    replaced the gh-pages branch; the Pages build after it succeeded.
  - On https://rosiesuchoi.github.io/UWT_TheGathering/ in Chrome: all 12
    files load from under that address over HTTPS, no console errors, all
    four fonts load, all five Discord links point to the new invite, and
    clicking the hero card played the whole shuffle and ended with seven
    cards on the table and focus on the table.
  - Surprise: the Vercel copy at https://mtguwt.vercel.app picked up this
    push too and serves the same build with the new invite. It had ignored
    every push while the repository was private. So both addresses are
    live and both update on push.
  - Not checked on either address: a real phone, Safari, Firefox, frame
    rate.

- Club asked for three additions. Built the first group; NOT PUSHED, so the
  live site does not have it yet.
  - Officers: Rosie Choi (President), Jeremiah Celestra (Vice President),
    Jacob Caperon (Secretary), Emmet Meenk (Treasurer) are in members.json.
    No commanders, colors or photos were given, so each card says
    "Favorite commander: to be announced" and the section shows an "Owed"
    note.
  - Sign your card: a form in the join section takes a name. It then shows
    on the hero card, the table's open-seat card, the join card, and as a
    foil "Member" card in the binder where the open pocket was. The name is
    saved in that browser only, because the site has no server, and the
    form says so. "Take my name off" clears it.
  - Binder pages: nine pockets a page (six on a phone), with a page of
    spare sleeves after the last member. Drag a page to turn it: the outer
    columns curl up first and the page hinges at the rings; let go and it
    falls over or drops back. "Page back" and "Next page" buttons do the
    same.
  - Checked in Chrome on the dev server: type-check and build pass; no
    console errors; the folded layout matches the resting grid exactly at
    the start of a turn; long drag turns, slow short drag falls back, drag
    right turns back, a drag on the last page and an up-down drag do
    nothing; reading order is back to President, Vice President, Secretary,
    Treasurer after a turn; the name survives a reload and clears; at 375
    wide after a reload there are six pockets a page and no sideways
    scroll; with ?reduce-motion pages swap at once.
  - Not checked: the feel of a real drag by hand or by touch. Every drag
    was scripted, and the frames I saw were single captures. Not checked on
    a real phone, Safari or Firefox.
  - Not built: the 3D prize box. The photo the club sent is the official
    product box, with Wizards and Fallout logos and card art, which this
    project's own rules exclude. One photo also shows only the front.
    Waiting on the club's decision (see CLAUDE.md, phase 9).

- Club approved the binder, officers and sign-your-card work. Pushed; the
  deploy run succeeded and the live site serves it. A scripted drag turned
  a page on the live site.
- Club chose an original drawing for the prize box. Built it; NOT PUSHED.
  - In the giveaway entry of "Two ways to win": a box 1 wide, 1.4 tall and
    0.44 deep with six drawn sides. Front: "Commander deck", three color
    dots (dusk, grove, tide), an original moth, "Mutant Menace", the club
    mark. Back: what the prize is, from events.json, and "Date to be
    announced". Spines, top and base carry the name, the mark, and a line
    saying it is our drawing and not the real packaging.
  - Drag spins it (and tips it, with a mouse); a flick coasts; left alone
    it turns slowly; "Turn the box" turns it a quarter. Each side darkens
    as it turns from the light and the floor shadow narrows side-on.
  - Built with CSS 3D from page elements, not three.js: sharp lettering,
    no extra download, almost no cost on a phone.
  - Checked in Chrome on the dev server: type-check passes, no console
    errors; all six sides seen by scripted drags; no drift when held and
    released; idle turn measured at 16 degrees a second, starting 3.5 s
    after the last touch; the button lands on exact quarter turns; nothing
    moves while the section is marked off screen; at 375 wide the box sits
    centered under the text, a touch drag spins without tipping, and there
    is no sideways scroll; with ?reduce-motion there is no idle turn and
    no coast, and the button and drag still work.
  - Not checked: the feel of a real drag by hand or touch (all scripted),
    a real phone, Safari, Firefox.

- Club approved the prize box. Pushed; the deploy run succeeded and the
  live site serves it. On the live site all six sides are present, no
  files fail, there are no console errors, and a scripted drag turned the
  box to its spine.

- Club sent six photos of the real Mutant Menace box and asked for the
  real box as the 3D model, with the background removed. Built it; NOT
  PUSHED. This lifts the no-official-art rule for this one prize, by the
  club's decision (see CLAUDE.md, Constraints).
  - Each side was cut out of its photo and squared up from its four
    corners, which removes the desk, keyboard and everything else. Corners
    were placed by eye from close-ups and checked on a sheet of all six
    results. Saved as WebP in public/prizes/mutant-menace/: 900 px wide for
    the large sides, about 220 KB in total.
  - The box now has the real proportions: 1 wide, 0.78 tall, 0.24 deep. It
    is wider than tall, so it sits under the giveaway text, not beside it.
  - The photos are fetched only when the box nears the screen, so they add
    nothing to the first load.
  - The drawn box is still in the code as the look for a prize without
    photos. The caption now reads "The real box."
  - Footer: added that Fallout and related logos belong to Bethesda and
    that the club is not affiliated with either company.
  - Checked in Chrome on the dev server: type-check passes, no console
    errors; all six photos load at full size; front, right, back, left, top
    and base each seen on the right side of the box and the right way up;
    the yellow band lines up from the front round to the sides; at 375 wide
    the box is centered with no sideways scroll and a touch drag spins it.
  - Not checked: the feel of a real drag by hand or touch, a real phone,
    Safari, Firefox. The corners were placed by eye, so an edge may be off
    by a few pixels of the original photo.

- Club approved the photo box. Pushed; the deploy run succeeded and the
  live site serves it. On the live site all six photos load at full size,
  no files fail, there are no console errors, the footer carries the new
  Bethesda line, and a scripted drag turned the box.

- Club asked for an admin sign-in so officers can edit words, replace or
  remove member cards and edit the two nights on the live page, with a save
  button that commits to GitHub. Built it; approved and pushed (commit
  4e26533).
  - Live check: the deploy run succeeded; the live page's main bundle is
    the same file as a local build (index-m9GA3Dei.js), the panel chunk
    and stylesheet are served (200), and the page carries the footer button
    and the 12 editable keys. Not yet done: a real sign-in and save with a
    real token. The first real save should be a harmless edit by an officer.
  - First real save, by the owner with a real token: worked. Two commits
    landed on main (club and nights; one text edit plus members), both
    deployed, and the live bundle carries the new blurb and intro text. The
    club confirmed the club name "MTG @ UWT" and both venue addresses; the
    owner entered them (name and address flags set to confirmed). The four
    officers got a color each. Typos left in the owner's text ("give aways",
    the blurb's last sentence) for them to fix in the panel.
  - Design decision: the site has no server, so there is no password
    sign-in. An officer pastes a fine-grained GitHub token (this repository,
    Contents read and write) and GitHub checks it. This changes the project
    scope ("no auth") and is recorded in CLAUDE.md.
  - Footer button "Officer sign-in" loads the panel as its own chunk (18 kB,
    7 kB compressed) only when pressed. The main bundle grew by about 0.6 kB
    compressed for the edited-words support.
  - Editing: 12 headings and paragraphs are marked data-edit; click and
    type; Accent color toggles the colored phrase; one paragraph per box,
    pasted text is plain, formatting keys do nothing. Members panel: add,
    rename, set role and commander, tick colors, move earlier or later,
    remove with an undo. Club and nights panel: club name and official
    flag, Discord link, club intro, and both nights (day, time, venue,
    short name, address, confirmed flag).
  - Save is one commit with every changed file and is not forced. A
    save is refused if a file on GitHub differs from what the page was
    built from.
  - Checked in Chrome on the dev server against a PRETEND GitHub (the page's
    fetch replaced by a stub, so no real GitHub call was made with any real
    token): bad token, read-only token and good token each give the right
    message; edits count up and Save is off with none; empty day, bad
    Discord link and empty text are refused before any call; a save sends
    exactly: read branch, read each changed file, one tree, one commit with
    the old head as parent, one non-forced branch update; the files written
    are valid and end in a newline; a second save writes only text.json and
    keeps the earlier edits; a changed remote file blocks the save and keeps
    the edits; an offline save keeps the edits and a retry works; saved text
    comes back on a fresh load, and hostile saved text (script, style, img
    with onerror, javascript: link, nested em, line breaks) is flattened to
    plain text and em with nothing run; Discard reloads and reopens the
    panel; a rejected remembered token is dropped and the sign-in box shows;
    a token kept for the tab skips the box on the next press; Escape closes
    the side panel and returns focus; Sign out clears the token and returns
    to the normal page with no panel files loaded; at 375 wide the bar is 16
    percent of the screen, the side panel is full width and clear of it, and
    there is no sideways scroll.
  - NOT checked: a real save with a real token (the pretend GitHub could
    differ from the real API in small ways), real typing on a phone, Safari
    and Firefox, a screen reader, whether GitHub honors the pre-filled
    token link (the steps are written out beside it in case it does not).
  - Not covered: events text, photos, adding or removing nights.

**Open**
- Approve the officer panel so it can go live, then run the first real save
  with a real token and a harmless edit.
- Try the binder drag and the prize box by hand and on a phone.
- Open the live site on a real phone and watch the first second and the
  shuffle. Add ?fps for a frame-rate readout.
- Decided by the owner: the GitHub Pages address is the club's official
  link. index.html now names it as the canonical address, so search
  engines list it and not the Vercel copy.
- Optional: delete the Vercel project, and change the repository's
  "About" website link on GitHub, which still points to the Vercel copy.
- Decide whether to rename the repository to `mtguwt` for a shorter
  address (rosiesuchoi.github.io/mtguwt).
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
