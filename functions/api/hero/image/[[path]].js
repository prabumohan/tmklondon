/**
 * GET /api/hero/image/[[path]] — homepage hero backgrounds.
 * 1) R2 hero/{path} if present (admin uploads)
 * 2) Else static asset under /static/content/… (bundled defaults)
 */

const R2_PREFIX = 'hero/';

/** Must match src/config/hero-backgrounds.ts */
const ALLOWED_KEYS = new Set([
  'london-skyline-sunset.jpg',
  'background-london.jpg',
  'london-skyline-colorful.png',
  'hero-banner.jpg',
  'fiery_sunset_sky_swirling-full.jpg',
  'banner-tam-2.jpg',
]);

/** Map API filename → path under /static/content/ */
const STATIC_SUBPATH = {
  'fiery_sunset_sky_swirling-full.jpg': 'header-carousel/fiery_sunset_sky_swirling-full.jpg',
};

export async function onRequestGet(context) {
  let path = context.params.path;
  if (Array.isArray(path)) path = path.join('/');
  if (!path || typeof path !== 'string') {
    return new Response('Not Found', { status: 404 });
  }

  const normalizedPath = path.replace(/^\/+/, '').replace(/^hero\//, '');
  if (!ALLOWED_KEYS.has(normalizedPath)) {
    return new Response('Not Found', { status: 404 });
  }

  const staticRelative = STATIC_SUBPATH[normalizedPath] || normalizedPath;
  const staticUrl = new URL(`/static/content/${staticRelative}`, context.request.url);
  const key = `${R2_PREFIX}${normalizedPath}`;

  const bucket = context.env.TMK_STORE;
  if (bucket) {
    try {
      const obj = await bucket.get(key);
      if (obj) {
        const headers = new Headers();
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        return new Response(obj.body, { headers });
      }
    } catch (_) {
      // fall through to static
    }
  }

  try {
    const staticRes = await fetch(staticUrl.toString(), {
      headers: { 'User-Agent': 'tmk-hero-static-fallback' },
    });
    if (staticRes.ok) {
      const ct = staticRes.headers.get('Content-Type') || '';
      if (ct.startsWith('image/')) {
        const headers = new Headers();
        headers.set('Content-Type', ct);
        headers.set('Cache-Control', 'public, max-age=3600');
        return new Response(staticRes.body, { headers });
      }
    }
  } catch (_) {
    // ignore
  }

  return Response.redirect(staticUrl, 302);
}
