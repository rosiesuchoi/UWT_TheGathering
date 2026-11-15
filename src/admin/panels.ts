// The two editing panels: members, and club details with the two nights.
// They change the same objects the site reads (club, members), in place, and
// call onChange so the page shows the result straight away.
import { club, members, type CardColor, type Member } from '../content';
import { button, check, el, field } from './dom';

const COLORS: Array<{ id: CardColor; label: string; css: string }> = [
  { id: 'chalk', label: 'White', css: 'var(--chalk)' },
  { id: 'tide', label: 'Blue', css: 'var(--tide)' },
  { id: 'dusk', label: 'Black', css: 'var(--dusk)' },
  { id: 'ember', label: 'Red', css: 'var(--ember)' },
  { id: 'grove', label: 'Green', css: 'var(--grove)' },
];

const MAX_NAME = 40;
const MAX_ROLE = 40;
const MAX_COMMANDER = 60;

/** Something to tell the officer before saving, or null if the content is fine. */
export function validateContent(): string | null {
  if (!club.name.trim()) return 'The club name is empty.';
  if (!/^https:\/\/\S+$/.test(club.discord)) return 'The Discord link must start with https://';
  for (const [i, n] of club.nights.entries()) {
    const which = n.day.trim() || `Night ${i + 1}`;
    if (!n.day.trim() || !n.time.trim() || !n.venue.trim() || !n.venueShort.trim() || !n.address.trim()) {
      return `${which} has an empty field. Fill in day, time, venue, short name and address.`;
    }
  }
  for (const [i, m] of members.entries()) {
    if (!m.name.trim()) return `Member ${i + 1} has no name.`;
    if (!m.role.trim()) return `${m.name} has no role.`;
  }
  return null;
}

function memberRow(m: Member, index: number, actions: { up: () => void; down: () => void; remove: () => void }, onChange: () => void): HTMLElement {
  const row = el('fieldset', 'adm-row');
  const legend = el('legend', '', m.name.trim() || 'New member');
  row.append(legend);

  row.append(
    field('Name', {
      value: m.name,
      max: MAX_NAME,
      onInput: (v) => {
        m.name = v;
        legend.textContent = v.trim() || 'New member';
        onChange();
      },
    }),
    field('Role', {
      value: m.role,
      max: MAX_ROLE,
      hint: 'For example President, Treasurer or Member.',
      onInput: (v) => {
        m.role = v;
        onChange();
      },
    }),
    field('Favorite commander', {
      value: m.commander ?? '',
      max: MAX_COMMANDER,
      hint: 'Optional. Leave empty if it is not known yet.',
      onInput: (v) => {
        m.commander = v.trim() === '' ? null : v;
        onChange();
      },
    }),
  );

  const colors = el('div', 'adm-colors');
  colors.setAttribute('role', 'group');
  colors.setAttribute('aria-label', `Colors of ${m.name.trim() || 'this member'}'s commander`);
  COLORS.forEach((c) => {
    colors.append(
      check(
        c.label,
        m.colors.includes(c.id),
        (on) => {
          const set = new Set(m.colors);
          if (on) set.add(c.id);
          else set.delete(c.id);
          // Always in the game's order: the first color sets the card's look.
          m.colors = COLORS.map((x) => x.id).filter((id) => set.has(id));
          onChange();
        },
        c.css,
      ),
    );
  });
  row.append(el('p', 'adm-sub', 'Commander colors'), colors);
  if (m.photo) row.append(el('p', 'adm-hint', `Photo: ${m.photo} (photos are changed in the repository)`));

  const tools = el('div', 'adm-tools');
  const up = button('Move earlier', 'adm-btn adm-small', actions.up);
  up.dataset.act = 'up';
  up.disabled = index === 0;
  const down = button('Move later', 'adm-btn adm-small', actions.down);
  down.dataset.act = 'down';
  down.disabled = index === members.length - 1;
  tools.append(up, down, button('Remove', 'adm-btn adm-small adm-danger', actions.remove));
  row.append(tools);
  return row;
}

