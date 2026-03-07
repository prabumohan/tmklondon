/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Riyadh Tamil Sangam–style: maroon primary, saffron accent
        primary: {
          DEFAULT: '#6B2D3C',
          dark: '#5C1A1B',
          light: '#8B3A4B',
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#e85d5d',
          500: '#b91c1c',
          600: '#7f1d1d',
          700: '#6B2D3C',
          800: '#5C1A1B',
          900: '#451a1a',
        },
        secondary: {
          DEFAULT: '#475569',
          dark: '#334155',
          light: '#64748b',
        },
        accent: {
          DEFAULT: '#0d9488', // Teal – primary CTA and nav highlight (single theme)
          dark: '#0f766e',
          light: '#14b8a6',
        },
        warm: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'trust': '0 4px 14px 0 rgba(107, 45, 60, 0.12)',
        'trust-lg': '0 10px 40px -10px rgba(92, 26, 27, 0.15)',
      },
    },
  },
  plugins: [],
};
