// Nav, footer and the small content hooks shared by every section.
import { club, members } from '../content';
import { artName, memberArt } from '../content/art';

/** Fill in every element that shows the club name or links to Discord. */
export function applyClubContent(): void {
  document.querySelectorAll<HTMLElement>('[data-club-name]').forEach((el) => {
    el.textContent = club.name;
  });
  document.querySelectorAll<HTMLAnchorElement>('a[data-discord]').forEach((a) => {
    a.href = club.discord;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  applyArtCredits();

  const list = document.getElementById('footNights');
  if (list) {
    list.replaceChildren(
      ...club.nights.map((n) => {
        const li = document.createElement('li');
        li.textContent = `${n.day}, ${n.time}, ${n.venue}`;
        return li;
      }),
    );
  }
}

/** Credit for every piece of card art currently on a member card (Scryfall asks that artists stay credited). */
function applyArtCredits(): void {
  const box = document.getElementById('artCredits');
  const list = document.getElementById('artCreditList');
  if (!box || !list) return;
  const seen = new Set<string>();
  const items: HTMLLIElement[] = [];
  for (const m of members) {
    if (m.photo) continue; // a photo replaces the art
    const art = memberArt(m, members);
    if (seen.has(art.id)) continue;
    seen.add(art.id);
    const li = document.createElement('li');
    if (art.page.startsWith('https://scryfall.com/')) {
      const a = document.createElement('a');
      a.href = art.page;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = artName(art);
      li.append(a);
    } else {
      li.append(artName(art));
    }
    li.append(`, art by ${art.artist} (${art.setName})`);
    items.push(li);
  }
  list.replaceChildren(...items);
  box.hidden = items.length === 0;
}

/** Phone menu, plus marking the nav link of the section in view. */
export function initNav(): void {
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('links');
  if (!btn || !links) return;

  const close = () => {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const anchors = Array.from(links.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  const byId = new Map(anchors.map((a) => [a.getAttribute('href')!.slice(1), a]));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Sections without a nav link (hero, join, footer) clear the highlight.
        anchors.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main > section, footer').forEach((section) => observer.observe(section));
}
