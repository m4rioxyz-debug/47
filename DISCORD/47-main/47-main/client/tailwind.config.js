/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cult: {
          50: '#f3f0ff',
          100: '#e9e2ff',
          200: '#d5c9ff',
          300: '#b5a0ff',
          400: '#9b6dff',
          500: '#8b47ff',
          600: '#7c22ff',
          700: '#6e14eb',
          800: '#5c10c5',
          900: '#4c0fa1',
          950: '#2d066e',
        },
        dark: {
          700: '#1e1e2e',
          800: '#181825',
          900: '#11111b',
          950: '#0a0a14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
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
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 71, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 71, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
