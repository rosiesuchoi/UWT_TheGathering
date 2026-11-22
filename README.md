# MTG at UWT

The showcase website for a new Magic: The Gathering club at the University of
Washington Tacoma. We play Commander on Thursdays and Fridays at 6 PM.

Live site: https://rosiesuchoi.github.io/UWT_TheGathering/

It is a static site: a card-themed page with a 3D deck that shuffles and deals
onto a table, built with Vite, TypeScript, three.js, GSAP and Lenis.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

`npm run build` type-checks the code and writes the finished site to `dist/`.

## Change the content

All club content lives in three files in `src/content/`. Edit them and the
site updates everywhere that content appears.

- `club.json`: the club name, browser tab title, Discord link, intro blurb,
  and the nights (day, time, venue, address).
- `events.json`: the raffle and the giveaway. Remove an item from an event's
  `owed` list once you have filled that detail in.
- `cards.json`: the words on the club, members and visitor cards.
- `videos.json`: replays and intros (YouTube ids only; the videos stay on
  YouTube). `club.json` also holds the club's YouTube channel and "next stream".
- `text.json`: edited headings and paragraphs (written by the officer panel).
- Member photos go in `public/members/`. A member without a photo wears
  stand-in card art from Scryfall (`commander-art.json`, refreshed by
  `npm run art`). The site does not call Scryfall itself.
- `members.json`: one entry per member. While it is empty, the site shows
  placeholder cards.

A member entry looks like this:

```json
{ "name": "Name", "role": "Role", "commander": "Favorite commander", "colors": ["tide", "ember"], "photo": null }
```

`colors` uses `chalk`, `tide`, `dusk`, `ember` and `grove`, for white, blue,
black, red and green. `photo` is a file name inside `public/members/`, or
`null`. If you do not know someone's commander yet, use `"commander": null`
and `"colors": []`. Only add members who have agreed to appear on a public
site.

Visitors can type their name into the join section to see their own card in
the binder. That name is saved in their browser only. It does not reach
anyone else, so a new member still needs an officer to add them here.

## Edit the site live (officers)

Nobody needs to touch code. Officers change the site from the page itself.
Scroll to the footer and press **Officer sign-in**.

### Getting access

The site's owner adds you once: on GitHub, the repository's **Settings**,
then **Collaborators**, then **Add people**, with your GitHub user name
(write access). GitHub emails you an invitation; accept it. To take someone's
access away, remove them from the same list.

Then sign in:

1. Make a GitHub token. The sign-in box has the steps and a link. If you
   were invited, use the first option: a classic token with `public_repo`,
   a 90-day expiry. (GitHub does not allow the safer fine-grained kind for a
   repository that belongs to another person's account.) The owner can use
   the second option, a fine-grained token for this repository only.
2. Paste the token into the sign-in box. It stays in your browser (this tab
   only, unless you tick "Keep me signed in on this device") and goes only to
   GitHub. Anyone who has it can change the site, so never share it, and
   delete it at github.com/settings/tokens when you are done.

### Editing

- **Headings, paragraphs and labels:** click and type right on the page.
  **Accent color** colors the selected words.
- **Edit details** opens a panel with a tab for each of these:
  - **Members**: add, rename, reorder or remove people, set their colors,
    and add a photo (pick a picture; it is shrunk for you).
  - **Club and nights**: club name, browser tab title, search description,
    Discord link, intro, and both nights.
  - **Events**: the raffle and the giveaway's words, the date once it is
    known, and the "still owed" list.
  - **Cards**: the words on the club, members and visitor cards.
  - **Videos**: the club's YouTube channel for live streams, and each replay
    or intro (paste its YouTube link). A video shows on the site only after you
    tick that everyone in it has agreed to appear.
  - **Buttons and links**: the words on buttons, menu links and a few
    handwritten labels.
- **Save changes** makes one commit on `main`, and the site republishes in
  about a minute. **Discard** throws the edits away.

If a save says a file changed on GitHub, someone else saved first (or your own
save is still publishing): reload the page and redo the edit.

Not editable here: the prize box and event photos, adding or removing a night
or an event (the table has room for exactly two of each), the legal notice in
the footer, and new sections. Those are edited in `src/` by someone who codes.

A possible later step: move the repository into a GitHub organization the
club owns. Then every officer could use the safer fine-grained token, and
more than one person could own the site. It changes the site's public
address, so it is the club's decision.

## Publish it

The site is hosted on GitHub Pages. Every push to the `main` branch is built
and published automatically by `.github/workflows/deploy.yml`. Editing a
content file on GitHub and saving it to `main` is enough to update the live
site a minute or two later.

The built site lives on the `gh-pages` branch. Do not edit that branch by
hand; it is replaced on every deploy.

To publish again without changing anything: Actions > Deploy site > Run
workflow. If a deploy fails, the Actions tab shows which step and why.

## How the project is organized

- `CLAUDE.md`: the project brief, rules and code map.
- `LOG.md`: a log of each working session.
- `design/`: the concept board and the approved page mockup.
- `src/`: the site itself.

## Fan content notice

MTG at UWT is unofficial Fan Content permitted under the Fan Content Policy.
Not approved/endorsed by Wizards. Portions of the materials used are property
of Wizards of the Coast. ©Wizards of the Coast LLC.
