import { defineConfig, type Plugin } from 'vite';
import club from './src/content/club.json' with { type: 'json' };

const escapeAttr = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// The browser tab's title and the search description come from club.json, so
// officers can change them in the panel. They are written into the page's
// HTML here, at build time, because search engines read the HTML as served.
function pageDetails(): Plugin {
  return {
    name: 'page-details-from-club-json',
    transformIndexHtml(html) {
      let out = html;
      if (club.pageTitle?.trim()) out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(club.pageTitle!.trim())}</title>`);
      if (club.pageDescription?.trim()) {
        out = out.replace(/(<meta name="description" content=")[^"]*(")/, (_m, a: string, b: string) => `${a}${escapeAttr(club.pageDescription!.trim())}${b}`);
      }
      return out;
    },
  };
}

// Relative base so the same build works at mtguwt.github.io and at
// username.github.io/mtguwt without changes.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  plugins: [pageDetails()],
});
