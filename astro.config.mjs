import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Static output for GitHub Pages. The domain lives on GoDaddy and points at Pages,
// so public/CNAME must stay in the repo.
export default defineConfig({
  site: 'https://aseemjain.com',
  output: 'static',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: false } },
  prefetch: false,
});
