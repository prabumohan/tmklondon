/**
 * GET /api/gallery — return list of gallery images from KV (for public gallery and admin).
 */

const KV_KEY = 'galleryImages';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

export async function onRequestGet(context) {
  const kv = context.env.TMK_KV;
  if (!kv) return jsonResponse([]);
  try {
    const raw = await kv.get(KV_KEY);
    if (!raw) return jsonResponse([]);
    const list = JSON.parse(raw);
    return jsonResponse(Array.isArray(list) ? list : []);
  } catch (_) {
    return jsonResponse([]);
  }
}
