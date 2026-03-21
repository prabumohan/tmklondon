/**
 * GET: upcoming events for home page (KV or defaults).
 * POST: replace list in KV. Auth: admin session cookie or X-Admin-Key (same as /api/ticker).
 */

const KV_KEY = 'upcomingEvents';
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
  const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(timestamp)));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (sig.length !== expectedHex.length) return false;
  let match_ = 0;
  for (let i = 0; i < sig.length; i++) match_ |= sig.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return match_ === 0;
}

const DEFAULT_ITEMS = [
  {
    date: 'Dec 15, 2024',
    title: { ta: 'பொங்கல் கொண்டாட்டம்', en: 'Pongal Celebration' },
    description: {
      ta: 'பாரம்பரிய பொங்கல் விழாவில் எங்களுடன் சேரவும்',
      en: 'Join us for traditional Pongal festivities',
    },
    link: '',
  },
  {
    date: 'Dec 20, 2024',
    title: { ta: 'தமிழ் மொழி பட்டறை', en: 'Tamil Language Workshop' },
    description: {
      ta: 'தமிழ் எழுத்து மற்றும் உரையாடலை கற்றுக்கொள்ளுங்கள்',
      en: 'Learn Tamil script and conversation',
    },
    link: '',
  },
  {
    date: 'Jan 5, 2025',
    title: { ta: 'கலாச்சார நடன நிகழ்ச்சி', en: 'Cultural Dance Performance' },
    description: {
      ta: 'மாணவர்களின் பரதநாட்டியம் நிகழ்ச்சி',
      en: 'Bharatanatyam showcase by students',
    },
    link: '',
  },
];

function normalizeEvent(item) {
  const title = item?.title || {};
  const description = item?.description || {};
  return {
    date: typeof item?.date === 'string' ? item.date.trim() : '',
    title: {
      ta: typeof title.ta === 'string' ? title.ta.trim() : '',
      en: typeof title.en === 'string' ? title.en.trim() : '',
    },
    description: {
      ta: typeof description.ta === 'string' ? description.ta.trim() : '',
      en: typeof description.en === 'string' ? description.en.trim() : '',
    },
    link: typeof item?.link === 'string' ? item.link.trim() : '',
  };
}

function isValidEvent(e) {
  if (!e.date) return false;
  const hasTitle = e.title.ta || e.title.en;
  const hasDesc = e.description.ta || e.description.en;
  return hasTitle && hasDesc;
}

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
        const normalized = parsed.map(normalizeEvent).filter(isValidEvent);
        if (normalized.length > 0) {
          return jsonResponse(normalized);
        }
      }
    }
  } catch (_) {
    // fall through
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
    return new Response(JSON.stringify({ error: 'Body must be an array of events' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalized = body.map(normalizeEvent).filter(isValidEvent);
  await kv.put(KV_KEY, JSON.stringify(normalized));
  return jsonResponse({ ok: true });
}
