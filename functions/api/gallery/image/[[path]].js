/**
 * GET /api/gallery/image/[[path]] — serve image from R2 at key gallery/{path}.
 */

const R2_PREFIX = 'gallery/';

export async function onRequestGet(context) {
  let path = context.params.path;
  if (Array.isArray(path)) path = path.join('/');
  if (!path || typeof path !== 'string') {
    return new Response('Not Found', { status: 404 });
  }
  const bucket = context.env.TMK_STORE;
  if (!bucket) return new Response('Not Found', { status: 404 });
  const key = path.startsWith(R2_PREFIX) ? path : R2_PREFIX + path;
  try {
    const obj = await bucket.get(key);
    if (!obj) return new Response('Not Found', { status: 404 });
    const headers = new Headers();
    headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    return new Response(obj.body, { headers });
  } catch (_) {
    return new Response('Not Found', { status: 404 });
  }
}
