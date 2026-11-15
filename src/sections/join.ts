// Join section: the visitor's own card, the Discord button, and a recap of
// the nights. Styles are in src/styles/join.css.
import { club } from '../content';
import { siteCard } from '../content/cards';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';

export function initJoin(): void {
  // The 100th card: blank, foil, with the visitor's name on it.
  const mount = document.getElementById('joinCard');
  const data = siteCard('you');
  if (mount && data) {
    const card = createCard(data, { className: 'idle' });
    attachTilt(card);
    mount.append(card);
  }

  // When and where, one more time, right under the button.
  const recap = document.getElementById('joinRecap');
  if (recap) {
    recap.replaceChildren(
      ...club.nights.map((n) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = `${n.day}, ${n.time}`;
        const detail = document.createElement('dd');
        detail.textContent = n.venue;
        row.append(term, detail);
        return row;
      }),
    );
  }
}
