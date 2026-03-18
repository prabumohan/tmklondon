import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    newsItems: 0,
    events: 0
  });
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
    loadStats();
    if (typeof window !== 'undefined') {
      setHeroVideoId(localStorage.getItem('heroYoutubeVideoId') || 'dqw9Eto_3JU');
    }
  }, []);

  const loadStats = async () => {
    try {
      // Load students from localStorage or API
      if (typeof window !== 'undefined') {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const newsItems = JSON.parse(localStorage.getItem('newsTickerItems') || '[]');
        
        setStats({
          students: students.length || 0,
          classes: 3, // Fixed for now
          newsItems: newsItems.length || 0,
          events: 0 // Can be added later
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-primary-700">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <a 
              href="/admin/students" 
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
            >
              <div className="text-3xl mb-3">👥</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Student Management</h2>
              <p className="text-gray-600">Manage student registrations and data</p>
            </a>
            
            <a 
              href="/admin/news" 
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
            >
              <div className="text-3xl mb-3">📰</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">News Ticker</h2>
              <p className="text-gray-600">Update news ticker messages</p>
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
              <p className="text-gray-600">View form paths and how to update (replace file + redeploy)</p>
            </a>
            
            <a 
              href="/menu-options" 
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-primary-500/20 hover:border-primary-600"
            >
              <div className="text-3xl mb-3">📋</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Menu bar options</h2>
              <p className="text-gray-600">Choose menu style, layout, dropdown, mobile, and ticker</p>
            </a>
            
            <div className="block p-6 bg-white rounded-xl shadow-lg border-2 border-gray-200">
              <div className="text-3xl mb-3">📊</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Analytics</h2>
              <p className="text-gray-600">Coming soon</p>
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

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-100 rounded-lg">
                <div className="text-3xl font-bold text-primary-700">{stats.students}</div>
                <div className="text-sm text-gray-600 mt-1">Total Students</div>
              </div>
              <div className="text-center p-4 bg-primary-100 rounded-lg">
                <div className="text-3xl font-bold text-primary-700">{stats.classes}</div>
                <div className="text-sm text-gray-600 mt-1">Active Classes</div>
              </div>
              <div className="text-center p-4 bg-primary-100 rounded-lg">
                <div className="text-3xl font-bold text-primary-700">{stats.newsItems}</div>
                <div className="text-sm text-gray-600 mt-1">News Items</div>
              </div>
              <div className="text-center p-4 bg-primary-100 rounded-lg">
                <div className="text-3xl font-bold text-primary-700">{stats.events}</div>
                <div className="text-sm text-gray-600 mt-1">Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
