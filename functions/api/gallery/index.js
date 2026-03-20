/**
 * GET /api/gallery — list images from KV + scan R2 under gallery/{category}/.
 * When a category has no images, returns sample URLs (Indian / Hindu cultural theme) for demo.
 */

const KV_KEY = 'galleryImages';
const R2_PREFIX = 'gallery/';
const CATEGORIES = ['teachers', 'school', 'events', 'community'];

/** Curated Unsplash images (culture / education / community) used only when R2+KV have nothing in that category */
const FALLBACK_BY_CATEGORY = {
  teachers: [
    { id: 'f1', filename: 'learning.jpg', url: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80' },
    { id: 'f2', filename: 'study.jpg', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
    { id: 'f3', filename: 'books.jpg', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80' },
  ],
  school: [
    { id: 'f1', filename: 'classroom.jpg', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80' },
    { id: 'f2', filename: 'children.jpg', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80' },
    { id: 'f3', filename: 'activity.jpg', url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=900&q=80' },
  ],
  events: [
    { id: 'f1', filename: 'celebration.jpg', url: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80' },
    { id: 'f2', filename: 'lights.jpg', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
    { id: 'f3', filename: 'gathering.jpg', url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=900&q=80' },
  ],
  community: [
    { id: 'f1', filename: 'temple.jpg', url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80' },
    { id: 'f2', filename: 'architecture.jpg', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80' },
    { id: 'f3', filename: 'community.jpg', url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80' },
  ],
};

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

  const countByCat = {};
  for (const c of CATEGORIES) countByCat[c] = 0;
  for (const item of merged) {
    if (item.category && countByCat[item.category] !== undefined) {
      countByCat[item.category]++;
    }
  }

  const out = [...merged];
  for (const cat of CATEGORIES) {
    if (countByCat[cat] > 0) continue;
    const fallbacks = FALLBACK_BY_CATEGORY[cat] || [];
    for (const fb of fallbacks) {
      out.push({
        id: `sample-${cat}-${fb.id}`,
        category: cat,
        filename: fb.filename,
        url: fb.url,
        sample: true,
      });
    }
  }

  return jsonResponse(out);
}
