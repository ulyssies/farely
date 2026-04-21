import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1D9E75',
          'green-dark': '#0F6E56',
          amber: '#BA7517',
          red: '#993C1D',
        },
        // All theme colors resolve through CSS variables — dark mode is handled
        // by toggling .dark on <html>, which overrides the variable values.
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-3': 'var(--color-surface-3)',
        stroke: {
          DEFAULT: 'var(--color-stroke)',
          light: 'var(--color-stroke-light)',
          card: 'var(--color-stroke-card)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
        },
        placeholder: 'var(--color-placeholder)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
