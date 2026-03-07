/**
 * THEME COLOURS – edit this file to change how the site looks.
 *
 * For the MODERN theme you can switch the background style:
 * Set activeModernBackground below to: 'warm' | 'fresh' | 'parchment' | 'minimal'
 */

/** Pick one: 'warm' | 'fresh' | 'parchment' | 'minimal' */
export const activeModernBackground = 'fresh';

/** Background options for the modern theme – pick one via activeModernBackground */
export const modernBackgroundOptions = {
  /** A: Warm paper/cream gradient – soft, editorial (Riyadh-style) */
  warm: {
    body: 'linear-gradient(180deg, #fefdfb 0%, #fef7f5 40%, #f5f0eb 100%)',
    fallback: 'linear-gradient(180deg, #fefdfb 0%, #fef7f5 40%, #f5f0eb 100%)',
    overlay: 'linear-gradient(180deg, rgba(254,253,251,0.97) 0%, rgba(254,247,245,0.98) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.2) 0%, rgba(160, 55, 45, 0.35) 25%, rgba(80, 35, 30, 0.55) 55%, rgba(25, 18, 18, 0.78) 80%, rgba(12, 10, 10, 0.88) 100%)',
  },
  /** B: Fresh – very light warm tint (Riyadh-style maroon/cream) */
  fresh: {
    body: 'linear-gradient(165deg, #fef7f7 0%, #fde8e8 30%, #fef7f7 100%)',
    fallback: 'linear-gradient(165deg, #fef7f7 0%, #fde8e8 30%, #fef7f7 100%)',
    overlay: 'linear-gradient(180deg, rgba(254,247,247,0.96) 0%, rgba(253,232,232,0.95) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.2) 0%, rgba(160, 55, 45, 0.35) 25%, rgba(80, 35, 30, 0.55) 55%, rgba(25, 18, 18, 0.78) 80%, rgba(12, 10, 10, 0.88) 100%)',
  },
  /** C: Parchment – warmer, saffron/amber at edges (Riyadh Tamil warmth) */
  parchment: {
    body: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 35%, #fef9c3 100%)',
    fallback: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 35%, #fef9c3 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,251,235,0.98) 0%, rgba(254,243,199,0.97) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.2) 0%, rgba(160, 55, 45, 0.35) 25%, rgba(80, 35, 30, 0.55) 55%, rgba(25, 18, 18, 0.78) 80%, rgba(12, 10, 10, 0.88) 100%)',
  },
  /** D: Minimal – almost white with a very subtle gradient */
  minimal: {
    body: 'linear-gradient(180deg, #ffffff 0%, #fdf2f2 50%, #f8fafc 100%)',
    fallback: 'linear-gradient(180deg, #ffffff 0%, #fdf2f2 50%, #f8fafc 100%)',
    overlay: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(253,242,242,0.99) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.15) 0%, rgba(80, 35, 30, 0.4) 50%, rgba(25, 18, 18, 0.75) 100%)',
  },
} as const;

export const themeColors = {
  /** Modern theme – background comes from modernBackgroundOptions[activeModernBackground] */
  modern: {
    body: 'linear-gradient(180deg, #fefdfb 0%, #faf8f5 40%, #f5f0eb 100%)',
    fallback: 'linear-gradient(180deg, #fefdfb 0%, #faf8f5 40%, #f5f0eb 100%)',
    overlay: 'linear-gradient(180deg, rgba(254,253,251,0.97) 0%, rgba(245,240,235,0.98) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.2) 0%, rgba(160, 55, 45, 0.35) 25%, rgba(80, 35, 30, 0.55) 55%, rgba(25, 18, 18, 0.78) 80%, rgba(12, 10, 10, 0.88) 100%)',
  },
  classic: {
    body: '#1a0a0c',
    fallback: 'linear-gradient(165deg,#6B2D3C 0%,#5C1A1B 25%,#451a1a 60%,#1a0a0c 100%)',
    overlay: 'linear-gradient(160deg,rgba(107,45,60,0.75) 0%,rgba(92,26,27,0.85) 100%)',
    heroOverlay: 'linear-gradient(to bottom, rgba(200, 75, 50, 0.2) 0%, rgba(160, 55, 45, 0.35) 25%, rgba(80, 35, 30, 0.55) 55%, rgba(25, 18, 18, 0.78) 80%, rgba(12, 10, 10, 0.88) 100%)',
  },
  heritage: {
    body: '#14532d',
    fallback: 'linear-gradient(145deg,#14532d 0%,#166534 30%,#1e3a2e 100%)',
    overlay: 'linear-gradient(160deg,rgba(251,146,60,0.12) 0%,rgba(34,197,94,0.08) 50%,rgba(18,38,61,0.75) 100%)',
    heroOverlay: 'linear-gradient(135deg, rgba(22,101,52,0.9) 0%, rgba(30,58,46,0.85) 100%)',
  },
  london: {
    body: '#0f172a',
    fallback: 'linear-gradient(165deg,#1e293b 0%,#0f172a 40%,#020617 100%)',
    overlay: 'linear-gradient(160deg,rgba(30,41,59,0.88) 0%,rgba(15,23,42,0.92) 100%)',
    heroOverlay: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.88) 100%)',
  },
} as const;
