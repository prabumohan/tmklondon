/**
 * Download sample gallery images into public/gallery-samples/{category}/ for manual upload via Admin → Gallery.
 *
 * If downloads fail with TLS / self-signed certificate (corporate proxy):
 *   $env:ALLOW_INSECURE_TLS='1'   (PowerShell)
 */
if (process.env.ALLOW_INSECURE_TLS === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GALLERY_SAMPLE_ENTRIES } from './gallery-sample-manifest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = join(__dirname, '..', 'public', 'gallery-samples');

async function downloadOnce(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  /** @type {Map<string, Buffer>} */
  const byUrl = new Map();

  for (const url of new Set(GALLERY_SAMPLE_ENTRIES.map((e) => e.url))) {
    console.log(`Downloading: ${url.slice(0, 72)}...`);
    byUrl.set(url, await downloadOnce(url));
  }

  for (const { category, filename, url } of GALLERY_SAMPLE_ENTRIES) {
    const dir = join(OUT_ROOT, category);
    await mkdir(dir, { recursive: true });
    const dest = join(dir, filename);
    const buf = byUrl.get(url);
    if (!buf) throw new Error('missing buffer for ' + url);
    await writeFile(dest, buf);
    console.log(`Wrote ${dest.replace(/\\/g, '/')}`);
  }

  console.log(`\nDone. Open Admin → Gallery, pick category, then select files from:\n  ${OUT_ROOT.replace(/\\/g, '/')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
