/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['GeistMono', 'JetBrains Mono', 'system-ui', 'sans-serif'],
        display: ['GeistMono', 'system-ui', 'sans-serif'],
        mono: ['GeistMono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // PR5: DEFAULT aligns with cream cutover (legacy dark still available as canvas.dark)
        canvas: {
          DEFAULT: '#f7f4ee',
          cream: '#f7f4ee',
          dark: '#0a0a0f',
          50: '#f0f0f5',
          100: '#e0e0eb',
          200: '#c0c0d6',
          300: '#9090b0',
          400: '#60608a',
          500: '#404064',
          600: '#2a2a48',
          700: '#1a1a2e',
          800: '#12121f',
          900: '#0a0a14',
          950: '#050508',
        },
        // Soft brand accents — do NOT use top-level `lime` (Tailwind default)
        brand: {
          lime: '#d9f99d',
          pink: '#f5d0fe',
          blue: '#bfdbfe',
          ink: '#111827',
        },
        ink: {
          DEFAULT: '#111111',
          muted: 'rgba(17,17,17,0.6)',
          faint: 'rgba(17,17,17,0.45)',
          soft: 'rgba(17,17,17,0.35)',
        },
        pill: {
          lime: '#d9f99d',
          pink: '#f5d0fe',
          blue: '#bfdbfe',
        },
        hero: {
          DEFAULT: '#111827',
        },
        // Legacy violet accent — keep for gradual migration (KD3)
        accent: {
          DEFAULT: '#7c6af7',
          50: '#f0eeff',
          100: '#e4e0ff',
          200: '#ccc6ff',
          300: '#a89dff',
          400: '#9080ff',
          500: '#7c6af7',
          600: '#6b55e8',
          700: '#5a42d1',
          800: '#4a35aa',
          900: '#3d2d88',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          700: '#047857',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          700: '#be123c',
        },
        // Light-first surfaces (PR1)
        surface: {
          DEFAULT: '#ffffff',
          hover: '#fafaf8',
          border: 'rgba(0,0,0,0.1)',
          muted: '#f7f4ee',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%2300000008' stroke-width='1'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'level-pop': 'levelPop 0.26s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }, '50%': { boxShadow: '0 0 16px 2px rgba(0,0,0,0.08)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        levelPop: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
          '55%': { transform: 'scale(1.012)', boxShadow: '0 0 12px 1px rgba(0,0,0,0.08)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
        },
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: {
        glow: '0 8px 24px rgba(0,0,0,0.06)',
        'glow-sm': '0 4px 12px rgba(0,0,0,0.05)',
        panel: '0 8px 28px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
