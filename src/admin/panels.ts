// The editing panels: members, club details with the two nights, events, and
// the words on the table's cards. They change the same objects the site reads
// (club, members, events, cardTexts), in place, and call onChange so the page
// shows the result straight away.
import { cardTexts, club, events, members, videos, type CardColor, type CardWords, type Member, type Video } from '../content';
import { CHANNEL_ID, VIDEO_ID, parseChannelId, parseVideoId, watchLink } from '../content/youtube';
import { button, check, el, field, select } from './dom';
import { artName, memberArt, nextStandIn, randomStandIn, takenBy } from '../content/art';
import { addPhoto, photoSrc } from './photos';

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
  if (!club.pageTitle.trim()) return 'The browser tab title is empty.';
  for (const [i, m] of members.entries()) {
    if (!m.name.trim()) return `Member ${i + 1} has no name.`;
    if (!m.role.trim()) return `${m.name} has no role.`;
  }
  for (const e of events) {
    const which = e.title.trim() || e.id;
    if (!e.title.trim() || !e.cardName.trim() || !e.cadence.trim() || !e.cadenceShort.trim() || !e.text.trim() || !e.cardText.trim()) {
      return `The event "${which}" has an empty field. Everything except the date and the owed list needs words.`;
    }
  }
  for (const [name, c] of Object.entries({ club: cardTexts.club, members: cardTexts.members })) {
    if (!c.label.trim() || !c.name.trim() || !c.type.trim() || !c.text.trim()) return `The ${name} card has an empty field.`;
  }
  if (!cardTexts.you.type.trim() || !cardTexts.you.text.trim()) return 'The visitor card has an empty field.';
  const channel = club.stream.channelId;
  if (channel !== null && !CHANNEL_ID.test(channel)) {
    return 'The YouTube channel link is not recognized. Use the channel page link (youtube.com/channel/UC...) or the channel ID, or leave it empty.';
  }
  for (const [i, v] of videos.entries()) {
    if (!v.title.trim()) return `Video ${i + 1} has no title.`;
    if (!VIDEO_ID.test(v.videoId)) return `"${v.title.trim()}" needs a YouTube link the site recognizes (a watch, youtu.be, embed or shorts link, or the 11-character ID).`;
  }
  return null;
}

/** Pick, change or remove a member's photo. The picture is shrunk here and uploaded with the next save. */
function photoControls(m: Member, onChange: () => void): HTMLElement {
  const box = el('div', 'adm-photo');
  const thumb = el('div', 'adm-thumb');
  const side = el('div', 'adm-photo-side');
  const input = el('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;
  const msg = el('p', 'adm-hint');
  msg.setAttribute('role', 'status');
  const choose = button('Add photo', 'adm-btn adm-small', () => input.click());
  const remove = button('Remove photo', 'adm-btn adm-small adm-danger', () => {
    m.photo = null;
    msg.textContent = '';
    paint();
    onChange();
  });
  const paint = (): void => {
    thumb.replaceChildren();
    if (m.photo) {
      const img = el('img');
      img.src = photoSrc(m.photo);
      img.alt = `Photo of ${m.name.trim() || 'this member'}`;
      thumb.append(img);
    } else {
      thumb.append(el('span', '', 'No photo'));
    }
    choose.textContent = m.photo ? 'Change photo' : 'Add photo';
    remove.hidden = !m.photo;
  };
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    msg.textContent = 'Preparing the picture…';
    addPhoto(file, m.name)
      .then((name) => {
        m.photo = name;
        msg.textContent = 'Photo ready. It is uploaded when you press Save changes.';
        paint();
        onChange();
      })
      .catch((e: unknown) => {
        msg.textContent = e instanceof Error ? e.message : 'That picture could not be used.';
      });
  });
  const tools = el('div', 'adm-tools');
  tools.append(choose, remove);
  side.append(tools, msg);
  box.append(thumb, side, input);
  paint();
  return box;
}

