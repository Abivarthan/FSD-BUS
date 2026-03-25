/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          hover: '#F1F5F9',
          border: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        accent: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        }
      }
    }
  },
  plugins: []
}
