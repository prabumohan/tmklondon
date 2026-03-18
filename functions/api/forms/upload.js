/**
 * POST /api/forms/upload
 * FormData: type = "donation" | "admission", file = <file>
 * Auth: session cookie. Uploads to R2 and stores metadata in KV.
 */

const COOKIE_NAME = 'tmk_admin_session';
const MAX_AGE_DAYS = 7;
const KV_KEY_PREFIX = 'forms:';
const R2_PREFIX = 'forms/';
const R2_KEYS = { donation: R2_PREFIX + 'donation.pdf', admission: R2_PREFIX + 'admission.docx' };
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

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

export async function onRequestPost(context) {
  const bucket = context.env.TMK_STORE;
  const kv = context.env.TMK_KV;
  const secret = context.env.TMK_ADMIN_API_KEY;

  if (!bucket) {
    return jsonResponse({ error: 'R2 store not configured. Add TMK_STORE (bucket: tmklondon-store) in Pages → Settings → Functions → R2.' }, 503);
  }
  if (!secret) {
    return jsonResponse({ error: 'Admin not configured' }, 503);
  }

  const cookieHeader = context.request.headers.get('Cookie') || '';
  if (!(await verifySessionCookie(secret, cookieHeader))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const contentType = context.request.headers.get('Content-Type') || '';
  let type, body, fileContentType, filename;

  if (contentType.includes('application/json')) {
    let json;
    try {
      json = await context.request.json();
    } catch (_) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
    type = (json.type || '').toString().toLowerCase();
    if (type !== 'donation' && type !== 'admission') {
      return jsonResponse({ error: 'type must be "donation" or "admission"' }, 400);
    }
    const b64 = json.file;
    if (!b64 || typeof b64 !== 'string') {
      return jsonResponse({ error: 'No file provided. Choose a file and try again.' }, 400);
    }
    filename = (json.filename || '').toString() || (type === 'donation' ? 'donation.pdf' : 'admission.docx');
    const nameLower = filename.toLowerCase();
    if (type === 'donation' && !nameLower.endsWith('.pdf')) {
      return jsonResponse({ error: 'File must be a PDF (.pdf)' }, 400);
    }
    if (type === 'admission' && !nameLower.endsWith('.docx')) {
      return jsonResponse({ error: 'File must be a Word document (.docx)' }, 400);
    }
    const binary = atob(b64.replace(/^data:[^;]+;base64,/, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    body = bytes.buffer;
    fileContentType = type === 'donation' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (body.byteLength > MAX_SIZE) {
      return jsonResponse({ error: 'File too large (max 15MB)' }, 400);
    }
  } else {
    let formData;
    try {
      formData = await context.request.formData();
    } catch (_) {
      return jsonResponse({ error: 'Invalid form data' }, 400);
    }
    type = (formData.get('type') || '').toString().toLowerCase();
    if (type !== 'donation' && type !== 'admission') {
      return jsonResponse({ error: 'type must be "donation" or "admission"' }, 400);
    }
    let file = formData.get('file');
    if (!file || typeof file === 'string') {
      for (const [, value] of formData.entries()) {
        if (value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && typeof value.size === 'number') {
          file = value;
          break;
        }
      }
    }
    if (!file || typeof file === 'string') {
      return jsonResponse({ error: 'No file provided. Choose a file and try again.' }, 400);
    }
    const name = (file.name || '').toLowerCase();
    const extOk = type === 'donation' ? name.endsWith('.pdf') : name.endsWith('.docx');
    const mimePdf = /^application\/(pdf|x-pdf)$/i.test(file.type || '');
    const mimeDocx = /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$|^application\/msword$/i.test(file.type || '');
    const typeOk = type === 'donation' ? (mimePdf || extOk) : (mimeDocx || extOk);
    if (!typeOk) {
      return jsonResponse({ error: type === 'donation' ? 'File must be a PDF (.pdf)' : 'File must be a Word document (.docx)' }, 400);
    }
    if (file.size === 0) {
      return jsonResponse({ error: 'File is empty' }, 400);
    }
    if (file.size > MAX_SIZE) {
      return jsonResponse({ error: 'File too large (max 15MB)' }, 400);
    }
    body = await file.arrayBuffer();
    fileContentType = file.type || (type === 'donation' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    filename = file.name || (type === 'donation' ? 'donation.pdf' : 'admission.docx');
  }

  const r2Key = R2_KEYS[type];
  const contentTypeForR2 = fileContentType;

  try {
    await bucket.put(r2Key, body, {
      httpMetadata: { contentType: contentTypeForR2 },
    });
  } catch (e) {
    return jsonResponse({ error: 'Upload failed' }, 500);
  }

  const meta = { uploadedAt: new Date().toISOString(), filename: filename || r2Key };
  if (kv) {
    try {
      await kv.put(KV_KEY_PREFIX + type, JSON.stringify(meta));
    } catch (_) {}
  }

  return jsonResponse({ ok: true, filename: filename || r2Key, type });
}
