/**
 * Generates WebP derivatives for PSI: smaller files + srcset-friendly widths.
 * Run: node scripts/optimize-images.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function main() {
  const logoIn = path.join(root, 'public', 'logo.png');
  const headerJpg = path.join(
    root,
    'public',
    'static',
    'content',
    'header-carousel',
    'fiery_sunset_sky_swirling-full.jpg'
  );

  await fs.access(logoIn).catch(() => {
    throw new Error(`Missing ${logoIn} — add public/logo.png first.`);
  });
  await fs.access(headerJpg).catch(() => {
    throw new Error(`Missing ${headerJpg}`);
  });

  await sharp(logoIn)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toFile(path.join(root, 'public', 'logo-256.webp'));

  await sharp(logoIn)
    .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toFile(path.join(root, 'public', 'logo-640.webp'));

  const carouselDir = path.join(root, 'public', 'static', 'content', 'header-carousel');
  const base = 'fiery_sunset_sky_swirling-full';
  const meta = await sharp(headerJpg).metadata();
  const srcW = meta.width || 1920;

  for (const maxW of [1200, 1920]) {
    const pipeline = sharp(headerJpg).webp({ quality: 82, effort: 4 });
    if (srcW > maxW) {
      pipeline.resize(maxW, null, { withoutEnlargement: true });
    }
    await pipeline.toFile(path.join(carouselDir, `${base}-${maxW}.webp`));
  }

  console.log('OK: public/logo-256.webp, public/logo-640.webp, header-carousel/' + base + '-{1200,1920}.webp');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
