import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      // Detect file changes reliably (e.g. on WSL, network drives) so you don't need to restart dev
      watch: {
        usePolling: true,
      },
      // In dev, /api/ticker 404s because CF Functions don't run. Proxy to static JSON so news ticker works.
      proxy: {
        '/api/ticker': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: () => '/news-ticker.json',
        },
      },
    },
  },
  integrations: [
    tailwind(),
    react(),
    // Sitemap removed: @astrojs/sitemap relied on deprecated astro:routes:resolved (undefined in this Astro version), causing build to fail. Add back when upgrading Astro or use a custom sitemap.
  ],
  output: 'static',
  site: 'https://tmklondon.com',
  compressHTML: true,
});
