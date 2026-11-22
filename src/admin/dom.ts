// Small builders shared by the admin panel files.

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let counter = 0;

interface FieldOptions {
  value: string;
  max?: number;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
  onInput: (value: string) => void;
}

/** A labelled text box. The label is tied to the input, so screen readers and clicks both work. */
export function field(label: string, o: FieldOptions): HTMLElement {
  const id = `adm-f${++counter}`;
  const wrap = el('div', 'adm-field');
  const lab = el('label', '', label);
  lab.htmlFor = id;
  const input = o.multiline ? el('textarea') : el('input');
  input.id = id;
  input.className = 'adm-input';
  input.value = o.value;
  if (o.max) input.maxLength = o.max;
  if (o.placeholder) input.placeholder = o.placeholder;
  if (input instanceof HTMLInputElement) input.type = o.type ?? 'text';
  if (input instanceof HTMLTextAreaElement) input.rows = 4;
  input.addEventListener('input', () => o.onInput(input.value));
  wrap.append(lab, input);
  if (o.hint) {
    const hint = el('p', 'adm-hint', o.hint);
    hint.id = `${id}-h`;
    input.setAttribute('aria-describedby', hint.id);
    wrap.append(hint);
  }
  return wrap;
}

/** A labelled drop-down list. */
export function select(label: string, options: Array<[value: string, text: string]>, value: string, onChange: (value: string) => void): HTMLElement {
  const id = `adm-f${++counter}`;
  const wrap = el('div', 'adm-field');
  const lab = el('label', '', label);
  lab.htmlFor = id;
  const input = el('select', 'adm-input');
  input.id = id;
  options.forEach(([v, text]) => {
    const opt = el('option', '', text);
    opt.value = v;
    input.append(opt);
  });
  input.value = value;
  input.addEventListener('change', () => onChange(input.value));
  wrap.append(lab, input);
  return wrap;
}

/** A labelled tick box. */
export function check(label: string, checked: boolean, onChange: (checked: boolean) => void, dot?: string): HTMLElement {
  const lab = el('label', 'adm-check');
  const input = el('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  lab.append(input);
  if (dot) {
    const d = el('span', 'adm-dot');
    d.style.background = dot;
    d.setAttribute('aria-hidden', 'true');
    lab.append(d);
  }
  lab.append(label);
  return lab;
}

export function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', className, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
