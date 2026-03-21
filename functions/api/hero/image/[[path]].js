/**
 * GET /api/hero/image/[[path]] — optional R2 overrides at hero/{path}.
 * Prefer the same file from the deployed site (/static/content/…) so repo assets win over stale R2 uploads.
 */

const R2_PREFIX = 'hero/';

/** Map API filename → path under /static/content/ (when not at repo root). */
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
  const staticRelative = STATIC_SUBPATH[normalizedPath] || normalizedPath;
  const staticUrl = new URL(`/static/content/${staticRelative}`, context.request.url);

  try {
    const staticRes = await fetch(staticUrl.toString(), {
      headers: { 'User-Agent': 'tmk-hero-static-check' },
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
    // fall through to R2
  }

  const bucket = context.env.TMK_STORE;
  if (bucket) {
    const key = `${R2_PREFIX}${normalizedPath}`;
    try {
      const obj = await bucket.get(key);
      if (obj) {
        const headers = new Headers();
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        return new Response(obj.body, { headers });
      }
    } catch (_) {
      // ignore
    }
  }

  return Response.redirect(staticUrl, 302);
}
