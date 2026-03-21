/**
 * GET /api/hero/image/[[path]] — hero backgrounds under R2 hero/{path}, else static default when it exists.
 */

const R2_PREFIX = 'hero/';

/** Map API filename → path under /static/content/ (legacy bundled defaults). */
const STATIC_SUBPATH = {
  'fiery_sunset_sky_swirling-full.jpg': 'header-carousel/fiery_sunset_sky_swirling-full.jpg',
};

function isValidHeroRelativeKey(rel) {
  if (!rel || typeof rel !== 'string' || rel.length > 220) return false;
  if (rel.includes('..') || rel.startsWith('/') || rel.includes('//')) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(rel)) return false;
  if (!/\.(jpe?g|png|gif|webp)$/i.test(rel)) return false;
  for (const p of rel.split('/')) {
    if (!p || p === '.' || p === '..') return false;
  }
  return true;
}

export async function onRequestGet(context) {
  let path = context.params.path;
  if (Array.isArray(path)) path = path.join('/');
  if (!path || typeof path !== 'string') {
    return new Response('Not Found', { status: 404 });
  }

  const normalizedPath = path.replace(/^\/+/, '').replace(/^hero\//, '');
  if (!isValidHeroRelativeKey(normalizedPath)) {
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
