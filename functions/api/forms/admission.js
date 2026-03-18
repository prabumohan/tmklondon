/**
 * GET /api/forms/admission — serve DOCX from R2, or redirect to static file.
 */

const R2_KEY = 'forms/admission.docx';
const STATIC_FALLBACK = '/forms/Tamil_School_Admission_Form_New_V3.0.docx';

export async function onRequestGet(context) {
  const bucket = context.env.TMK_STORE;
  if (!bucket) {
    return Response.redirect(new URL(STATIC_FALLBACK, context.request.url), 302);
  }
  try {
    const obj = await bucket.get(R2_KEY);
    if (!obj) {
      return Response.redirect(new URL(STATIC_FALLBACK, context.request.url), 302);
    }
    const headers = new Headers();
    headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', 'attachment; filename="Tamil_School_Admission_Form_New_V3.0.docx"');
    return new Response(obj.body, { headers });
  } catch (_) {
    return Response.redirect(new URL(STATIC_FALLBACK, context.request.url), 302);
  }
}
