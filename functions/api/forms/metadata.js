/**
 * GET /api/forms/metadata — return { donation?, admission? } with uploadedAt, filename from KV.
 */

const KV_KEY_PREFIX = 'forms:';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

export async function onRequestGet(context) {
  const kv = context.env.TMK_KV;
  const out = {};
  if (!kv) return jsonResponse(out);
  try {
    for (const type of ['donation', 'admission']) {
      const raw = await kv.get(KV_KEY_PREFIX + type);
      if (raw) {
        try {
          out[type] = JSON.parse(raw);
        } catch (_) {}
      }
    }
  } catch (_) {}
  return jsonResponse(out);
}
