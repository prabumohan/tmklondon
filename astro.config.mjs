import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      // Detect file changes reliably (e.g. on WSL, network drives) so you don't need to restart dev
      watch: {
        usePolling: true,
      },
    },
  },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  output: 'static',
  site: 'https://tmklondon.com',
  compressHTML: true,
});
