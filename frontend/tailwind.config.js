/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598dff',
          500: '#3366ff',
          600: '#1f47f5',
          700: '#1735e1',
          800: '#192db6',
          900: '#1a2c8f',
        },
        ink: {
          900: '#0d1424',
          700: '#2a3142',
          500: '#5b6376',
          400: '#8b91a3',
        },
        positive: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
        canvas: '#f5f7fb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,20,36,0.04), 0 8px 24px rgba(13,20,36,0.06)',
      },
    },
  },
  plugins: [],
}
