/**
 * Remove the outer light grey/white ring from the logo (make it transparent).
 * Run: node scripts/logo-remove-white-ring.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');

const img = sharp(logoPath);
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const centerX = (width - 1) / 2;
const centerY = (height - 1) / 2;
const maxR = Math.min(width, height) / 2;

// Outer band: treat as ring in the last ~12–18% of radius (the white/grey ring)
const innerRadius = maxR * 0.82;
const outerRadius = maxR * 1.02;

// Light grey/white threshold: treat as "background" to make transparent
const isLightGrey = (r, g, b) =>
  r >= 180 && g >= 180 && b >= 180 &&
  Math.abs(r - g) < 50 && Math.abs(g - b) < 50 && Math.abs(r - b) < 50;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inRing = dist >= innerRadius && dist <= outerRadius;
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (inRing && isLightGrey(r, g, b)) {
      data[i + 3] = 0;
    }
    // Also make any pixel outside the circle fully transparent
    if (dist > maxR) {
      data[i + 3] = 0;
    }
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(logoPath);

console.log('Logo updated: white/grey outer ring set to transparent.');
