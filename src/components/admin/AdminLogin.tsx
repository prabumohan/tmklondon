import React, { useState, useEffect } from 'react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'wasd@5:30'
  };

  // Check if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') === 'true') {
      window.location.href = '/admin/dashboard';
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Set session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        sessionStorage.setItem('loginTime', new Date().toISOString());

        // Redirect to dashboard
        window.location.href = '/admin/dashboard';
      }
    } else {
      setError('Invalid username or password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-4xl">
            🔐
          </div>
          <h1 className="text-3xl font-bold text-primary-700 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter your credentials to access the admin portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter your username"
              className={`w-full px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:ring-4 focus:ring-primary-500/20 ${
                error ? 'border-red-500' : 'border-gray-300 focus:border-primary-600'
              }`}
              autoFocus
            />
          </div>

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
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20"
          >
            Login
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
