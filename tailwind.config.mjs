/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e', // Modern Teal
          dark: '#0d9488',     // Dark Teal
          light: '#14b8a6',    // Light Teal
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        secondary: {
          DEFAULT: '#475569',  // Slate Gray
          dark: '#334155',     // Dark Slate
          light: '#64748b',    // Light Slate
        },
        accent: {
          DEFAULT: '#f59e0b',  // Warm Amber
          dark: '#d97706',     // Dark Amber
          light: '#fbbf24',    // Light Amber
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
