/**
 * GET /api/hero/image/[[path]] — serve hero background image from R2 at key hero/{path}.
 * Falls back to static file if R2 is not configured or image not found.
 */

const R2_PREFIX = 'hero/';

export async function onRequestGet(context) {
  let path = context.params.path;
  if (Array.isArray(path)) path = path.join('/');
  if (!path || typeof path !== 'string') {
    return new Response('Not Found', { status: 404 });
  }
  
  const bucket = context.env.TMK_STORE;
  
  // Try R2 first if bucket is configured
  if (bucket) {
    // Normalize path: remove leading slash, handle subfolders
    const normalizedPath = path.replace(/^\/+/, '').replace(/^hero\//, '');
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
      // Fall through to static fallback
    }
  }
  
  // Fallback: redirect to static file (for local dev or if R2 not configured)
  // Map hero API paths back to static paths
  const staticPath = path.replace(/^hero\//, '').replace(/^header-carousel\//, 'header-carousel/');
  return Response.redirect(new URL(`/static/content/${staticPath}`, context.request.url), 302);
}
