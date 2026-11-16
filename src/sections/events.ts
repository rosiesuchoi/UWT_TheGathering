// Events section: the event cards in a pile, and one entry per event.
// Built from events.json. Styles are in src/styles/events.css.
import { events, type ClubEvent } from '../content';
import { siteCard } from '../content/cards';
import { createCard } from '../ui/card';
import { createPrizeBox } from '../ui/prizebox';
import { attachTilt } from '../ui/tilt';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The label, title and paragraph of one entry. */
function entryText(event: ClubEvent): HTMLElement[] {
  const text = el('p', '', `${event.text} `);
  if (event.date) text.append(el('strong', '', event.date));
  // Whatever the club has not supplied yet is named, so it cannot be missed.
  if (event.owed.length > 0) text.append(' ', el('span', 'tbd', `${event.owed.join(' and ')}: owed`));
  return [el('p', 'label', event.cadence), el('h3', '', event.title), text];
}

function eventEntry(event: ClubEvent): HTMLElement {
  const entry = el('div', 'event');
  entry.dataset.rv = '';
  entry.append(...entryText(event));
  // An event that gives something away shows it, as a box that can be turned.
  const prize = createPrizeBox(event);
  if (prize) {
    entry.classList.add('has-prize');
    entry.append(prize);
  }
  return entry;
}

export function initEvents(): void {
  const pile = document.getElementById('eventPile');
  const list = document.getElementById('eventList');
  if (!pile || !list) return;

  // The same cards that sit in the middle of the table, now full size.
  const cards = events.flatMap((_, i) => {
    const data = siteCard(`event-${i}`);
    if (!data) return [];
    const card = createCard(data);
    attachTilt(card);
    return [card];
  });
  pile.replaceChildren(...cards);
  list.replaceChildren(...events.map(eventEntry));
}

/**
 * Redraw the words after the admin panel edits events.json: the pile's cards
 * and each entry's label, title and paragraph. The prize boxes are left alone,
 * so they keep their place and do not reload their photos.
 */
export function refreshEvents(): void {
  const pile = document.getElementById('eventPile');
  const list = document.getElementById('eventList');
  if (!pile || !list) return;
  if (list.children.length !== events.length) {
    initEvents();
    return;
  }
  const cards = events.flatMap((_, i) => {
    const data = siteCard(`event-${i}`);
    if (!data) return [];
    const card = createCard(data);
    attachTilt(card);
    return [card];
  });
  pile.replaceChildren(...cards);
  events.forEach((event, i) => {
    const entry = list.children[i];
    if (!entry) return;
    // The first three children are the label, title and paragraph.
    Array.from(entry.children).slice(0, 3).forEach((c) => c.remove());
    entry.prepend(...entryText(event));
  });
}
