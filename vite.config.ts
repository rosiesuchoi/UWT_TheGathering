import { defineConfig } from 'vite';

// Relative base so the same build works at mtguwt.github.io and at
// username.github.io/mtguwt without changes.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
