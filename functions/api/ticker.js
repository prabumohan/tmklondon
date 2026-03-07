/**
 * GET: return news ticker items from KV (or default JSON).
 * POST: update news ticker in KV. Requires header X-Admin-Key to match TMK_ADMIN_API_KEY.
 */

const KV_KEY = 'newsTickerItems';

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

  const authHeader = context.request.headers.get('X-Admin-Key') || context.request.headers.get('Authorization') || '';
  const auth = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!apiKey || auth !== apiKey) {
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
