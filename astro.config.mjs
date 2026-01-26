import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
// Temporarily disabled sitemap due to build error - will re-enable after fixing
// import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    // sitemap({
    //   filter: (page) => !page.includes('/admin/'),
    // }),
  ],
  output: 'static',
  site: 'https://tmklondon.com',
  compressHTML: true,
});
