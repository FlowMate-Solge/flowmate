/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Flozy 브랜드 컬러 — 따뜻한 틸 (물 흐름 + 신뢰)
        brand: {
          50:  '#edfaf8',
          100: '#d0f3ee',
          200: '#a4e6dd',
          300: '#6dd4c8',
          400: '#3bbcaf',
          500: '#1ea599',
          600: '#0d8a7e',
          700: '#0c6f65',
          800: '#0d5852',
          900: '#0f4843',
        },
        // 따뜻한 앰버 — cozy 포인트
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // 따뜻한 중립 (stone 계열)
        ink: {
          900: '#1c1917',
          700: '#44403c',
          500: '#78716c',
          400: '#a8a29e',
        },
        positive: '#16a34a',
        warning:  '#f59e0b',
        danger:   '#dc2626',
        // 크림 배경 — 차가운 흰색 대신
        canvas: '#faf9f7',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.04), 0 8px 24px rgba(28,25,23,0.07)',
      },
      borderRadius: {
        // 더 둥근 UI — cozy 느낌
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