export function membersPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'Each member is one card in the binder, in this order. Only add people who have agreed to appear on a public site.',
    ),
  );
  const list = el('div', 'adm-list');
  const undo = el('div', 'adm-undo');
  let removed: { index: number; member: Member } | null = null;

  const paint = (focus?: { index: number; act: 'up' | 'down' | 'name' }): void => {
    list.replaceChildren(
      ...members.map((m, i) =>
        memberRow(
          m,
          i,
          {
            up: () => {
              if (i === 0) return;
              [members[i - 1], members[i]] = [members[i]!, members[i - 1]!];
              paint({ index: i - 1, act: 'up' });
              onChange();
            },
            down: () => {
              if (i === members.length - 1) return;
              [members[i + 1], members[i]] = [members[i]!, members[i + 1]!];
              paint({ index: i + 1, act: 'down' });
              onChange();
            },
            remove: () => {
              removed = { index: i, member: members[i]! };
              members.splice(i, 1);
              paint();
              onChange();
              undo.querySelector('button')?.focus();
            },
          },
          onChange,
        ),
      ),
    );
    if (members.length === 0) list.append(el('p', 'adm-hint', 'No members yet. The binder shows placeholder cards until there is one.'));

    undo.replaceChildren();
    if (removed) {
      const r = removed;
      undo.append(
        button(`Undo: put ${r.member.name.trim() || 'the member'} back`, 'adm-btn adm-small', () => {
          members.splice(Math.min(r.index, members.length), 0, r.member);
          removed = null;
          paint({ index: Math.min(r.index, members.length - 1), act: 'name' });
          onChange();
        }),
      );
    }

    if (focus) {
      const row = list.children[focus.index];
      const target = focus.act === 'name' ? row?.querySelector('input') : row?.querySelector<HTMLElement>(`[data-act="${focus.act}"]`);
      // A button that was just switched off cannot keep focus; use the other one.
      if (target instanceof HTMLButtonElement && target.disabled) row?.querySelector<HTMLElement>('[data-act]:not(:disabled)')?.focus();
      else target?.focus();
    }
  };

  const add = button('Add a member', 'adm-btn', () => {
    members.push({ name: '', role: 'Member', commander: null, colors: [], photo: null });
    paint({ index: members.length - 1, act: 'name' });
    onChange();
  });

  paint();
  root.append(list, undo, add);
  return root;
}

export function clubPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'The page below shows your changes as you type. The cards on the hero and the table update after you save and the site republishes.',
    ),
  );

  const about = el('fieldset', 'adm-row');
  about.append(
    el('legend', '', 'The club'),
    field('Club name', {
      value: club.name,
      max: 60,
      onInput: (v) => {
        club.name = v;
        onChange();
      },
    }),
    check('This is the official name', club.nameConfirmed, (on) => {
      club.nameConfirmed = on;
      onChange();
    }),
    field('Discord invite link', {
      value: club.discord,
      max: 200,
      type: 'url',
      hint: 'Must start with https://. Make the invite never expire, or the link stops working.',
      onInput: (v) => {
        club.discord = v.trim();
        onChange();
      },
    }),
    field('Intro for the club section', {
      value: club.blurb ?? '',
      max: 400,
      multiline: true,
      hint: 'Two or three sentences in the officers\' own words. Leave empty to show the "owed" note.',
      onInput: (v) => {
        club.blurb = v.trim() === '' ? null : v;
        onChange();
      },
    }),
  );
  root.append(about);

  club.nights.forEach((n, i) => {
    const box = el('fieldset', 'adm-row');
    const legend = el('legend', '', n.day.trim() || `Night ${i + 1}`);
    box.append(
      legend,
      field('Day', {
        value: n.day,
        max: 20,
        onInput: (v) => {
          n.day = v;
          legend.textContent = v.trim() || `Night ${i + 1}`;
          onChange();
        },
      }),
      field('Time', {
        value: n.time,
        max: 20,
        hint: 'For example 6 PM.',
        onInput: (v) => {
          n.time = v;
          onChange();
        },
      }),
      field('Venue', {
        value: n.venue,
        max: 60,
        onInput: (v) => {
          n.venue = v;
          onChange();
        },
      }),
      field('Short venue name', {
        value: n.venueShort,
        max: 20,
        hint: 'Fits on the night\'s card.',
        onInput: (v) => {
          n.venueShort = v;
          onChange();
        },
      }),
      field('Address', {
        value: n.address,
        max: 120,
        onInput: (v) => {
          n.address = v;
          onChange();
        },
      }),
      check('The club has confirmed this address', n.addressConfirmed, (on) => {
        n.addressConfirmed = on;
        onChange();
      }),
    );
    root.append(box);
  });
  root.append(el('p', 'adm-hint', 'The table has room for exactly two nights, so nights cannot be added or removed here.'));
  return root;
}
