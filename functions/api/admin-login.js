/**
 * POST: Admin login. Body { password }. Compares to TMK_ADMIN_API_KEY.
 * On success, sets HttpOnly cookie so POST /api/ticker can auth without the key in the browser.
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;

function hex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signTimestamp(secret, timestamp) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(String(timestamp))
  );
  return hex(sig);
}

async function verifyToken(secret, token) {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;
  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays < 0 || ageDays > MAX_AGE_DAYS) return false;
  const expected = await signTimestamp(secret, ts);
  if (sig.length !== expected.length) return false;
  let match = 0;
  for (let i = 0; i < sig.length; i++) match |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return match === 0;
}

export async function onRequestPost(context) {
  const secret = context.env.TMK_ADMIN_API_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Admin login not configured' }), {
      status: 503,
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

  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (!password || password !== secret) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const timestamp = Date.now();
  const signature = await signTimestamp(secret, String(timestamp));
  const token = `${timestamp}.${signature}`;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60; // seconds
  const isLocalhost = context.request.headers.get('Host')?.startsWith('localhost');
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    ...(isLocalhost ? [] : ['Secure']),
  ].join('; ');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}
