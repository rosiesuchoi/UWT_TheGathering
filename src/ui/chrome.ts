// Nav, footer and the small content hooks shared by every section.
import { club } from '../content';

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
