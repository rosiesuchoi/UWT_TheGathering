// Join section: the visitor's own card, the form that signs it, the Discord
// button, and a recap of the nights. Styles are in src/styles/join.css.
import { club } from '../content';
import { siteCard } from '../content/cards';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';
import { bindVisitorCard, onVisitorName, setVisitorName, visitorName } from '../ui/visitor';

/** The form that puts the visitor's name on their card. */
function initSignup(): void {
  const form = document.getElementById('signForm');
  const input = document.getElementById('signName');
  const button = document.getElementById('signBtn');
  const note = document.getElementById('signNote');
  const clear = document.getElementById('signClear');
  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement)) return;

  const unsigned = note?.textContent ?? '';
  const show = (name: string | null): void => {
    if (document.activeElement !== input) input.value = name ?? '';
    if (button) button.textContent = name ? 'Update my card' : 'Sign my card';
    if (clear) clear.hidden = !name;
    if (note) {
      // Be plain about what signing does: this site has no server.
      note.textContent = name
        ? `Welcome to the table, ${name}. Your card is in the binder, in this browser only. Say hello on Discord and an officer will add you for everyone.`
        : unsigned;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.value = setVisitorName(input.value) ?? '';
  });
  clear?.addEventListener('click', () => {
    setVisitorName(null);
    input.value = '';
    input.focus();
  });
  onVisitorName(show);
  show(visitorName());
}

/** When and where, one more time, right under the button. */
export function refreshJoinRecap(): void {
  const recap = document.getElementById('joinRecap');
  if (!recap) return;
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

export function initJoin(): void {
  // The 100th card: foil, with the visitor's name on it once they sign.
  const mount = document.getElementById('joinCard');
  const data = siteCard('you');
  if (mount && data) {
    const card = createCard(data, { className: 'idle' });
    bindVisitorCard(card);
    attachTilt(card);
    mount.append(card);
  }

  initSignup();
  refreshJoinRecap();
}
