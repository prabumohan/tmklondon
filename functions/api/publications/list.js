/**
 * GET /api/publications/list — public JSON from R2 publications/manifest.json
 * Empty / missing manifest → { items: [] } (public page uses built-in fallback).
 */

const MANIFEST_KEY = 'publications/manifest.json';

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120, s-maxage=120',
      ...extraHeaders,
    },
  });
}

export async function onRequestGet(context) {
  const bucket = context.env.TMK_STORE;
  if (!bucket) {
    return jsonResponse({ items: [], source: 'no-bucket' });
  }
  try {
    const obj = await bucket.get(MANIFEST_KEY);
    if (!obj) {
      return jsonResponse({ items: [], source: 'empty' });
    }
    const text = await obj.text();
    const data = JSON.parse(text);
    const items = Array.isArray(data.items) ? data.items : [];
    return jsonResponse({ items, source: 'r2' });
  } catch (_) {
    return jsonResponse({ items: [], source: 'error' });
  }
}
