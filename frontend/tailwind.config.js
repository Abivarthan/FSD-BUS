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
          DEFAULT: '#020617', // Deepest Navy
          card: '#0F172A',    // Rich Slate
          hover: '#1E293B',   // Slate 800
          border: '#334155',  // Slate 700
        },
        primary: {
          DEFAULT: '#818CF8', // Soft Indigo
          light: '#A5B4FC',
          dark: '#6366F1',
        },
        accent: {
          gold: '#F59E0B',
          emerald: '#10B981',
          rose: '#F472B6',
          violet: '#8B5CF6',
          cyan: '#22D3EE',
        }
      }
    }
  },
  plugins: []
}