/** The stand-in card art a member wears until there is a photo, with a button to try another. */
function artControls(m: Member, onChange: () => void): HTMLElement {
  const box = el('div', 'adm-photo-side');
  const line = el('p', 'adm-hint');
  line.setAttribute('role', 'status');
  const paint = (): void => {
    const art = memberArt(m, members);
    line.textContent = m.photo
      ? `Stand-in card art (${artName(art)}) is hidden while a photo is set.`
      : `Stand-in card art: ${artName(art)}, art by ${art.artist}. Not their favorite commander, just a picture.`;
  };
  const tools = el('div', 'adm-tools');
  tools.append(
    button('Different picture', 'adm-btn adm-small', () => {
      m.art = nextStandIn(memberArt(m, members), takenBy(members, m));
      paint();
      onChange();
    }),
  );
  box.append(line, tools);
  paint();
  return box;
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
  row.append(photoControls(m, onChange), artControls(m, onChange));

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
    members.push({ name: '', role: 'Member', commander: null, colors: [], photo: null, art: randomStandIn(takenBy(members)) });
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
    field('Browser tab title', {
      value: club.pageTitle,
      max: 70,
      hint: 'The words on the browser tab and in search results.',
      onInput: (v) => {
        club.pageTitle = v;
        onChange();
      },
    }),
    field('Search description', {
      value: club.pageDescription,
      max: 200,
      multiline: true,
      hint: 'One or two sentences shown under the title in search results. It changes when the site republishes.',
      onInput: (v) => {
        club.pageDescription = v;
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
      field('Card flavor text (optional)', {
        value: n.flavor ?? '',
        max: 70,
        hint: FLAVOR_HINT,
        onInput: (v) => {
          n.flavor = v.trim() === '' ? undefined : v;
          onChange();
        },
      }),
    );
    root.append(box);
  });
  root.append(el('p', 'adm-hint', 'The table has room for exactly two nights, so nights cannot be added or removed here.'));
  return root;
}

/** Events: the two cards and their entries. Prize photos and colors are still changed in the repository. */
export function eventsPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'The words of each event: its card on the table and its entry in "Two ways to win". Put the date in once it is known, and empty the "still owed" box when nothing is missing.',
    ),
  );
  events.forEach((e, i) => {
    const box = el('fieldset', 'adm-row');
    const legend = el('legend', '', e.title.trim() || `Event ${i + 1}`);
    const set =
      (apply: (v: string) => void) =>
      (v: string): void => {
        apply(v);
        onChange();
      };
    box.append(
      legend,
      field('Title', {
        value: e.title,
        max: 60,
        onInput: (v) => {
          e.title = v;
          legend.textContent = v.trim() || `Event ${i + 1}`;
          onChange();
        },
      }),
      field('Small label above the title', { value: e.cadence, max: 40, hint: 'For example "Every week".', onInput: set((v) => (e.cadence = v)) }),
      field('Description', { value: e.text, max: 300, multiline: true, onInput: set((v) => (e.text = v)) }),
      field('Date', {
        value: e.date ?? '',
        max: 40,
        hint: 'Shown in bold after the description. Leave empty if there is no date yet.',
        onInput: set((v) => (e.date = v.trim() === '' ? null : v)),
      }),
      field('Still owed', {
        value: e.owed.join(', '),
        max: 120,
        hint: 'Details the club has not given yet, separated by commas. They show as orange "owed" tags. Empty this when nothing is missing.',
        onInput: set((v) => (e.owed = v.split(',').map((x) => x.trim()).filter(Boolean))),
      }),
      el('p', 'adm-sub', 'On its card'),
      field('Card name', { value: e.cardName, max: 20, onInput: set((v) => (e.cardName = v)) }),
      field('Card type', {
        value: e.cardType ?? '',
        max: 16,
        hint: 'The word before the dash on the type line, like Sorcery or Artifact. Empty means Event.',
        onInput: set((v) => (e.cardType = v.trim() === '' ? undefined : v)),
      }),
      field('Card type line, after the dash', { value: e.cadenceShort, max: 24, hint: 'For example Weekly.', onInput: set((v) => (e.cadenceShort = v)) }),
      field('Card text', { value: e.cardText, max: 80, onInput: set((v) => (e.cardText = v)) }),
      field('Card flavor text (optional)', { value: e.flavor ?? '', max: 70, hint: FLAVOR_HINT, onInput: set((v) => (e.flavor = v.trim() === '' ? undefined : v)) }),
    );
    root.append(box);
  });
  root.append(el('p', 'adm-hint', 'Events cannot be added or removed here: the table has room for exactly two.'));
  return root;
}

