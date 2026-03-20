/**
 * Download gallery sample images and upload to Cloudflare R2 under gallery/{category}/...
 * Mirrors FALLBACK_BY_CATEGORY in functions/api/gallery/index.js (keep URLs in sync).
 *
 * Prerequisites: `npx wrangler login` (or CLOUDFLARE_API_TOKEN with R2 write).
 * Usage: npm run upload:gallery-r2
 *
 * By default uploads to **remote** R2 (`--remote`). Wrangler 4 otherwise uses local dev storage.
 * For local Miniflare only: set R2_LOCAL=1
 *
 * If downloads fail with TLS / self-signed certificate (corporate proxy), try:
 *   set ALLOW_INSECURE_TLS=1   (Windows cmd)
 *   $env:ALLOW_INSECURE_TLS='1'   (PowerShell)
 */
if (process.env.ALLOW_INSECURE_TLS === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { mkdir, writeFile, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { GALLERY_SAMPLE_ENTRIES as ENTRIES } from './gallery-sample-manifest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUCKET = 'tmklondon-store';
const TMP = join(__dirname, '.tmp-gallery-upload');

async function downloadOnce(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return destPath;
}

function r2Put(objectKey, filePath) {
  const target = `${BUCKET}/${objectKey}`;
  const cwd = join(__dirname, '..');
  const q = (s) => `"${s.replace(/"/g, '\\"')}"`;
  const remoteFlag = process.env.R2_LOCAL === '1' ? '' : ' --remote';
  execSync(`npx wrangler r2 object put ${q(target)} --file ${q(filePath)}${remoteFlag}`, {
    stdio: 'inherit',
    cwd,
    shell: true,
    windowsHide: true,
  });
}

async function main() {
  await mkdir(TMP, { recursive: true });
  /** @type {Map<string, string>} url -> local temp file */
  const cache = new Map();
  let i = 0;
  for (const url of new Set(ENTRIES.map((e) => e.url))) {
    const ext = url.includes('png') ? 'png' : 'jpg';
    const local = join(TMP, `src-${i++}.${ext}`);
    console.log(`Downloading: ${url.slice(0, 70)}...`);
    await downloadOnce(url, local);
    cache.set(url, local);
  }

  for (const { category, filename, url } of ENTRIES) {
    const objectKey = `gallery/${category}/${filename}`;
    const filePath = cache.get(url);
    if (!filePath) throw new Error('missing cache for ' + url);
    console.log(`Uploading R2 key: ${objectKey}`);
    r2Put(objectKey, filePath);
  }

  const listRemote = process.env.R2_LOCAL === '1' ? '' : ' --remote';
  console.log(`\nDone. List with: npx wrangler r2 object list tmklondon-store --prefix gallery/${listRemote}`);
  await rm(TMP, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
