import { useState, useEffect, useRef } from 'react';

type FormType = 'donation' | 'admission';

interface FormMeta {
  uploadedAt?: string;
  filename?: string;
}

const LABELS: Record<FormType, { title: string; accept: string; hint: string }> = {
  donation: {
    title: 'Donation Form (Bankers & Member)',
    accept: 'application/pdf,.pdf',
    hint: 'PDF, max 15MB. Served from R2; each download = 1 read (free tier: 10M reads/month).',
  },
  admission: {
    title: 'Tamil School Admission Form',
    accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx',
    hint: 'Word .docx, max 15MB. Stored in R2; same free tier applies.',
  },
};

export default function AdminForms() {
  const [meta, setMeta] = useState<Record<FormType, FormMeta | null>>({
    donation: null,
    admission: null,
  });
  const [uploading, setUploading] = useState<FormType | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const donationInput = useRef<HTMLInputElement>(null);
  const admissionInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    loadMetadata();
  }, []);

  const loadMetadata = () => {
    fetch('/api/forms/metadata')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        setMeta({
          donation: data.donation || null,
          admission: data.admission || null,
        });
      })
      .catch(() => {});
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpload = async (type: FormType, file: File | null) => {
    if (!file) return;
    setUploading(type);
    setMessage(null);
    const formData = new FormData();
    formData.set('type', type);
    formData.append('file', file);

    try {
      const res = await fetch('/api/forms/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showMessage('success', `${LABELS[type].title} updated.`);
        loadMetadata();
        if (type === 'donation' && donationInput.current) donationInput.current.value = '';
        if (type === 'admission' && admissionInput.current) admissionInput.current.value = '';
      } else {
        let msg = data?.error;
        if (!msg) {
          if (res.status === 401) msg = 'Session expired. Log in again at /admin/login.';
          else if (res.status === 404 && typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location?.host || ''))
            msg = 'Upload is not available locally. Deploy the site and use the live URL (e.g. your Cloudflare Pages URL) to upload forms.';
          else msg = `Upload failed (${res.status}).`;
        }
        showMessage('error', msg);
      }
    } catch (e) {
      showMessage('error', 'Network error. Upload works on the deployed site once R2 is configured.');
    } finally {
      setUploading(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">← Back to Dashboard</a>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-700">Forms</h1>
            <p className="text-gray-600 mt-1">Update the donation PDF and admission Word form. Stored in R2 bucket <code className="bg-gray-100 px-1 rounded">tmklondon-store</code> under <code className="bg-gray-100 px-1 rounded">forms/</code> (same bucket can be used for gallery images in other folders).</p>
          </div>

          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {(['donation', 'admission'] as const).map((type) => (
              <div key={type} className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{LABELS[type].title}</h2>
                <p className="text-sm text-gray-500 mb-2">{LABELS[type].hint}</p>
                {meta[type]?.uploadedAt && (
                  <p className="text-sm text-gray-600 mb-2">
                    Current: {meta[type].filename || (type === 'donation' ? 'donation.pdf' : 'admission.docx')} — uploaded {formatDate(meta[type].uploadedAt)}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={type === 'donation' ? donationInput : admissionInput}
                    type="file"
                    accept={LABELS[type].accept}
                    className="block max-w-xs text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium hover:file:bg-primary-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = type === 'donation' ? donationInput.current : admissionInput.current;
                      const f = input?.files?.[0];
                      if (f) handleUpload(type, f);
                      else showMessage('error', 'Choose a file first.');
                    }}
                    disabled={uploading !== null}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {uploading === type ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Public link: <code className="bg-gray-100 px-1 rounded">{type === 'donation' ? '/api/forms/donation' : '/api/forms/admission'}</code>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>R2 setup:</strong> Create bucket <code className="bg-amber-100 px-1 rounded">tmklondon-store</code> in Cloudflare R2 (shared for forms + gallery). In Pages → Settings → Functions → R2 bucket bindings, add <code className="bg-amber-100 px-1 rounded">TMK_STORE</code> → that bucket. Forms go in <code className="bg-amber-100 px-1 rounded">forms/</code>; you can use other folders (e.g. <code className="bg-amber-100 px-1 rounded">gallery/</code>) later.
          </div>
        </div>
      </div>
    </div>
  );
}
