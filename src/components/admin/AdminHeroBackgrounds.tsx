import { useEffect, useState, useRef } from 'react';
import { HERO_CAROUSEL_SLIDES } from '../../config/hero-backgrounds';

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

export default function AdminHeroBackgrounds() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(() => Date.now());
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const upload = async (key: string, file: File) => {
    if (!file.type.startsWith('image/') || !IMAGE_EXT.test(file.name)) {
      showMessage('error', 'Use JPG, PNG, GIF, or WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showMessage('error', `Max ${MAX_FILE_MB}MB per image.`);
      return;
    }

    setBusyKey(key);
    try {
      const b64 = await fileToBase64(file);
      const res = await fetch('/api/hero/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: key, file: b64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMessage('error', (data as { error?: string }).error || 'Upload failed');
        return;
      }
      showMessage('success', `Saved ${key}. Homepage will show the new image within a few minutes (or hard-refresh).`);
      setCacheBust(Date.now());
    } catch {
      showMessage('error', 'Network error. Upload only works on the deployed site with R2 configured.');
    } finally {
      setBusyKey(null);
      const input = fileRefs.current[key];
      if (input) input.value = '';
    }
  };

  const revert = async (key: string) => {
    if (!confirm(`Remove custom image for "${key}" and use the default from the site build?`)) return;
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
        showMessage('error', (data as { error?: string }).error || 'Revert failed');
        return;
      }
      showMessage('success', `Reverted ${key} to the default static image.`);
      setCacheBust(Date.now());
    } catch {
      showMessage('error', 'Network error.');
    } finally {
      setBusyKey(null);
    }
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
              Replace each rotating background on the home page. Images are stored in R2 under <code className="bg-gray-200 px-1 rounded text-sm">hero/</code>.
              If you have not uploaded a slot, visitors see the default file from the last deploy. <strong>Revert</strong> removes your upload so the default shows again.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {HERO_CAROUSEL_SLIDES.map((slide) => (
            <div
              key={slide.key}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
            >
              <div className="w-full sm:w-48 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={`/api/hero/image/${slide.key}?v=${cacheBust}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900">{slide.label}</h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5 break-all">{slide.key}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <input
                    ref={(el) => {
                      fileRefs.current[slide.key] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    id={`hero-file-${slide.key}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(slide.key, f);
                    }}
                  />
                  <label
                    htmlFor={`hero-file-${slide.key}`}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                      busyKey === slide.key
                        ? 'bg-gray-200 text-gray-500 cursor-wait'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {busyKey === slide.key ? 'Working…' : 'Upload replacement'}
                  </label>
                  <button
                    type="button"
                    disabled={busyKey === slide.key}
                    onClick={() => revert(slide.key)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Revert to default
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
