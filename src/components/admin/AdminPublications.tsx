import { useEffect, useState, useRef } from 'react';
import type { PublicationListItem } from '../PublicationsSection';

const BLURB_40TH = 'https://www.blurb.co.uk/books/6840280-40-t-m-k-40th-year-souvenir';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyRow(): PublicationListItem {
  return {
    id: '',
    publisher: '',
    publisherNoteTa: '',
    publisherNoteEn: '',
    titleTa: '',
    titleEn: '',
    href: 'https://',
    ctaTa: 'பார்க்க',
    ctaEn: 'View',
    coverKey: null,
    thumbnailAltTa: '',
    thumbnailAltEn: '',
  };
}

function blurbSample(): PublicationListItem {
  return {
    id: 'tmk-40th-souvenir',
    publisher: 'Blurb Books UK',
    publisherNoteTa: 'அச்சிடப்பட்ட புத்தகங்கள் · இணைய விற்பனை',
    publisherNoteEn: 'Print-on-demand books · Online bookstore',
    titleTa: '40 T.M.K. — 40-வது ஆண்டு நினைவிதழ்',
    titleEn: '40 T.M.K. — 40th Year Souvenir',
    href: BLURB_40TH,
    ctaTa: 'Blurb இல் பார்க்க',
    ctaEn: 'View on Blurb',
    coverKey: null,
    thumbnailAltTa: '40-வது ஆண்டு நினைவிதழ் — முன்பக்க முன்னோட்டம்',
    thumbnailAltEn: '40th year souvenir — cover / first page preview',
  };
}

