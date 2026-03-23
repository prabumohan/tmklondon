/**
 * POST /api/publications/manage
 * Auth: tmk_admin_session cookie.
 * Body: { action: "setManifest", items: [...] } | { action: "uploadCover", id, filename, file }
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const MANIFEST_KEY = 'publications/manifest.json';
const R2_PREFIX = 'publications/';
const MAX_ITEMS = 40;
const MAX_STR = 400;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;

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

function contentTypeForExt(ext) {
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function coverKeyMatchesId(id, coverKey) {
  if (!coverKey || typeof coverKey !== 'string') return false;
  const re = new RegExp(`^covers/${escapeRegex(id)}\\.(jpe?g|png|gif|webp)$`, 'i');
  return re.test(coverKey);
}

function normalizeItem(it) {
  return {
    id: String(it.id || '')
      .trim()
      .toLowerCase(),
    publisher: String(it.publisher || '').slice(0, MAX_STR),
    publisherNoteTa: String(it.publisherNoteTa || '').slice(0, MAX_STR),
    publisherNoteEn: String(it.publisherNoteEn || '').slice(0, MAX_STR),
    titleTa: String(it.titleTa || '').slice(0, MAX_STR),
    titleEn: String(it.titleEn || '').slice(0, MAX_STR),
    href: String(it.href || '').trim().slice(0, MAX_STR),
    ctaTa: String(it.ctaTa || 'பார்க்க').slice(0, MAX_STR),
    ctaEn: String(it.ctaEn || 'View').slice(0, MAX_STR),
    thumbnailAltTa: String(it.thumbnailAltTa || '').slice(0, MAX_STR),
    thumbnailAltEn: String(it.thumbnailAltEn || '').slice(0, MAX_STR),
    coverKey: it.coverKey ? String(it.coverKey).trim() : null,
  };
}

function validateItem(n) {
  if (!ID_RE.test(n.id)) return 'Each publication needs a valid id (lowercase letters, numbers, hyphens).';
  if (!n.publisher) return 'Publisher is required.';
  if (!n.href.startsWith('https://')) return 'Link must start with https://';
  if (n.coverKey && !coverKeyMatchesId(n.id, n.coverKey)) return 'Cover key must match this row id (upload cover after setting id).';
  return null;
}

export async function onRequestPost(context) {
  const bucket = context.env.TMK_STORE;
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

  const action = (body.action || '').toString();

  if (action === 'uploadCover') {
    const id = String(body.id || '')
      .trim()
      .toLowerCase();
    if (!ID_RE.test(id)) {
      return jsonResponse({ error: 'Invalid publication id' }, 400);
    }
    const filename = (body.filename || 'cover.jpg').toString();
    if (!ALLOWED_EXT.test(filename)) {
      return jsonResponse({ error: 'Cover must be .jpg, .png, .gif, or .webp' }, 400);
    }
    const b64 = body.file;
    if (!b64 || typeof b64 !== 'string') {
      return jsonResponse({ error: 'Missing base64 file' }, 400);
    }
    const clean = b64.replace(/^data:[^;]+;base64,/, '');
    let bytes;
    try {
      const binary = atob(clean);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } catch (_) {
      return jsonResponse({ error: 'Invalid base64' }, 400);
    }
    if (bytes.length > MAX_COVER_BYTES) {
      return jsonResponse({ error: 'Cover image too large (max 5MB)' }, 400);
    }
    const ext = safeExt(filename);
    const relKey = `covers/${id}.${ext}`;
    const fullKey = R2_PREFIX + relKey;
    try {
      await bucket.put(fullKey, bytes.buffer, {
        httpMetadata: { contentType: contentTypeForExt(ext) },
      });
    } catch (e) {
      return jsonResponse({ error: 'Upload failed' }, 500);
    }
    return jsonResponse({ ok: true, coverKey: relKey });
  }

  if (action === 'setManifest') {
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length > MAX_ITEMS) {
      return jsonResponse({ error: `At most ${MAX_ITEMS} publications` }, 400);
    }

    const seen = new Set();
    const normalized = [];
    for (const it of rawItems) {
      const n = normalizeItem(it);
      const err = validateItem(n);
      if (err) return jsonResponse({ error: err }, 400);
      if (seen.has(n.id)) return jsonResponse({ error: 'Duplicate publication id' }, 400);
      seen.add(n.id);
      normalized.push(n);
    }

    let oldItems = [];
    try {
      const oldObj = await bucket.get(MANIFEST_KEY);
      if (oldObj) {
        const oldData = JSON.parse(await oldObj.text());
        oldItems = Array.isArray(oldData.items) ? oldData.items : [];
      }
    } catch (_) {}

    const newCoverKeys = new Set(normalized.map((i) => i.coverKey).filter(Boolean));
    for (const o of oldItems) {
      const ck = o.coverKey;
      if (ck && typeof ck === 'string' && ck.startsWith('covers/') && !newCoverKeys.has(ck)) {
        try {
          await bucket.delete(R2_PREFIX + ck);
        } catch (_) {}
      }
    }

    const manifest = {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: normalized,
    };
    try {
      await bucket.put(MANIFEST_KEY, JSON.stringify(manifest), {
        httpMetadata: { contentType: 'application/json' },
      });
    } catch (_) {
      return jsonResponse({ error: 'Failed to save manifest' }, 500);
    }
    return jsonResponse({ ok: true, count: normalized.length });
  }

  return jsonResponse({ error: 'Unknown action (use setManifest or uploadCover)' }, 400);
}
