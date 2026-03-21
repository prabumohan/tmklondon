/**
 * Homepage hero carousel — used only when R2 has no images under hero/ (see GET /api/hero/list).
 * Filenames should exist under public/static/content/ (or STATIC_SUBPATH in the hero image function).
 */
export const HERO_CAROUSEL_SLIDES: readonly { key: string; label: string; position?: string }[] = [
  { key: 'london-skyline-sunset.jpg', label: '1 — London skyline (sunset)' },
  { key: 'background-london.jpg', label: '2 — London background' },
  { key: 'london-skyline-colorful.png', label: '3 — London skyline (colour)' },
  { key: 'hero-banner.jpg', label: '4 — Hero banner' },
  { key: 'fiery_sunset_sky_swirling-full.jpg', label: '5 — Fiery sunset sky' },
  { key: 'banner-tam-2.jpg', label: '6 — Tamil banner', position: 'left center' },
];

/** First slide URL (matches HeroSection) — use for LCP preload on the homepage. */
export function getFirstHeroSlideImageUrl(): string {
  const key = HERO_CAROUSEL_SLIDES[0].key;
  return `/api/hero/image/${key.split('/').map((p) => encodeURIComponent(p)).join('/')}`;
}
