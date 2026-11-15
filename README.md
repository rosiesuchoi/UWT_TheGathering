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

- `club.json`: the club name, Discord link, intro blurb, and the nights
  (day, time, venue, address).
- `events.json`: the raffle and the giveaway. Remove an item from an event's
  `owed` list once you have filled that detail in.
- `members.json`: one entry per member. While it is empty, the site shows
  placeholder cards.

A member entry looks like this:

```json
{ "name": "Name", "role": "Role", "commander": "Favorite commander", "colors": ["tide", "ember"], "photo": null }
```

`colors` uses `chalk`, `tide`, `dusk`, `ember` and `grove`, for white, blue,
black, red and green. `photo` is a file name inside `public/members/`, or
`null`. Only add members who have agreed to appear on a public site.

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