const FLAVOR_HINT = 'The italic line under the card text, like flavor text on a real card. It shows on larger cards only. Leave empty for none.';

function wordsFor(legend: string, c: CardWords | { type: string; text: string; flavor?: string }, onChange: () => void): HTMLElement {
  const box = el('fieldset', 'adm-row');
  const set =
    (apply: (v: string) => void) =>
    (v: string): void => {
      apply(v);
      onChange();
    };
  box.append(el('legend', '', legend));
  if ('name' in c) {
    box.append(
      field('Card name', { value: c.name, max: 20, onInput: set((v) => (c.name = v)) }),
      field('Type line', { value: c.type, max: 34, hint: 'Written like a real card, for example Legendary Enchantment — Club.', onInput: set((v) => (c.type = v)) }),
      field('Card text', { value: c.text, max: 80, onInput: set((v) => (c.text = v)) }),
      field('Flavor text (optional)', { value: c.flavor ?? '', max: 70, hint: FLAVOR_HINT, onInput: set((v) => (c.flavor = v.trim() === '' ? undefined : v)) }),
      field('Handwritten label on the table', { value: c.label, max: 20, onInput: set((v) => (c.label = v)) }),
    );
  } else {
    box.append(
      field('Type line', { value: c.type, max: 34, onInput: set((v) => (c.type = v)) }),
      field('Card text', { value: c.text, max: 80, onInput: set((v) => (c.text = v)) }),
      field('Flavor text (optional)', { value: c.flavor ?? '', max: 70, hint: FLAVOR_HINT, onInput: set((v) => (c.flavor = v.trim() === '' ? undefined : v)) }),
    );
  }
  return box;
}

/** The words on the cards that are not a night or an event. */
export function cardsPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'The words on three of the table cards. The night cards come from "Club and nights", and the event cards from "Events". The card names appear on the hero and table after you save and the site republishes.',
    ),
    wordsFor('The club card', cardTexts.club, onChange),
    wordsFor('The members card', cardTexts.members, onChange),
    wordsFor("The visitor's card (100/100)", cardTexts.you, onChange),
  );
  return root;
}

/** What a pasted YouTube link was read as, in words. */
function idNote(note: HTMLElement, text: string, id: string | null, what: string): void {
  note.textContent = text.trim() === '' ? '' : id ? `Recognized ${what}: ${id}` : `Not recognized as a ${what}. Nothing will show, and saving is blocked until this is fixed.`;
}

const MAX_VIDEO_TITLE = 60;
const MAX_VIDEO_TEXT = 80;

function videoRow(v: Video, index: number, actions: { up: () => void; down: () => void; remove: () => void }, onChange: () => void): HTMLElement {
  const row = el('fieldset', 'adm-row');
  const legend = el('legend', '', v.title.trim() || 'New video');
  row.append(legend);
  const set =
    (apply: (value: string) => void) =>
    (value: string): void => {
      apply(value);
      onChange();
    };

  const linkNote = el('p', 'adm-hint');
  linkNote.setAttribute('role', 'status');
  const warn = el('p', 'adm-hint');
  const paintWarn = (): void => {
    const lines: string[] = [];
    if (!v.consent) lines.push('Hidden on the site until the consent box below is ticked.');
    if (v.kind === 'intro' && !v.captions) lines.push('An intro needs captions before it is posted.');
    warn.textContent = lines.join(' ');
  };
  const link = field('YouTube link or ID', {
    value: v.videoId ? watchLink(v.videoId) : '',
    max: 200,
    hint: 'Paste the video link from the address bar or the Share button. The video itself stays on YouTube.',
    onInput: (value) => {
      const id = parseVideoId(value);
      v.videoId = id ?? '';
      idNote(linkNote, value, id, 'video');
      onChange();
    },
  });

  row.append(
    field('Title', {
      value: v.title,
      max: MAX_VIDEO_TITLE,
      onInput: (value) => {
        v.title = value;
        legend.textContent = value.trim() || 'New video';
        onChange();
      },
    }),
    link,
    linkNote,
    select(
      'Kind',
      [
        ['replay', 'Replay of a game night'],
        ['intro', 'Intro: a short video about the club'],
      ],
      v.kind,
      (value) => {
        v.kind = value === 'intro' ? 'intro' : 'replay';
        paintWarn();
        onChange();
      },
    ),
    field('Date', { value: v.date ?? '', max: 24, hint: 'Optional. For example Nov 14.', onInput: set((value) => (v.date = value.trim() === '' ? null : value)) }),
    field('Short text for the card', { value: v.description, max: MAX_VIDEO_TEXT, onInput: set((value) => (v.description = value)) }),
    check('Everyone shown in this video has agreed to appear on a public site', v.consent, (on) => {
      v.consent = on;
      paintWarn();
      onChange();
    }),
    check('Captions are on and checked', v.captions, (on) => {
      v.captions = on;
      paintWarn();
      onChange();
    }),
    warn,
  );
  paintWarn();

  const tools = el('div', 'adm-tools');
  const up = button('Move earlier', 'adm-btn adm-small', actions.up);
  up.disabled = index === 0;
  const down = button('Move later', 'adm-btn adm-small', actions.down);
  down.disabled = index === videos.length - 1;
  tools.append(up, down, button('Remove', 'adm-btn adm-small adm-danger', actions.remove));
  row.append(tools);
  return row;
}

