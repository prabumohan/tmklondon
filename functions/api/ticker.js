/**
 * GET: return news ticker items from KV (or default JSON).
 * POST: update news ticker in KV. Auth via session cookie (from POST /api/admin-login) or header X-Admin-Key.
 */

const KV_KEY = 'newsTickerItems';
const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;

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

const DEFAULT_ITEMS = [
  { text: 'Welcome to London Tamil Sangam - Celebrating Tamil Culture and Heritage', priority: 'high' },
  { text: 'Follow us on social media for the latest updates and events', priority: 'medium' },
  { text: 'Tamil School registration is now open for the new academic year', priority: 'high' },
  { text: 'Join us for our upcoming cultural events and celebrations', priority: 'medium' },
];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function onRequestGet(context) {
  const kv = context.env.TMK_KV;
  if (!kv) {
    return jsonResponse(DEFAULT_ITEMS);
  }
  try {
    const raw = await kv.get(KV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return jsonResponse(parsed);
      }
    }
  } catch (_) {
    // fall through to default
  }
  return jsonResponse(DEFAULT_ITEMS);
}

export async function onRequestPost(context) {
  const kv = context.env.TMK_KV;
  const apiKey = context.env.TMK_ADMIN_API_KEY;

  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 503 });
  }

  const cookieHeader = context.request.headers.get('Cookie') || '';
  const sessionOk = await verifySessionCookie(apiKey, cookieHeader);
  const authHeader = context.request.headers.get('X-Admin-Key') || context.request.headers.get('Authorization') || '';
  const keyAuth = authHeader.replace(/^Bearer\s+/i, '').trim();
  const keyOk = apiKey && keyAuth === apiKey;

  if (!sessionOk && !keyOk) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(body)) {
    return new Response(JSON.stringify({ error: 'Body must be an array of ticker items' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalized = body
    .map((item) => ({
      text: typeof item?.text === 'string' ? item.text : '',
      priority: item?.priority === 'high' || item?.priority === 'low' ? item.priority : 'medium',
    }))
    .filter((item) => item.text.length > 0);

  await kv.put(KV_KEY, JSON.stringify(normalized));
  return jsonResponse({ ok: true });
}
