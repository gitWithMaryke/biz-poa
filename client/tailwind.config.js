/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f4',
          100: '#daeee5',
          200: '#b8decf',
          300: '#8ac7b1',
          400: '#58ab90',
          500: '#0F7B5A',
          600: '#0c664a',
          700: '#0a523c',
          800: '#094231',
          900: '#073628',
        },
        duka: {
          bg: '#EEF1EE',
          card: '#FFFFFF',
          fg: '#14201B',
          muted: '#5C6962',
          line: '#DAE1DC',
          accent: '#0F7B5A',
          accentSoft: '#DAEEE5',
          warn: '#9A5A0A',
          warnSoft: '#FAEACB',
          bad: '#B0322A',
          badSoft: '#F7DCD8',
          bezel: '#1B1F1D',
          stage: '#DFE5E1',
        }
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Segoe UI', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