/** Videos: the club's YouTube channel for live streams, and the replays and intros. */
export function videosPanel(onChange: () => void): HTMLElement {
  const root = el('div', 'adm-body');
  root.append(
    el(
      'p',
      'adm-note',
      'Videos stay on YouTube. The site shows a poster for each, and the video loads from YouTube only when a visitor presses play. A video appears on the site only after you tick that everyone in it has agreed.',
    ),
  );

  const stream = el('fieldset', 'adm-row');
  stream.append(el('legend', '', 'Live streams'));
  const channelNote = el('p', 'adm-hint');
  channelNote.setAttribute('role', 'status');
  stream.append(
    field('YouTube channel link or ID', {
      value: club.stream.channelId ?? '',
      max: 200,
      hint: 'The channel page link (youtube.com/channel/UC...) or the channel ID. A link with an @name does not contain it. In YouTube Studio it is under Settings, Channel, Advanced settings. Leave empty until the club has a channel.',
      onInput: (value) => {
        if (value.trim() === '') {
          club.stream.channelId = null;
        } else {
          // A typed value that is not an id is kept as '' so saving is blocked until it is fixed.
          club.stream.channelId = parseChannelId(value) ?? '';
        }
        idNote(channelNote, value, club.stream.channelId || null, 'channel');
        onChange();
      },
    }),
    channelNote,
    field('Next stream', {
      value: club.stream.next ?? '',
      max: 60,
      hint: 'Shown on the "Watch live" card, for example "Friday, 6 PM". Optional.',
      onInput: (value) => {
        club.stream.next = value.trim() === '' ? null : value;
        onChange();
      },
    }),
  );
  root.append(stream);

  const list = el('div', 'adm-list');
  const paint = (): void => {
    list.replaceChildren(
      ...videos.map((v, i) =>
        videoRow(
          v,
          i,
          {
            up: () => {
              if (i === 0) return;
              [videos[i - 1], videos[i]] = [videos[i]!, videos[i - 1]!];
              paint();
              onChange();
            },
            down: () => {
              if (i === videos.length - 1) return;
              [videos[i + 1], videos[i]] = [videos[i]!, videos[i + 1]!];
              paint();
              onChange();
            },
            remove: () => {
              videos.splice(i, 1);
              paint();
              onChange();
            },
          },
          onChange,
        ),
      ),
    );
    if (videos.length === 0) list.append(el('p', 'adm-hint', 'No videos yet. The section shows an "owed" note until there is one.'));
  };
  paint();

  const add = button('Add a video', 'adm-btn', () => {
    videos.push({ title: '', kind: 'replay', videoId: '', date: null, description: '', captions: false, consent: false });
    paint();
    list.lastElementChild?.querySelector('input')?.focus();
    onChange();
  });
  root.append(list, add);
  return root;
}
