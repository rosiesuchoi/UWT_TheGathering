// YouTube addresses, built only from ids that passed a strict check. Nothing
// an officer types ever goes into a web address as it is: it is read for an id
// first, and the address is made from that id alone (see parseVideoId).

/** A YouTube video id: 11 letters, digits, "-" or "_". */
export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
/** A YouTube channel id: "UC" and 22 more. */
export const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtube-nocookie.com']);

function parseUrl(text: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

const bareHost = (url: URL): string => url.hostname.replace(/^(www|m)\./, '');

/** The video id in a pasted link (watch, youtu.be, embed, shorts, live) or a bare id. Null if there is none. */
export function parseVideoId(input: string): string | null {
  const text = input.trim();
  if (VIDEO_ID.test(text)) return text;
  const url = parseUrl(text);
  if (!url) return null;
  const host = bareHost(url);
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ?? null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

/** The channel id in a pasted youtube.com/channel/UC... link, or a bare channel id. Handles (@name) carry no id. */
export function parseChannelId(input: string): string | null {
  const text = input.trim();
  if (CHANNEL_ID.test(text)) return text;
  const url = parseUrl(text);
  if (!url || !YOUTUBE_HOSTS.has(bareHost(url))) return null;
  const id = url.pathname.match(/^\/channel\/([^/?]+)/)?.[1] ?? null;
  return id && CHANNEL_ID.test(id) ? id : null;
}

// The player address of a video. youtube-nocookie.com is YouTube's privacy-enhanced
// host. Both are only ever used after a visitor presses play.
export const embedUrl = (videoId: string): string => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
export const liveEmbedUrl = (channelId: string): string => `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&autoplay=1&rel=0&playsinline=1`;

// Plain links, which fetch nothing until they are followed.
export const watchLink = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;
export const channelLiveLink = (channelId: string): string => `https://www.youtube.com/channel/${channelId}/live`;
