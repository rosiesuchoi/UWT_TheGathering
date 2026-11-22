// Words that cannot be typed on the page itself because they sit inside a
// link or button (typing there would follow the link or press the button).
// They are marked data-edit-in="panel" in index.html, and edited here instead.
import { el, field } from './dom';

/** What each of these words is, in plain terms. Anything not listed shows under "Other". */
const LABELS: Record<string, [group: string, what: string]> = {
  'nav-table': ['Menu bar', 'Link to the table'],
  'nav-club': ['Menu bar', 'Link to the club'],
  'nav-nights': ['Menu bar', 'Link to the nights'],
  'nav-members': ['Menu bar', 'Link to the members'],
  'nav-events': ['Menu bar', 'Link to the events'],
  'nav-watch': ['Menu bar', 'Link to the videos'],
  'nav-join': ['Menu bar', 'Discord button'],
  'table-cta': ['The table', 'Discord button'],
  'table-replay': ['The table', 'Replay button'],
  'table-prizes': ['The table', 'Handwritten word by the prize cards'],
  'table-seat': ['The table', 'Handwritten word at the open seat'],
  'table-seatbtn': ['The table', 'Button at the open seat'],
  'join-signlabel': ['Last section', 'Words above the name box'],
  'join-setlabel': ['Last section', 'Words above the favorite-set picker'],
  'join-cta': ['Last section', 'Discord button'],
  'foot-discord': ['Footer', 'Discord link'],
  'foot-members': ['Footer', 'Members link'],
  'foot-events': ['Footer', 'Events link'],
};

/** Every panel-only text box on the page, grouped. Typing writes plain words into the page. */
export function wordsPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'These are the words on buttons and links, plus a few handwritten labels. They cannot be typed on the page itself, so they are edited here. Headings and paragraphs are edited right on the page.',
    ),
  );

  const groups = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-edit][data-edit-in="panel"]').forEach((node) => {
    const key = node.dataset.edit ?? '';
    const [group, what] = LABELS[key] ?? ['Other', key];
    let box = groups.get(group);
    if (!box) {
      box = el('fieldset', 'adm-row');
      box.append(el('legend', '', group));
      groups.set(group, box);
      root.append(box);
    }
    box.append(
      field(what, {
        value: node.textContent ?? '',
        max: 60,
        onInput: (v) => {
          // Plain words only: set as text, never as markup.
          node.textContent = v;
          onChange();
        },
      }),
    );
  });
  root.append(el('p', 'adm-hint', 'The legal notice at the bottom of the page (the Wizards of the Coast and Bethesda wording) is not editable here: it is required by their fan content rules.'));
  return root;
}
