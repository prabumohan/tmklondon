/**
 * Homepage hero carousel — keys must match R2 objects at hero/{key} and static fallbacks under public/static/content/.
 * Keep in sync with functions/api/hero/upload.js and functions/api/hero/image/[[path]].js allowlists.
 */
export const HERO_CAROUSEL_SLIDES: readonly { key: string; label: string; position?: string }[] = [
  { key: 'london-skyline-sunset.jpg', label: '1 — London skyline (sunset)' },
  { key: 'background-london.jpg', label: '2 — London background' },
  { key: 'london-skyline-colorful.png', label: '3 — London skyline (colour)' },
  { key: 'hero-banner.jpg', label: '4 — Hero banner' },
  { key: 'fiery_sunset_sky_swirling-full.jpg', label: '5 — Fiery sunset sky' },
  { key: 'banner-tam-2.jpg', label: '6 — Tamil banner', position: 'left center' },
];
