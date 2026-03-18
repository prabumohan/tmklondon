import { useEffect, useState, useRef } from 'react';
import JSZip from 'jszip';

interface GalleryImage {
  id: string;
  src: string;
  category: string;
  title: string;
  uploadedAt: string;
  source: 'r2' | 'local';
}

interface R2Image {
  id: string;
  category: string;
  filename: string;
  r2Key: string;
  url: string;
  uploadedAt: string;
}

const CATEGORIES = [
  { id: 'teachers', labelTa: 'எங்கள் ஆசிரியர்கள்', labelEn: 'Our Teachers' },
  { id: 'school', labelTa: 'பள்ளி நடவடிக்கைகள்', labelEn: 'School Activities' },
  { id: 'events', labelTa: 'நிகழ்வுகள்', labelEn: 'Events' },
  { id: 'community', labelTa: 'சமூக கூட்டங்கள்', labelEn: 'Community Gatherings' },
];

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;
const MAX_FILE_MB = 5;

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

export default function AdminGallery() {
  const [r2Images, setR2Images] = useState<R2Image[]>([]);
  const [localImages, setLocalImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('teachers');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [viewCategory, setViewCategory] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    loadR2Images();
    loadLocalImages();
  }, []);

  const loadR2Images = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setR2Images(Array.isArray(data) ? data : []);
      }
    } catch (_) {
      setR2Images([]);
    }
  };

  const loadLocalImages = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('galleryImages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const list = Array.isArray(parsed) ? parsed : [];
        setLocalImages(list.map((img: { id: string; src: string; category: string; title: string; uploadedAt: string }) => ({
          ...img,
          source: 'local' as const,
        })));
      } catch (_) {
        setLocalImages([]);
      }
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const uploadToR2 = async (files: File[]) => {
    const imageFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') && IMAGE_EXT.test(f.name) && f.size <= MAX_FILE_MB * 1024 * 1024
    );
    if (imageFiles.length === 0) {
      showMessage('error', 'No valid images (JPG, PNG, GIF, WebP; max 5MB each).');
      return;
    }

    setUploading(true);
    setUploadProgress(`Preparing ${imageFiles.length} image(s)...`);

    const batchSize = 10;
    let uploaded = 0;

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      setUploadProgress(`Uploading ${i + 1}-${i + batch.length} of ${imageFiles.length}...`);

      const filesPayload = await Promise.all(
        batch.map(async (file) => ({
          file: await fileToBase64(file),
          filename: file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.jpg',
        }))
      );

      try {
        const res = await fetch('/api/gallery/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory, files: filesPayload }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          uploaded += data.uploaded || batch.length;
        } else {
          showMessage('error', data?.error || `Upload failed (${res.status}).`);
          setUploading(false);
          setUploadProgress('');
          return;
        }
      } catch (e) {
        showMessage('error', 'Network error. Try again on the deployed site.');
        setUploading(false);
        setUploadProgress('');
        return;
      }
    }

    setUploadProgress('');
    setUploading(false);
    showMessage('success', `${uploaded} image(s) uploaded to R2. Visible to everyone.`);
    loadR2Images();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await uploadToR2(Array.from(files));
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadToR2(Array.from(files));
    e.target.value = '';
  };

  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress('Reading zip...');

    try {
      const zip = await JSZip.loadAsync(file);
      const imageEntries = Object.entries(zip.files).filter(
        ([name]) => !name.startsWith('__MACOSX') && IMAGE_EXT.test(name)
      );

      if (imageEntries.length === 0) {
        showMessage('error', 'No images found in the zip.');
        setUploading(false);
        setUploadProgress('');
        e.target.value = '';
        return;
      }

      setUploadProgress(`Extracting ${imageEntries.length} image(s)...`);
      const imageFiles: File[] = [];

      for (const [name, entry] of imageEntries) {
        if (entry.dir) continue;
        const blob = await entry.async('blob');
        if (blob.size > MAX_FILE_MB * 1024 * 1024) continue;
        const baseName = name.split('/').pop() || 'image.jpg';
        imageFiles.push(new File([blob], baseName, { type: blob.type || 'image/jpeg' }));
      }

      if (imageFiles.length === 0) {
        showMessage('error', 'No valid images in the zip (max 5MB each).');
        setUploading(false);
        setUploadProgress('');
        e.target.value = '';
        return;
      }

      await uploadToR2(imageFiles);
    } catch (err) {
      showMessage('error', 'Could not read zip file.');
      setUploading(false);
      setUploadProgress('');
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteR2 = async (id: string) => {
    if (!confirm('Remove this image from the gallery?')) return;
    try {
      const res = await fetch(`/api/gallery/item/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setR2Images((prev) => prev.filter((img) => img.id !== id));
        showMessage('success', 'Image removed.');
      } else {
        showMessage('error', 'Could not remove.');
      }
    } catch (_) {
      showMessage('error', 'Network error.');
    }
  };

  const handleDeleteLocal = (id: string) => {
    if (!confirm('Delete this image?')) return;
    const next = localImages.filter((img) => img.id !== id);
    setLocalImages(next);
    if (typeof window !== 'undefined') localStorage.setItem('galleryImages', JSON.stringify(next));
  };

  const handleCategoryChangeLocal = (id: string, newCategory: string) => {
    const next = localImages.map((img) => (img.id === id ? { ...img, category: newCategory } : img));
    setLocalImages(next);
    if (typeof window !== 'undefined') localStorage.setItem('galleryImages', JSON.stringify(next));
  };

  const combined: GalleryImage[] = [
    ...r2Images.map((img) => ({
      id: img.id,
      src: img.url,
      category: img.category,
      title: img.filename,
      uploadedAt: img.uploadedAt,
      source: 'r2' as const,
    })),
    ...localImages,
  ];

  const filteredImages = viewCategory === 'all' ? combined : combined.filter((img) => img.category === viewCategory);

  const storage = (() => {
    if (typeof window === 'undefined') return { used: 0, total: 5 };
    const stored = localStorage.getItem('galleryImages') || '';
    const usedMB = (stored.length * 2) / (1024 * 1024);
    return { used: usedMB.toFixed(2), total: 5 };
  })();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <a href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
                ← Back to Dashboard
              </a>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-700">Gallery Management</h1>
              <p className="text-gray-600 mt-1">Upload images to R2 (visible to everyone) or save locally.</p>
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3 max-w-xl">
                <strong>R2:</strong> Images upload to <code className="bg-green-100 px-1 rounded">tmklondon-store</code> under <code className="bg-green-100 px-1 rounded">gallery/</code>. Use <strong>individual files</strong>, <strong>folder</strong>, or <strong>zip</strong> (JPG, PNG, GIF, WebP; max 5MB each).
              </p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow">
              R2: {r2Images.length} · Local: {storage.used} MB / ~{storage.total} MB
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload to R2</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category:</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <input
                ref={(el) => {
                  folderInputRef.current = el;
                  if (el) {
                    el.setAttribute('webkitdirectory', '');
                    el.setAttribute('directory', '');
                    el.setAttribute('multiple', '');
                  }
                }}
                type="file"
                className="hidden"
                onChange={handleFolderSelect}
              />
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Choose files
              </button>
              {typeof document !== 'undefined' && 'webkitdirectory' in document.createElement('input') && (
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  Choose folder
                </button>
              )}
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                Upload zip
              </button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mb-2" />
                  <p className="text-gray-600 text-sm">{uploadProgress || 'Uploading...'}</p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Drop images here, or use buttons above (files / folder / zip)</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Images ({filteredImages.length})</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    viewCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setViewCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      viewCategory === cat.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No images yet. Upload using the options above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <img src={image.src} alt={image.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {CATEGORIES.find((c) => c.id === image.category)?.labelEn || image.category}
                      {image.source === 'r2' && ' (R2)'}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex flex-col items-center justify-center p-2">
                      {image.source === 'local' && (
                        <select
                          value={image.category}
                          onChange={(e) => handleCategoryChangeLocal(image.id, e.target.value)}
                          className="w-full mb-2 px-2 py-1 text-xs rounded bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.labelEn}</option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => (image.source === 'r2' ? handleDeleteR2(image.id) : handleDeleteLocal(image.id))}
                        className="w-full px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
            <strong>Upload options:</strong> Individual files, folder (browser allows picking a folder), or a .zip containing images. All upload to R2 and appear on the public gallery for everyone.
          </div>
        </div>
      </div>
    </div>
  );
}
