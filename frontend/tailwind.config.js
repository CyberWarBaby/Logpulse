/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d0d0f',
          1: '#141416',
          2: '#1c1c1f',
          3: '#242428',
          4: '#2e2e33',
        },
        border: {
          DEFAULT: '#2a2a30',
          subtle: '#1f1f24',
          strong: '#3a3a42',
        },
        accent: {
          DEFAULT: '#6c63ff',
          dim: '#4c44cc',
          glow: 'rgba(108, 99, 255, 0.15)',
        },
        log: {
          info: '#3b82f6',
          warn: '#f59e0b',
          error: '#ef4444',
          debug: '#8b5cf6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        glow: {
          from: { boxShadow: '0 0 5px rgba(108,99,255,0.3)' },
          to: { boxShadow: '0 0 20px rgba(108,99,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
