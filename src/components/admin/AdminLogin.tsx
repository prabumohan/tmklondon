import React, { useState, useEffect } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') === 'true') {
      window.location.href = '/admin/dashboard';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminLoggedIn', 'true');
          sessionStorage.setItem('adminUsername', 'admin');
          sessionStorage.setItem('loginTime', new Date().toISOString());
        }
        window.location.href = '/admin/dashboard';
        return;
      }

      if (res.status === 404) {
        // Local dev: no Functions, allow through so admin UI is usable (saves to live site will fail)
        if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
          sessionStorage.setItem('adminLoggedIn', 'true');
          sessionStorage.setItem('adminUsername', 'admin');
          window.location.href = '/admin/dashboard';
          return;
        }
      }

      const data = await res.json().catch(() => ({}));
      setError(data?.error === 'Invalid credentials' ? 'Invalid password. Use the value set in Cloudflare as TMK_ADMIN_API_KEY.' : (data?.error || 'Login failed.'));
      setPassword('');
    } catch (_) {
      setError('Network error. Try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            <img
              src="/logo.png"
              alt="TMK London - London Tamil Sangam"
              className="h-40 w-40 sm:h-44 sm:w-44 rounded-full object-cover shadow-xl ring-2 ring-primary-100"
              width={176}
              height={176}
              loading="eager"
              decoding="async"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary-700 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter your admin password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg text-base transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20 ${
                  error ? 'border-red-500' : 'border-gray-300 focus:border-primary-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-600 transition-colors p-2"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <a
          href="/"
          className="block mt-6 text-center text-gray-600 hover:text-primary-600 transition-colors text-sm"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
