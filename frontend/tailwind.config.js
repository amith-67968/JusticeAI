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
        },
        "surface-bright": "#f7f9fb",
        "tertiary": "#000000",
        "on-tertiary-fixed-variant": "#5d4124",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#2d3133",
        "on-primary-container": "#76849f",
        "secondary": "#0051d5",
        "secondary-container": "#316bf3",
        "on-tertiary-container": "#9f7d5b",
        "on-tertiary-fixed": "#2b1701",
        "error": "#ba1a1a",
        "on-primary-fixed-variant": "#39475f",
        "on-primary": "#ffffff",
        "primary-container": "#0d1c32",
        "background": "#f7f9fb",
        "surface": "#f7f9fb",
        "primary": "#000000",
        "on-secondary-container": "#fefcff",
        "surface-variant": "#e0e3e5",
        "tertiary-container": "#2b1701",
        "surface-tint": "#515f78",
        "tertiary-fixed": "#ffdcbd",
        "surface-dim": "#d8dadc",
        "on-secondary": "#ffffff",
        "on-surface-variant": "#44474d",
        "on-tertiary": "#ffffff",
        "inverse-primary": "#b9c7e4",
        "on-secondary-fixed-variant": "#003ea8",
        "surface-container-high": "#e6e8ea",
        "tertiary-fixed-dim": "#e7bf99",
        "error-container": "#ffdad6",
        "surface-container-low": "#f2f4f6",
        "outline-variant": "#c5c6cd",
        "inverse-on-surface": "#eff1f3",
        "surface-container-highest": "#e0e3e5",
        "on-surface": "#191c1e",
        "secondary-fixed": "#dbe1ff",
        "on-error-container": "#93000a",
        "on-primary-fixed": "#0d1c32",
        "secondary-fixed-dim": "#b4c5ff",
        "on-secondary-fixed": "#00174b",
        "primary-fixed": "#d6e3ff",
        "surface-container": "#eceef0",
        "on-error": "#ffffff",
        "outline": "#75777e",
        "on-background": "#191c1e",
        "primary-fixed-dim": "#b9c7e4"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        "body-md": ["Inter"],
        "label-md": ["Inter"],
        "h3": ["Inter"],
        "body-lg": ["Inter"],
        "h1": ["Inter"],
        "label-sm": ["Inter"],
        "h2": ["Inter"]
      },
      fontSize: {
        "body-md": ["16px", {"lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400"}],
        "label-md": ["14px", {"lineHeight": "1.4", "letterSpacing": "0.01em", "fontWeight": "500"}],
        "h3": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.02em", "fontWeight": "600"}],
        "body-lg": ["18px", {"lineHeight": "1.7", "letterSpacing": "0em", "fontWeight": "400"}],
        "h1": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
        "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "h2": ["36px", {"lineHeight": "1.2", "letterSpacing": "-0.03em", "fontWeight": "600"}]
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
      }
    },
  },
  plugins: [],
}
