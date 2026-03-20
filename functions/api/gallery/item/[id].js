/**
 * DELETE /api/gallery/item/[id] — remove gallery image from KV and delete the R2 object.
 * Also handles R2-only objects (listed from bucket but not in KV) by scanning keys under gallery/.
 * Auth: session cookie.
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const KV_KEY = 'galleryImages';
const R2_PREFIX = 'gallery/';
const CATEGORIES = ['teachers', 'school', 'events', 'community'];

/** id from upload: teachers_summer_pic_jpg → { category, stem, ext } */
function parseNewStyleGalleryId(id) {
  const parts = id.split('_');
  if (parts.length < 3) return null;
  const cat = parts[0];
  if (!CATEGORIES.includes(cat)) return null;
  const extLast = parts[parts.length - 1].toLowerCase();
  const extNorm = extLast === 'jpeg' ? 'jpg' : extLast;
  if (!/^(jpe?g|png|gif|webp)$/.test(extNorm)) return null;
  const stem = parts.slice(1, -1).join('_');
  if (!stem) return null;
  return { category: cat, stem, ext: extNorm };
}

async function verifySessionCookie(secret, cookieHeader) {
  if (!cookieHeader || !secret) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1]?.trim();
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;
  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays < 0 || ageDays > MAX_AGE_DAYS) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(String(timestamp))
  );
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (sig.length !== expectedHex.length) return false;
  let match_ = 0;
  for (let i = 0; i < sig.length; i++) match_ |= sig.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return match_ === 0;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestDelete(context) {
  const kv = context.env.TMK_KV;
  const bucket = context.env.TMK_STORE;
  const secret = context.env.TMK_ADMIN_API_KEY;
  const rawId = context.params?.id;
  const id = rawId != null ? decodeURIComponent(String(rawId)) : '';

  if (!id || !kv) return jsonResponse({ error: 'Not found' }, 404);
  if (!secret) return jsonResponse({ error: 'Admin not configured' }, 503);

  const cookieHeader = context.request.headers.get('Cookie') || '';
  if (!(await verifySessionCookie(secret, cookieHeader))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let list = [];
  try {
    const raw = await kv.get(KV_KEY);
    if (raw) list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [];
  } catch (_) {
    return jsonResponse({ error: 'Failed to load gallery' }, 500);
  }

  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    const removed = list[idx];
    if (bucket && removed.r2Key) {
      try {
        await bucket.delete(removed.r2Key);
      } catch (_) {
        return jsonResponse({ error: 'Failed to delete file from storage' }, 500);
      }
    }
    const next = list.filter((_, i) => i !== idx);
    try {
      await kv.put(KV_KEY, JSON.stringify(next));
    } catch (_) {
      return jsonResponse({ error: 'Failed to save' }, 500);
    }
    return jsonResponse({ ok: true });
  }

  // KV miss: try new-style id → exact R2 key (orphan KV / direct delete)
  if (bucket) {
    const parsed = parseNewStyleGalleryId(id);
    if (parsed) {
      const r2Key = `${R2_PREFIX}${parsed.category}/${parsed.stem}.${parsed.ext}`;
      try {
        const head = await bucket.head(r2Key);
        if (head) {
          await bucket.delete(r2Key);
          return jsonResponse({ ok: true });
        }
      } catch (_) {}
    }
  }

  // R2-only (e.g. uploaded via wrangler, never in KV): find by filename stem matching id
  if (bucket) {
    let cursor;
    let guard = 0;
    do {
      const listed = await bucket.list({ prefix: R2_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
      for (const obj of listed.objects) {
        const key = obj.key;
        if (!/\.(jpe?g|png|gif|webp)$/i.test(key)) continue;
        const file = key.split('/').pop() || '';
        const base = file.replace(/\.[^.]+$/, '');
        if (base === id) {
          try {
            await bucket.delete(key);
            return jsonResponse({ ok: true });
          } catch (_) {
            return jsonResponse({ error: 'Failed to delete object' }, 500);
          }
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
      guard++;
      if (guard > 50) break;
    } while (cursor);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}