export default function AdminPublications() {
  const [items, setItems] = useState<PublicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    loadList();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publications/list');
      const data = await res.json();
      const raw = Array.isArray(data.items) ? data.items : [];
      if (raw.length === 0) {
        setItems([emptyRow()]);
      } else {
        setItems(
          raw.map((r: Record<string, unknown>) => ({
            id: String(r.id || ''),
            publisher: String(r.publisher || ''),
            publisherNoteTa: String(r.publisherNoteTa || ''),
            publisherNoteEn: String(r.publisherNoteEn || ''),
            titleTa: String(r.titleTa || ''),
            titleEn: String(r.titleEn || ''),
            href: String(r.href || 'https://'),
            ctaTa: String(r.ctaTa || 'பார்க்க'),
            ctaEn: String(r.ctaEn || 'View'),
            coverKey: r.coverKey ? String(r.coverKey) : null,
            thumbnailAltTa: String(r.thumbnailAltTa || ''),
            thumbnailAltEn: String(r.thumbnailAltEn || ''),
          }))
        );
      }
    } catch (_) {
      setItems([emptyRow()]);
      showMessage('error', 'Could not load publications list.');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, patch: Partial<PublicationListItem>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setItems((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));
  };

  const insertSample = () => {
    setItems((prev) => {
      const withoutEmpty =
        prev.length === 1 && !prev[0].id.trim() && !prev[0].publisher.trim() ? [] : prev;
      return [...withoutEmpty, blurbSample()];
    });
  };

  const uploadCoverForRow = async (index: number, file: File) => {
    const row = items[index];
    const id = row.id.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(id)) {
      showMessage('error', 'Set a valid id (lowercase, numbers, hyphens) before uploading a cover.');
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      const res = await fetch('/api/publications/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'uploadCover',
          id,
          filename: file.name,
          file: b64,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage('error', (data as { error?: string }).error || 'Upload failed');
        return;
      }
      const coverKey = (data as { coverKey?: string }).coverKey;
      if (coverKey) updateRow(index, { coverKey });
      showMessage('success', 'Cover uploaded. Save manifest to persist other edits.');
    } catch (_) {
      showMessage('error', 'Upload failed');
    }
  };

  const saveManifest = async () => {
    const trimmed = items.map((r) => ({
      ...r,
      id: r.id.trim().toLowerCase(),
    }));
    for (const r of trimmed) {
      if (!r.id || !/^[a-z0-9][a-z0-9-]{0,80}$/.test(r.id)) {
        showMessage('error', 'Each row needs a valid id.');
        return;
      }
      if (!r.publisher.trim()) {
        showMessage('error', 'Publisher is required on each row.');
        return;
      }
      if (!r.href.trim().startsWith('https://')) {
        showMessage('error', 'Each link must start with https://');
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/publications/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'setManifest', items: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage('error', (data as { error?: string }).error || 'Save failed');
        return;
      }
      showMessage('success', `Saved ${(data as { count?: number }).count ?? trimmed.length} publication(s) to R2.`);
      await loadList();
    } catch (_) {
      showMessage('error', 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <p className="text-center text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Publications</h1>
          <a href="/admin" className="text-primary-600 hover:underline font-medium">
            ← Dashboard
          </a>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Entries are stored in R2 as <code className="bg-gray-200 px-1 rounded text-sm">publications/manifest.json</code> and
          cover images under <code className="bg-gray-200 px-1 rounded text-sm">publications/covers/</code>. The public page loads
          this list; if the manifest is empty, the site shows the built-in fallback (Blurb 40th + local cover file if present).
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 bg-white border-2 border-primary-500 text-primary-700 rounded-lg hover:bg-primary-50 font-medium"
          >
            Add row
          </button>
          <button
            type="button"
            onClick={insertSample}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Insert Blurb 40th sample
          </button>
          <button
            type="button"
            onClick={saveManifest}
            disabled={saving}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving…' : 'Save to R2'}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (
                typeof window !== 'undefined' &&
                !window.confirm(
                  'Remove all publications from R2? The public site will show the built-in fallback until you save entries again.'
                )
              ) {
                return;
              }
              setSaving(true);
              try {
                const res = await fetch('/api/publications/manage', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ action: 'setManifest', items: [] }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  showMessage('error', (data as { error?: string }).error || 'Clear failed');
                  return;
                }
                showMessage('success', 'R2 manifest cleared. Public page will use fallback.');
                await loadList();
              } catch (_) {
                showMessage('error', 'Clear failed');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
          >
            Clear R2 (use fallback)
          </button>
        </div>

        <div className="space-y-8">
          {items.map((row, index) => (
            <div key={`${index}-${row.id}`} className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Publication {index + 1}</h2>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Id (slug)</span>
                  <input
                    value={row.id}
                    onChange={(e) => updateRow(index, { id: e.target.value.toLowerCase() })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. tmk-40th-souvenir"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Publisher</span>
                  <input
                    value={row.publisher}
                    onChange={(e) => updateRow(index, { publisher: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Link (https)</span>
                  <input
                    value={row.href}
                    onChange={(e) => updateRow(index, { href: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Title (TA)</span>
                  <input
                    value={row.titleTa}
                    onChange={(e) => updateRow(index, { titleTa: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Title (EN)</span>
                  <input
                    value={row.titleEn}
                    onChange={(e) => updateRow(index, { titleEn: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Publisher note (TA)</span>
                  <input
                    value={row.publisherNoteTa}
                    onChange={(e) => updateRow(index, { publisherNoteTa: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Publisher note (EN)</span>
                  <input
                    value={row.publisherNoteEn}
                    onChange={(e) => updateRow(index, { publisherNoteEn: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Button (TA)</span>
                  <input
                    value={row.ctaTa}
                    onChange={(e) => updateRow(index, { ctaTa: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Button (EN)</span>
                  <input
                    value={row.ctaEn}
                    onChange={(e) => updateRow(index, { ctaEn: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Cover image alt (EN)</span>
                  <input
                    value={row.thumbnailAltEn}
                    onChange={(e) => updateRow(index, { thumbnailAltEn: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Cover image alt (TA)</span>
                  <input
                    value={row.thumbnailAltTa}
                    onChange={(e) => updateRow(index, { thumbnailAltTa: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  ref={(el) => {
                    fileRefs.current[`f-${index}`] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCoverForRow(index, f);
                    e.target.value = '';
                  }}
                />
                {row.coverKey && (
                  <span className="text-sm text-green-700">
                    Cover: <code className="bg-gray-100 px-1 rounded">{row.coverKey}</code>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
