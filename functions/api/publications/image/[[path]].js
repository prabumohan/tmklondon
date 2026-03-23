/**
 * GET /api/publications/image/[[path]] — serve R2 object at publications/{path}
 */

const R2_PREFIX = 'publications/';

function isValidRelativeKey(rel) {
  if (!rel || typeof rel !== 'string' || rel.length > 220) return false;
  if (rel.includes('..') || rel.startsWith('/') || rel.includes('//')) return false;
  if (!rel.startsWith('covers/')) return false;
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
  const normalized = path.replace(/^\/+/, '');
  if (!isValidRelativeKey(normalized)) {
    return new Response('Not Found', { status: 404 });
  }
  const bucket = context.env.TMK_STORE;
  if (!bucket) return new Response('Not Found', { status: 404 });
  const key = R2_PREFIX + normalized;
  try {
    const obj = await bucket.get(key);
    if (!obj) return new Response('Not Found', { status: 404 });
    const ct = obj.httpMetadata?.contentType || 'image/jpeg';
    const headers = new Headers();
    headers.set('Content-Type', ct);
    headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    return new Response(obj.body, { headers });
  } catch (_) {
    return new Response('Not Found', { status: 404 });
  }
}
