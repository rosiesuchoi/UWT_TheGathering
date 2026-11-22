// Watch section: one big player, with the club's replays and intros as cards
// beneath it. Built from videos.json and the stream in club.json. Styles are in
// src/styles/video.css.
//
// Nothing from YouTube is fetched until a visitor presses play. The posters are
// our own drawings (no YouTube thumbnails, which would load from Google when the
// page opens), and the player is made only on a click. A video is shown only if
// its consent box is ticked, and its address is built from a checked id alone.
import { club, videos } from '../content';
import { CHANNEL_ID, VIDEO_ID, channelLiveLink, embedUrl, liveEmbedUrl, watchLink } from '../content/youtube';
import { reducedMotion, scrollToTarget } from '../core/scroll';
import { createCard } from '../ui/card';
import { attachTilt } from '../ui/tilt';

interface Item {
  title: string;
  /** Small label above the title, e.g. "Replay · Nov 14". */
  kind: string;
  description: string;
  /** The player's address. Made from a checked id, never from typed text. */
  src: string;
  /** A plain link to the same thing on YouTube, for when an embed is blocked. */
  link: string;
  tone: 'tide' | 'gold' | 'ember';
  number: string;
  live: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** What the page may show. A video needs a valid id and its consent box ticked. */
function items(): { all: Item[]; first: Item | undefined } {
  const list: Item[] = videos
    .filter((v) => v.consent === true && VIDEO_ID.test(v.videoId))
    .map((v, i) => ({
      title: v.title,
      kind: `${v.kind === 'intro' ? 'Intro' : 'Replay'}${v.date ? ` · ${v.date}` : ''}`,
      description: v.description,
      src: embedUrl(v.videoId),
      link: watchLink(v.videoId),
      tone: v.kind === 'intro' ? 'gold' : 'tide',
      number: `V-${String(i + 1).padStart(2, '0')}`,
      live: false,
    }));
  const channel = club.stream.channelId;
  if (channel && CHANNEL_ID.test(channel)) {
    const live: Item = {
      title: 'Watch live',
      kind: 'Live · YouTube',
      description: club.stream.next ? `Next stream: ${club.stream.next}` : 'Streams appear here when we go live.',
      src: liveEmbedUrl(channel),
      link: channelLiveLink(channel),
      tone: 'ember',
      number: 'LIVE',
      live: true,
    };
    // The live card leads the row; the featured slot still starts on the newest video.
    return { all: [live, ...list], first: list[0] ?? live };
  }
  return { all: list, first: list[0] };
}

let section: HTMLElement | null = null;

function build(): void {
  const stage = document.getElementById('watchPlayer');
  const reel = document.getElementById('watchReel');
  if (!section || !stage || !reel) return;

  const { all, first } = items();
  if (!first) {
    // Nothing to show yet: say what is owed, and fetch nothing.
    stage.replaceChildren();
    const owed = el('p', 'owed');
    owed.append(el('span', 'tbd', 'Owed'), ' Videos are on the way. The club has not published any replays or intros yet.');
    reel.replaceChildren(owed);
    return;
  }

  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  const frame = el('div', 'vframe-wrap');
  const link = el('a', 'vlink', 'Open on YouTube');
  link.target = '_blank';
  link.rel = 'noopener';
  stage.replaceChildren(frame, link, status);

  const cards = new Map<Item, HTMLElement>();
  const markCurrent = (item: Item): void => {
    cards.forEach((card, key) => card.classList.toggle('is-now', key === item));
  };

  /** Show a poster. No request leaves the page until it is pressed. */
  const showPoster = (item: Item): void => {
    const poster = el('button', 'vposter');
    poster.type = 'button';
    const play = el('span', 'vplay');
    play.setAttribute('aria-hidden', 'true');
    // The button's name is its visible words, so voice control can say them.
    poster.append(el('span', 'vk', item.kind), el('span', 'vt', item.title), el('span', 'vh', 'Plays from YouTube when you press it.'), play);
    poster.addEventListener('click', () => start(item, false));
    frame.replaceChildren(poster);
    link.href = item.link;
    markCurrent(item);
  };

  /** Make the player. Only ever called by a press. */
  const start = (item: Item, scroll: boolean): void => {
    const player = el('iframe', 'vframe');
    player.src = item.src;
    player.title = item.title;
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    // YouTube's player refuses to run (error 153) if it is sent no referrer, so do not strip it.
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(player);
    link.href = item.link;
    markCurrent(item);
    status.textContent = `Playing: ${item.title}`;
    if (scroll) scrollToTarget(stage, reducedMotion);
    player.focus();
  };

  reel.replaceChildren(
    ...all.map((item) => {
      const card = createCard(
        { name: item.title, type: item.kind, text: item.description, number: item.number, tone: item.tone, glyph: 'play' },
        { as: 'button', label: 'Plays in the player above' },
      );
      attachTilt(card);
      card.addEventListener('click', () => start(item, true));
      cards.set(item, card);
      return card;
    }),
  );
  showPoster(first);
}

export function initWatch(): void {
  section = document.getElementById('watch');
  build();
}

/** Build the section again from videos.json and club.json, for the admin panel's live preview. */
export function refreshWatch(): void {
  build();
}
