/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        caiman: {
          mint: '#59D6B5',
          'mint-dark': '#4BC2A3',
          navy: {
            900: '#06131B',
            800: '#081923',
            700: '#0B202B',
            600: '#102833',
            500: '#143540',
          },
          slate: {
            50: '#F8FAFC',
            200: '#CBD5E1',
            400: '#94A3B8',
          },
        },
        accent: '#19c37d',
        admin: {
          bg: '#0b1220',
          sidebar: 'linear-gradient(180deg,#0a101c,#101a2b)',
          panel: '#111a2b',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}