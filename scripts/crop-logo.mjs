/**
 * Crop the circular emblem from the left of the banner and save as logo.png.
 * Run: node scripts/crop-logo.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bannerPath = path.join(root, 'public', 'static', 'content', 'banner-tam-2.jpg');
const logoPath = path.join(root, 'public', 'logo.png');

const image = sharp(bannerPath);
const meta = await image.metadata();
const { width, height } = meta;

// Circle is on the left; take a square from the left (side = height) to capture the full circle
const size = Math.min(height, width);
await image
  .extract({ left: 0, top: 0, width: size, height: size })
  .png()
  .toFile(logoPath);

console.log(`Logo saved to public/logo.png (${size}x${size})`);
