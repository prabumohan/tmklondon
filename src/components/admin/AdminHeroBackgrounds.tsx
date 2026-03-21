import { useEffect, useState, useCallback } from 'react';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;
const MAX_FILE_MB = 8;

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

function heroImageUrl(key: string, cacheBust?: number) {
  const path = key.split('/').map(encodeURIComponent).join('/');
  const q = cacheBust != null ? `?v=${cacheBust}` : '';
  return `/api/hero/image/${path}${q}`;
}

/** Client-side mirror of worker validation (loose). */
function sanitizeSlot(input: string): string | null {
  const s = input.trim().replace(/^\/+/g, '').replace(/\\/g, '/');
  if (!s || s.includes('..') || s.includes('//')) return null;
  if (!IMAGE_EXT.test(s)) return null;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(s)) return null;
  const parts = s.split('/');
  for (const p of parts) {
    if (!p || p === '.' || p === '..') return null;
  }
  return s;
}

export default function AdminHeroBackgrounds() {
  const [keys, setKeys] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(() => Date.now());
  const [newSlot, setNewSlot] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);

  const loadKeys = useCallback(async () => {
    setListLoading(true);
    try {
      const r = await fetch('/api/hero/list');
      const d = r.ok ? await r.json() : { keys: [] };
      setKeys(Array.isArray(d.keys) ? d.keys : []);
    } catch {
      setKeys([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    void loadKeys();
  }, [loadKeys]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const upload = async (slot: string, file: File) => {
    if (!file.type.startsWith('image/') || !IMAGE_EXT.test(file.name)) {
      showMessage('error', 'Use JPG, PNG, GIF, or WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showMessage('error', `Max ${MAX_FILE_MB}MB per image.`);
      return;
    }

    setBusyKey(slot);
    try {
      const b64 = await fileToBase64(file);
      const res = await fetch('/api/hero/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, file: b64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage('error', (data as { error?: string }).error || 'Upload failed');
        return;
      }
      showMessage('success', `Saved as hero/${slot}. Homepage carousel uses all images in R2 (alphabetical order).`);
      setCacheBust(Date.now());
      await loadKeys();
    } catch {
      showMessage('error', 'Network error. Upload only works on the deployed site with R2 configured.');
    } finally {
      setBusyKey(null);
    }
  };

  const removeFromR2 = async (key: string) => {
    if (!confirm(`Delete "${key}" from R2? It will disappear from the homepage carousel if it was listed there.`)) return;
    setBusyKey(key);
    try {
      const res = await fetch('/api/hero/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: key, action: 'revert' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage('error', (data as { error?: string }).error || 'Delete failed');
        return;
      }
      showMessage('success', `Removed ${key}.`);
      setCacheBust(Date.now());
      await loadKeys();
    } catch {
      showMessage('error', 'Network error.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddUpload = () => {
    if (!addFile) {
      showMessage('error', 'Choose an image file.');
      return;
    }
    const fromName = addFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
    const slot = sanitizeSlot(newSlot.trim() || fromName);
    if (!slot) {
      showMessage(
        'error',
        'Enter a valid storage name ending in .jpg / .png / .gif / .webp (letters, numbers, dots, dashes, underscores; optional folders like slides/01.jpg).'
      );
      return;
    }
    void upload(slot, addFile);
    setAddFile(null);
    setNewSlot('');
    const el = document.getElementById('hero-add-file') as HTMLInputElement | null;
    if (el) el.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <a href="/admin/dashboard" className="text-primary-600 hover:underline text-sm font-medium">
              ← Admin dashboard
            </a>
            <h1 className="text-3xl font-bold text-primary-700 mt-2">Homepage hero backgrounds</h1>
            <p className="text-gray-600 mt-1 max-w-2xl">
              Images in R2 under <code className="bg-gray-200 px-1 rounded text-sm">hero/</code> drive the{' '}
              <strong>home page rotating backgrounds</strong>. Order is <strong>alphabetical</strong> by path — use names like{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">01_sunset.jpg</code>,{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">02_bridge.jpg</code> to control order. If the bucket has{' '}
              <strong>no</strong> hero images, the site uses the built-in defaults from the last deploy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadKeys()}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Refresh list
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Add image</h2>
          <p className="text-sm text-gray-600 mb-4">
            Storage path (under <code className="bg-gray-100 px-1 rounded">hero/</code>), then choose file. Leave name blank to use the file name.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Storage path / filename</label>
              <input
                type="text"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="e.g. 01_hero.jpg or slides/main.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Image file</label>
              <input
                id="hero-add-file"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <button
              type="button"
              disabled={busyKey !== null}
              onClick={handleAddUpload}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              Upload to R2
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Images currently in R2 (homepage carousel)</h2>
        {listLoading ? (
          <p className="text-gray-500">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
            No images in <code className="font-mono">hero/</code> yet. The live homepage will use the default carousel from the site build until you upload at least one image here.
          </p>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-48 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={heroImageUrl(key, cacheBust)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-gray-800 break-all">{key}</p>
                  <p className="text-xs text-gray-500 mt-1">Public URL: {heroImageUrl(key)}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                        input.onchange = () => {
                          const f = input.files?.[0];
                          if (f) void upload(key, f);
                        };
                        input.click();
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {busyKey === key ? 'Working…' : 'Replace'}
                    </button>
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() => removeFromR2(key)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete from R2
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
