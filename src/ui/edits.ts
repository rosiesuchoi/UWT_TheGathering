// Edited words. Officers can change the headings and paragraphs marked
// data-edit="key" in index.html from the admin panel (src/admin/). Their
// changes live in src/content/text.json as { key: html } and are applied here
// on top of the text in index.html, so the page still reads correctly with no
// script and the file only ever holds what differs.
//
// The stored value is "text, with <em> for the accent colour" and nothing
// else. Everything that comes in is rebuilt from text nodes and <em>
// elements, never inserted as markup, so no edit can add a script or a link.
import textData from '../content/text.json';

/** Edits already saved, key to html. */
export const textOverrides = textData as Record<string, string>;

/** The longest edit accepted for one text box. */
export const MAX_TEXT = 800;

/** What index.html says for each key, before any edit. Filled by applyTextEdits(). */
export const textDefaults = new Map<string, string>();

/** Parse html into nodes that hold only text and <em>. Everything else is flattened to its text. */
export function cleanNodes(html: string): Node[] {
  const template = document.createElement('template');
  template.innerHTML = html;
  const walk = (parent: Node, inEm: boolean): Node[] => {
    const out: Node[] = [];
    parent.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        out.push(document.createTextNode((node.textContent ?? '').replace(/\s+/g, ' ')));
      } else if (node instanceof HTMLElement) {
        const tag = node.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        if (tag === 'BR') {
          out.push(document.createTextNode(' '));
          return;
        }
        const kids = walk(node, inEm || tag === 'EM' || tag === 'I');
        if ((tag === 'EM' || tag === 'I') && !inEm) {
          const em = document.createElement('em');
          em.append(...kids);
          if (em.textContent) out.push(em);
        } else {
          out.push(...kids);
        }
      }
    });
    return out;
  };
  return walk(template.content, false);
}

/** The same rules, as a string: what gets stored and compared. */
export function cleanHtml(html: string): string {
  const box = document.createElement('div');
  box.append(...cleanNodes(html));
  box.normalize();
  const first = box.firstChild;
  const last = box.lastChild;
  if (first?.nodeType === Node.TEXT_NODE) first.textContent = (first.textContent ?? '').replace(/^\s+/, '');
  if (last?.nodeType === Node.TEXT_NODE) last.textContent = (last.textContent ?? '').replace(/\s+$/, '');
  return box.innerHTML;
}

/** Put html into an element, rebuilt from clean nodes. */
export function setHtml(el: HTMLElement, html: string): void {
  el.replaceChildren(...cleanNodes(html));
}

/** Apply every saved edit. Runs once at start, before the sections are built. */
export function applyTextEdits(): void {
  document.querySelectorAll<HTMLElement>('[data-edit]').forEach((el) => {
    const key = el.dataset.edit;
    if (!key) return;
    textDefaults.set(key, cleanHtml(el.innerHTML));
    const html = textOverrides[key];
    if (typeof html === 'string' && html !== '' && html.length <= MAX_TEXT) setHtml(el, html);
  });
}
