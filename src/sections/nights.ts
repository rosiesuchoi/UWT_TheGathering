// Nights section: one block per club night, built from club.json.
// Styles are in src/styles/nights.css.
import { club, type Night } from '../content';
import { siteCard } from '../content/cards';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A map search for the venue. Works without an API key or an account. */
function mapsUrl(night: Night): string {
  const query = `${night.venue}, ${night.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function nightBlock(night: Night, index: number): HTMLElement {
  const block = el('div', `night accent-${night.tone}`);

  // Cards arrive from opposite sides: first from the left, second from the right.
  const cardWrap = el('div', 'night-card');
  cardWrap.dataset.rv = index % 2 === 0 ? 'card' : 'card-r';
  const data = siteCard(`night-${index}`);
  if (data) {
    const card = createCard(data);
    attachTilt(card);
    cardWrap.append(card);
  }

  const info = el('div', 'night-info');
  info.dataset.rv = '';
  const address = el('p', 'addr', `${night.address} `);
  if (!night.addressConfirmed) address.append(el('span', 'tbd', 'confirm'));
  const link = el('a', 'night-link', 'Open in Maps');
  link.href = mapsUrl(night);
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', `Open ${night.venue} in Maps`);
  info.append(
    el('p', 'day', night.day),
    el('p', 'time', night.time),
    el('h3', '', night.venue),
    address,
    link,
  );

  block.append(cardWrap, info);
  return block;
}

export function initNights(): void {
  const list = document.getElementById('nightsList');
  if (!list) return;
  list.replaceChildren(...club.nights.map(nightBlock));
}

/** Build the blocks again from club.json, for the admin panel's live preview. */
export const refreshNights = initNights;
