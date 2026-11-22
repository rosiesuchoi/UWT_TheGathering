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
  /** Optional italic line under the text, like a real card's flavor text. Shown on larger cards. */
  flavor?: string;
  /** The artist, for the "Illus." line. Set only when the picture is someone's card art. */
  illus?: string;
  /** Collector number, e.g. "001/100". */
  number: string;
  /** Set code shown bottom left. Pass '' to leave it empty. */
  set?: string;
  tone: CardTone;
  glyph: GlyphName;
  /** A photo for the art box. When set, it replaces the glyph. */
  image?: string;
  /** What the picture shows, for screen readers. Leave out for a purely decorative picture. */
  imageAlt?: string;
  /** Gold frame. */
  rare?: boolean;
  /** Holographic layer that follows the pointer. */
  foil?: boolean;
}

export interface CardOptions {
  /** 'a' needs href. 'button' is for cards that trigger something on the page. */
  as?: 'div' | 'a' | 'button';
  href?: string;
  /**
   * Extra words for screen readers, said after the card's own text. Use it
   * to say what a button does. The card's visible text is always part of its
   * name, so voice control users can say what they see.
   */
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

  // Spans throughout, so the same markup is valid inside a <button>.
  const face = span('face');

  const name = span('c-name');
  name.append(span('', data.name), span('c-pip'));

  const art = span('c-art');
  const drawGlyph = (): void => {
    if (data.glyph === 'mark') art.append(span('mark'));
    else art.innerHTML = GLYPHS[data.glyph]; // static, trusted markup from glyphs.ts
  };
  if (data.image) {
    const img = document.createElement('img');
    img.src = data.image;
    img.alt = data.imageAlt ?? '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // Pictures can come from another site (Scryfall). Send no page address along.
    img.referrerPolicy = 'no-referrer';
    // If the picture cannot load, fall back to the card's own drawing.
    img.addEventListener(
      'error',
      () => {
        img.remove();
        drawGlyph();
      },
      { once: true },
    );
    art.append(img);
  } else {
    drawGlyph();
  }

  const rules = span('c-text');
  rules.append(span('c-rules', data.text));
  if (data.flavor) {
    // A joke for people who look closely; screen readers get the real text only.
    const flavor = span('c-flavor', data.flavor);
    flavor.setAttribute('aria-hidden', 'true');
    rules.append(flavor);
  }

  const type = span('c-type');
  type.append(span('', data.type));

  // The collector line is decoration; reading "UWT 001/100" aloud helps no one.
  const num = span('c-num');
  num.setAttribute('aria-hidden', 'true');
  const where = span('', data.set ?? 'UWT');
  if (data.illus) where.append(span('c-illus', ` · Illus. ${data.illus}`));
  num.append(where, span('', data.number));

  face.append(name, art, type, rules, num);
  if (data.foil) face.append(span('c-foil'), span('c-glare'));
  card.append(face);
  if (options.label) card.append(span('sr-only', `. ${options.label}`));
  return card;
}
