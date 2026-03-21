import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [heroVideoId, setHeroVideoId] = useState('');
  const [heroVideoSaved, setHeroVideoSaved] = useState(false);

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      setHeroVideoId(localStorage.getItem('heroYoutubeVideoId') || 'dqw9Eto_3JU');
    }
  }, []);

  const handleSaveHeroVideo = () => {
    const id = heroVideoId.trim();
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('heroYoutubeVideoId', id);
      } else {
        localStorage.removeItem('heroYoutubeVideoId');
      }
      setHeroVideoSaved(true);
      setTimeout(() => setHeroVideoSaved(false), 3000);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminLoggedIn');
      sessionStorage.removeItem('adminUsername');
      sessionStorage.removeItem('loginTime');
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="w-full max-w-[100vw] overflow-x-hidden px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-x-6 gap-y-6 sm:gap-x-8 lg:gap-x-10 lg:gap-y-8 lg:items-start">
          <div className="flex justify-between items-center gap-4 lg:col-start-2 lg:row-start-1 lg:mb-0 mb-2 lg:pr-6 xl:pr-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary-700">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shrink-0"
            >
              Logout
            </button>
          </div>

          <aside className="flex w-full justify-start lg:flex-shrink-0 lg:col-start-1 lg:row-start-2 lg:self-start lg:sticky lg:top-28 xl:top-32 pl-0 lg:pl-4 xl:pl-6">
            <a
              href="/"
              className="group block rounded-full shadow-xl ring-4 ring-primary-100/90 transition-transform hover:scale-[1.02]"
              aria-label="Home"
            >
              <img
                src="/logo.png"
                alt="TMK London - London Tamil Sangam"
                className="h-48 w-48 sm:h-56 sm:w-56 lg:h-72 lg:w-72 xl:h-80 xl:w-80 2xl:h-96 2xl:w-96 rounded-full object-cover"
                width={384}
                height={384}
                loading="eager"
                decoding="async"
              />
            </a>
          </aside>

          <div className="min-w-0 space-y-6 mb-8 lg:col-start-2 lg:row-start-2 lg:max-w-6xl lg:pr-6 xl:pr-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a 
                href="/admin/news" 
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
              >
                <div className="text-3xl mb-3">📰</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">News Ticker</h2>
                <p className="text-gray-600">Update news ticker messages</p>
              </a>

              <a
                href="/admin/events"
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
              >
                <div className="text-3xl mb-3">📅</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Upcoming events</h2>
                <p className="text-gray-600">Home page “Education &amp; Community” event cards (KV)</p>
              </a>
              
              <a 
                href="/admin/gallery" 
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
              >
                <div className="text-3xl mb-3">🖼️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Gallery</h2>
                <p className="text-gray-600">Upload and manage gallery images</p>
              </a>
              
              <a 
                href="/admin/forms" 
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
              >
                <div className="text-3xl mb-3">📄</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Forms</h2>
                <p className="text-gray-600">Update donation PDF and admission form (stored in R2)</p>
              </a>

              <a
                href="/admin/hero"
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
              >
                <div className="text-3xl mb-3">🌅</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Hero backgrounds</h2>
                <p className="text-gray-600">Home page rotating background images (R2)</p>
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href="/admin/students" 
                className="block p-6 rounded-xl border border-gray-300 bg-gray-100/90 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-400"
              >
                <div className="text-3xl mb-3 opacity-60 grayscale">👥</div>
                <h2 className="text-xl font-semibold text-gray-500 mb-2">Student Management</h2>
                <p className="text-gray-400">Manage student registrations and data</p>
              </a>
              
              <div className="block p-6 rounded-xl border border-gray-300 bg-gray-100/90 shadow-sm">
                <div className="text-3xl mb-3 opacity-60 grayscale">📊</div>
                <h2 className="text-xl font-semibold text-gray-500 mb-2">Analytics</h2>
                <p className="text-gray-400">Coming soon</p>
              </div>
            </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hero YouTube Video</h2>
            <p className="text-gray-600 mb-4">Video shown on the right side of the homepage hero. Use the video ID from the YouTube URL (e.g. <code className="bg-gray-100 px-1 rounded">dqw9Eto_3JU</code> from youtube.com/watch?v=dqw9Eto_3JU).</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={heroVideoId}
                onChange={(e) => setHeroVideoId(e.target.value)}
                placeholder="e.g. dqw9Eto_3JU"
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 w-full max-w-md"
              />
              <button
                onClick={handleSaveHeroVideo}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Save
              </button>
              {heroVideoSaved && <span className="text-green-600 font-medium">Saved. Homepage will use this video.</span>}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
