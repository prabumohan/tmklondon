import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await collectHtmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function patchModuleScriptsCrossorigin(html) {
  let out = html.replace(
    /<script type="module" src="([^"]+)"([^>]*)><\/script>/g,
    (full, src, rest) => {
      if (/\bcrossorigin\b/i.test(rest)) return full;
      const tail = rest.trim() ? ` ${rest.trim()}` : '';
      return `<script type="module" src="${src}" crossorigin${tail}></script>`;
    }
  );
  out = out.replace(
    /<link rel="modulepreload"([^>]*?)href="([^"]+)"([^>]*)>/g,
    (full, before, href, after) => {
      const chunk = before + 'href="' + href + '"' + after;
      if (/\bcrossorigin\b/i.test(chunk)) return full;
      return `<link rel="modulepreload"${before}href="${href}" crossorigin${after}>`;
    }
  );
  return out;
}

/**
 * Astro emits HTML after Vite; patch dist so `type="module"` scripts get `crossorigin`.
 * Aligns with Cloudflare Rocket Loader preloads (Chrome “credentials mode” audit).
 */
function crossoriginModuleScriptsIntegration() {
  return {
    name: 'tmk-crossorigin-module-scripts',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const files = await collectHtmlFiles(outDir);
        await Promise.all(
          files.map(async (file) => {
            const html = await fs.readFile(file, 'utf8');
            const next = patchModuleScriptsCrossorigin(html);
            if (next !== html) await fs.writeFile(file, next, 'utf8');
          })
        );
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      // Detect file changes reliably (e.g. on WSL, network drives) so you don't need to restart dev
      watch: {
        usePolling: true,
      },
      // In dev, /api/* 404s because CF Functions don't run. Proxy to static assets where applicable.
      proxy: {
        '/api/ticker': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: () => '/news-ticker.json',
        },
        '/api/upcoming-events': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: () => '/upcoming-events.json',
        },
        '/api/forms/donation': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: () => '/forms/Bankers_and_Member_Form_NOV_23.pdf',
        },
        '/api/forms/admission': {
          target: 'http://localhost:4321',
          changeOrigin: true,
          rewrite: () => '/forms/Tamil_School_Admission_Form_New_V3.0.docx',
        },
      },
    },
  },
  integrations: [
    tailwind(),
    react(),
    crossoriginModuleScriptsIntegration(),
    // Sitemap removed: @astrojs/sitemap relied on deprecated astro:routes:resolved (undefined in this Astro version), causing build to fail. Add back when upgrading Astro or use a custom sitemap.
  ],
  output: 'static',
  site: 'https://tmklondon.com',
  compressHTML: true,
});
