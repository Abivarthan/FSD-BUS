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
          DEFAULT: '#0F172A', // Dark Navy Background
          card: '#1E293B',    // Slightly Lighter Navy for Cards
          hover: '#334155',
          border: '#334155',
        },
        primary: {
          DEFAULT: '#7C3AED', // Vibrant Violet
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        accent: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        }
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(124, 58, 237, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
      }
    }
  },
  plugins: []
}
