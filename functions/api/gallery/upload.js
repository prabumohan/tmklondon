/**
 * POST /api/gallery/upload
 * JSON: { category, file, filename } or { category, files: [{ file, filename }] }
 * Auth: session cookie. Uploads image(s) to R2 as gallery/{category}/{original-name.jpg} and appends to KV galleryImages.
 * If the same filename already exists in that category, uses name_1.jpg, name_2.jpg, …
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const KV_KEY = 'galleryImages';
const R2_PREFIX = 'gallery/';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB per image
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;
const ALLOWED_MIME = /^image\/(jpe?g|png|gif|webp)$/i;

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

function safeExt(filename) {
  const m = (filename || '').toLowerCase().match(/\.(jpe?g|png|gif|webp)$/);
  return m ? m[1].replace('jpeg', 'jpg') : 'jpg';
}

/** Sanitized base name + normalized extension, e.g. My Photo.JPG → my_photo.jpg */
function normalizeStoredFilename(filename) {
  const raw = (filename || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  if (!ALLOWED_EXT.test(raw)) return null;
  const ext = safeExt(raw);
  const stem = raw.replace(/\.[^.]+$/, '');
  if (!stem) return null;
  return `${stem}.${ext}`;
}

/** Stable id for KV + delete: category_stem_ext (e.g. teachers_summer_pic_jpg) */
function makeGalleryItemId(category, storeName) {
  const ext = safeExt(storeName);
  const stem = storeName.replace(/\.[^.]+$/, '');
  return `${category}_${stem}_${ext}`;
}

export async function onRequestPost(context) {
  const bucket = context.env.TMK_STORE;
  const kv = context.env.TMK_KV;
  const secret = context.env.TMK_ADMIN_API_KEY;

  if (!bucket) {
    return jsonResponse({ error: 'R2 store not configured (TMK_STORE).' }, 503);
  }
  if (!secret) {
    return jsonResponse({ error: 'Admin not configured' }, 503);
  }

  const cookieHeader = context.request.headers.get('Cookie') || '';
  if (!(await verifySessionCookie(secret, cookieHeader))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!context.request.headers.get('Content-Type')?.includes('application/json')) {
    return jsonResponse({ error: 'Content-Type must be application/json' }, 400);
  }

  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const category = (body.category || '').toString().toLowerCase();
  const allowedCategories = ['teachers', 'school', 'events', 'community'];
  if (!allowedCategories.includes(category)) {
    return jsonResponse({ error: 'category must be one of: teachers, school, events, community' }, 400);
  }

  let entries = [];
  if (body.files && Array.isArray(body.files)) {
    entries = body.files.map((f) => ({ file: f.file, filename: (f.filename || '').toString() }));
  } else if (body.file && typeof body.filename === 'string') {
    entries = [{ file: body.file, filename: body.filename }];
  } else if (body.file) {
    entries = [{ file: body.file, filename: body.filename || 'image.jpg' }];
  }
  if (entries.length === 0) {
    return jsonResponse({ error: 'No file(s) provided. Send { category, file, filename } or { category, files: [{ file, filename }] }' }, 400);
  }

  let list = [];
  if (kv) {
    try {
      const raw = await kv.get(KV_KEY);
      if (raw) list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch (_) {}
  }

  const uploaded = [];
  for (const { file: b64, filename } of entries) {
    if (!b64 || typeof b64 !== 'string') continue;
    const normalized = normalizeStoredFilename((filename || 'image.jpg').toString());
    if (!normalized) continue;

    const ext = safeExt(normalized);
    const baseStem = normalized.replace(/\.[^.]+$/, '');
    let storeName = normalized;
    let n = 0;
    while (true) {
      const tryKey = `${R2_PREFIX}${category}/${storeName}`;
      const inKv = list.some((i) => i.r2Key === tryKey);
      let occupied = inKv;
      if (!occupied && bucket) {
        try {
          const head = await bucket.head(tryKey);
          occupied = head != null;
        } catch (_) {
          occupied = false;
        }
      }
      if (!occupied) break;
      n++;
      storeName = `${baseStem}_${n}.${ext}`;
    }

    const r2Key = `${R2_PREFIX}${category}/${storeName}`;
    const id = makeGalleryItemId(category, storeName);

    const clean = b64.replace(/^data:[^;]+;base64,/, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.length > MAX_SIZE) continue;

    try {
      await bucket.put(r2Key, bytes.buffer, {
        httpMetadata: { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` },
      });
    } catch (_) {
      continue;
    }

    const item = {
      id,
      category,
      filename: storeName,
      r2Key,
      url: `/api/gallery/image/${r2Key}`,
      uploadedAt: new Date().toISOString(),
    };
    list.push(item);
    uploaded.push(item);
  }

  if (kv && uploaded.length > 0) {
    try {
      await kv.put(KV_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  return jsonResponse({ ok: true, uploaded: uploaded.length, total: list.length });
}
