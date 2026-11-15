// Events section: the event cards in a pile, and one entry per event.
// Built from events.json. Styles are in src/styles/events.css.
import { events, type ClubEvent } from '../content';
import { siteCard } from '../content/cards';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function eventEntry(event: ClubEvent): HTMLElement {
  const entry = el('div', 'event');
  entry.dataset.rv = '';
  const text = el('p', '', `${event.text} `);
  if (event.date) text.append(el('strong', '', event.date));
  // Whatever the club has not supplied yet is named, so it cannot be missed.
  if (event.owed.length > 0) text.append(' ', el('span', 'tbd', `${event.owed.join(' and ')}: owed`));
  entry.append(el('p', 'label', event.cadence), el('h3', '', event.title), text);
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
