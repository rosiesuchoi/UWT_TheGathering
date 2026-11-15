// Builds a card element. Styles are in src/styles/card.css.
import type { CardColor } from '../content';
import { GLYPHS, type GlyphName } from './glyphs';

/** The five accent colors, plus gold (club) and foil (the visitor's card). */
export type CardTone = CardColor | 'gold' | 'foil';

export interface CardData {
  name: string;
  /** The type line, e.g. "Night · Iruda Cafe". */
  type: string;
  text: string;
  /** Collector number, e.g. "001/100". */
  number: string;
  /** Set code shown bottom left. Pass '' to leave it empty. */
  set?: string;
  tone: CardTone;
  glyph: GlyphName;
  /** A photo for the art box. When set, it replaces the glyph. */
  image?: string;
  /** Gold frame. */
  rare?: boolean;
  /** Holographic layer that follows the pointer. */
  foil?: boolean;
}

export interface CardOptions {
  /** 'a' needs href. 'button' is for cards that trigger something on the page. */
  as?: 'div' | 'a' | 'button';
  href?: string;
  /** Accessible name for links and buttons. Defaults to the card name. */
  label?: string;
  className?: string;
}

function span(className: string, text?: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function createCard(data: CardData, options: CardOptions = {}): HTMLElement {
  const tag = options.as ?? 'div';
  const card = document.createElement(tag);
  card.className = ['card', `tone-${data.tone}`, data.rare ? 'rare' : '', options.className ?? ''].filter(Boolean).join(' ');
  if (card instanceof HTMLAnchorElement && options.href) card.href = options.href;
  if (card instanceof HTMLButtonElement) card.type = 'button';
  if (tag !== 'div') card.setAttribute('aria-label', options.label ?? data.name);

  // Spans throughout, so the same markup is valid inside a <button>.
  const face = span('face');

  const name = span('c-name');
  name.append(span('', data.name), span('c-pip'));

  const art = span('c-art');
  if (data.image) {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    art.append(img);
  } else if (data.glyph === 'mark') {
    art.append(span('mark'));
  } else {
    art.innerHTML = GLYPHS[data.glyph]; // static, trusted markup from glyphs.ts
  }

  const type = span('c-type');
  type.append(span('', data.type));

  const num = span('c-num');
  num.append(span('', data.set ?? 'UWT'), span('', data.number));

  face.append(name, art, type, span('c-text', data.text), num);
  if (data.foil) face.append(span('c-foil'), span('c-glare'));
  card.append(face);
  return card;
}
