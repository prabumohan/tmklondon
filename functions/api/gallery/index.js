/**
 * GET /api/gallery — list images from KV + scan R2 under gallery/{category}/.
 */

const KV_KEY = 'galleryImages';
const R2_PREFIX = 'gallery/';
const CATEGORIES = ['teachers', 'school', 'events', 'community'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

export async function onRequestGet(context) {
  const kv = context.env.TMK_KV;
  const bucket = context.env.TMK_STORE;

  let kvList = [];
  if (kv) {
    try {
      const raw = await kv.get(KV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) kvList = parsed;
      }
    } catch (_) {}
  }

  const seenR2Keys = new Set();
  const merged = [];

  for (const item of kvList) {
    if (item.r2Key) seenR2Keys.add(item.r2Key);
    merged.push({
      id: item.id,
      category: item.category,
      filename: item.filename || 'image.jpg',
      r2Key: item.r2Key,
      url: item.url || (item.r2Key ? `/api/gallery/image/${item.r2Key}` : item.src),
      uploadedAt: item.uploadedAt,
    });
  }

  if (bucket) {
    for (const cat of CATEGORIES) {
      const prefix = `${R2_PREFIX}${cat}/`;
      let cursor;
      let guard = 0;
      do {
        const listed = await bucket.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
        cursor = listed.truncated ? listed.cursor : undefined;
        for (const obj of listed.objects) {
          const key = obj.key;
          if (!/\.(jpe?g|png|gif|webp)$/i.test(key)) continue;
          if (seenR2Keys.has(key)) continue;
          seenR2Keys.add(key);
          const file = key.split('/').pop() || 'image.jpg';
          const idBase = file.replace(/\.[^.]+$/, '');
          merged.push({
            id: idBase || `r2_${guard}`,
            category: cat,
            filename: file,
            r2Key: key,
            url: `/api/gallery/image/${key}`,
            uploadedAt: obj.uploaded ? new Date(obj.uploaded).toISOString() : undefined,
          });
        }
        guard++;
        if (guard > 50) break;
      } while (cursor);
    }
  }

  return jsonResponse(merged);
}
