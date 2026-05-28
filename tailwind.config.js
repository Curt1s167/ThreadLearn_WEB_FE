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
        sans: ['GeistMono', 'JetBrains Mono', 'monospace'],
        display: ['GeistMono', 'monospace'],
        mono: ['GeistMono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#0a0a0f',
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
        },
        amber: {
          400: '#fbbf24',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        surface: {
          DEFAULT: '#111118',
          hover: '#16161f',
          border: '#1e1e2e',
          muted: '#0d0d15',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%23ffffff08' stroke-width='1'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,106,247,0)' }, '50%': { boxShadow: '0 0 20px 4px rgba(124,106,247,0.3)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: {
        glow: '0 0 30px rgba(124,106,247,0.15)',
        'glow-sm': '0 0 15px rgba(124,106,247,0.1)',
        panel: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
