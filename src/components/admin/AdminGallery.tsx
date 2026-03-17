import { useEffect, useState, useRef } from 'react';

interface GalleryImage {
  id: string;
  src: string;
  category: string;
  title: string;
  uploadedAt: string;
}

const CATEGORIES = [
  { id: 'teachers', labelTa: 'எங்கள் ஆசிரியர்கள்', labelEn: 'Our Teachers' },
  { id: 'school', labelTa: 'பள்ளி நடவடிக்கைகள்', labelEn: 'School Activities' },
  { id: 'events', labelTa: 'நிகழ்வுகள்', labelEn: 'Events' },
  { id: 'community', labelTa: 'சமூக கூட்டங்கள்', labelEn: 'Community Gatherings' },
];

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('teachers');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewCategory, setViewCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    loadImages();
  }, []);

  const loadImages = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('galleryImages');
      if (stored) {
        try {
          setImages(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading images:', e);
        }
      }
    }
  };

  const saveImages = (newImages: GalleryImage[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('galleryImages', JSON.stringify(newImages));
      setImages(newImages);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: GalleryImage[] = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // Check file size (max 2MB for localStorage)
      if (file.size > 2 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 2MB.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newImages.push({
          id: `img_${Date.now()}_${i}`,
          src: base64,
          category: selectedCategory,
          title: file.name.replace(/\.[^/.]+$/, ''),
          uploadedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    saveImages(newImages);
    setUploading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      const newImages = images.filter(img => img.id !== id);
      saveImages(newImages);
    }
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    const newImages = images.map(img => 
      img.id === id ? { ...img, category: newCategory } : img
    );
    saveImages(newImages);
  };

  const filteredImages = viewCategory === 'all' 
    ? images 
    : images.filter(img => img.category === viewCategory);

  const getStorageUsage = () => {
    if (typeof window === 'undefined') return { used: 0, total: 5 };
    const stored = localStorage.getItem('galleryImages') || '';
    const usedMB = (stored.length * 2) / (1024 * 1024); // Rough estimate
    return { used: usedMB.toFixed(2), total: 5 };
  };

  const storage = getStorageUsage();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <a href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
                ← Back to Dashboard
              </a>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-700">Gallery Management</h1>
              <p className="text-gray-600 mt-1">Upload and manage gallery images</p>
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 max-w-xl">
                <strong>Where are images stored?</strong> They are saved in <strong>this browser’s localStorage</strong> (as base64). They appear on the public gallery page only when viewed in the same browser/device where you uploaded them. Other visitors and other devices will not see them. Max ~2MB per image; total space is limited by the browser (~5–10 MB).
              </p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow">
              Storage: {storage.used} MB / ~{storage.total} MB
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Images</h2>
            
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category for Upload:
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Uploading images...</p>
                </div>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, GIF (max 2MB each)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Uploaded Images ({filteredImages.length})
              </h2>
              
              {/* Filter by Category */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewCategory === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setViewCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      viewCategory === cat.id
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No images uploaded yet</p>
                <p className="text-sm mt-1">Upload images using the form above</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map(image => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex flex-col items-center justify-center p-2">
                      <select
                        value={image.category}
                        onChange={(e) => handleCategoryChange(image.id, e.target.value)}
                        className="w-full mb-2 px-2 py-1 text-xs rounded bg-white text-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.labelEn}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="w-full px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {CATEGORIES.find(c => c.id === image.category)?.labelEn || image.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">📝 Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• <strong>Upload:</strong> Click the upload area or drag and drop images</li>
              <li>• <strong>Category:</strong> Select a category before uploading to organize images</li>
              <li>• <strong>Change Category:</strong> Hover over an image and use the dropdown to change its category</li>
              <li>• <strong>Delete:</strong> Hover over an image and click "Delete" to remove it</li>
              <li>• <strong>Storage:</strong> Images are stored in browser storage (max ~5MB total)</li>
              <li>• <strong>Note:</strong> Images will appear on the public gallery page automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
