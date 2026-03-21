/**
 * POST /api/hero/upload
 * Body JSON: { slot, file } — base64 image; slot = relative key under hero/ (e.g. my-banner.jpg or slides/01.jpg).
 * Body JSON: { slot, action: "revert" } — delete hero/{slot} from R2.
 * Auth: tmk_admin_session cookie (same as gallery).
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const R2_PREFIX = 'hero/';
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;

function isValidHeroRelativeKey(rel) {
  if (!rel || typeof rel !== 'string' || rel.length > 220) return false;
  if (rel.includes('..') || rel.startsWith('/') || rel.includes('//')) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(rel)) return false;
  if (!ALLOWED_EXT.test(rel)) return false;
  for (const p of rel.split('/')) {
    if (!p || p === '.' || p === '..') return false;
  }
  return true;
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
  const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(timestamp)));
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

function contentTypeForSlot(slot) {
  const lower = slot.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
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

  const slot = (body.slot || '').toString().trim().replace(/^\/+/, '');
  if (!slot || !isValidHeroRelativeKey(slot)) {
    return jsonResponse(
      { error: 'Invalid slot: use letters, numbers, dots, dashes, underscores, optional subfolders; must end in .jpg/.png/.gif/.webp' },
      400
    );
  }

  if (body.action === 'revert') {
    try {
      await bucket.delete(R2_PREFIX + slot);
    } catch (_) {
      return jsonResponse({ error: 'Could not remove file from R2' }, 500);
    }
    return jsonResponse({ ok: true, reverted: true, slot });
  }

  const b64 = body.file;
  if (!b64 || typeof b64 !== 'string') {
    return jsonResponse({ error: 'Missing file (base64)' }, 400);
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
  if (bytes.length === 0 || bytes.length > MAX_SIZE) {
    return jsonResponse({ error: `Image must be under ${MAX_SIZE / (1024 * 1024)}MB` }, 400);
  }

  const r2Key = R2_PREFIX + slot;
  try {
    await bucket.put(r2Key, bytes.buffer, {
      httpMetadata: { contentType: contentTypeForSlot(slot) },
    });
  } catch (e) {
    return jsonResponse({ error: 'Upload to R2 failed' }, 500);
  }

  const pathSegs = slot.split('/').map((s) => encodeURIComponent(s)).join('/');
  return jsonResponse({ ok: true, slot, url: `/api/hero/image/${pathSegs}` });
}
