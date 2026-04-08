/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#ffffff',    // white
          secondary: '#f8fafc',  // slate-50
          tertiary: '#f1f5f9',   // slate-100
        },
        text: {
          primary: '#0f172a',    // slate-900
          secondary: '#475569',  // slate-600
          tertiary: '#94a3b8',   // slate-400
        },
        accent: {
          primary: '#2563eb',    // blue-600 (Darker/more professional blue)
          hover: '#1d4ed8',      // blue-700
          light: '#eff6ff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
      }
    },
  },
  plugins: [],
}
