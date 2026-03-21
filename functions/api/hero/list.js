/**
 * GET /api/hero/list — public JSON list of image keys under R2 prefix hero/ (relative paths, no prefix).
 * Sorted alphabetically. Empty array if no bucket or no objects.
 */

const R2_PREFIX = 'hero/';

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
  const bucket = context.env.TMK_STORE;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };

  if (!bucket) {
    return new Response(JSON.stringify({ keys: [] }), { headers });
  }

  const keys = [];
  const seen = new Set();
  let cursor;

  try {
    do {
      const listed = await bucket.list({ prefix: R2_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
      for (const obj of listed.objects || []) {
        const k = obj.key;
        if (!k.startsWith(R2_PREFIX)) continue;
        const rel = k.slice(R2_PREFIX.length);
        if (!rel || rel.endsWith('/')) continue;
        if (!isValidHeroRelativeKey(rel)) continue;
        if (seen.has(rel)) continue;
        seen.add(rel);
        keys.push(rel);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  } catch (_) {
    return new Response(JSON.stringify({ keys: [] }), { headers });
  }

  keys.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return new Response(JSON.stringify({ keys }), { headers });
}
