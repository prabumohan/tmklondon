/**
 * DELETE /api/gallery/item/[id] — remove one gallery image from KV (and optionally R2). Auth: cookie.
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const KV_KEY = 'galleryImages';

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
  const secret = context.env.TMK_ADMIN_API_KEY;
  const id = context.params.id;

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

  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return jsonResponse({ error: 'Not found' }, 404);

  try {
    await kv.put(KV_KEY, JSON.stringify(next));
  } catch (_) {
    return jsonResponse({ error: 'Failed to save' }, 500);
  }

  return jsonResponse({ ok: true });
}
