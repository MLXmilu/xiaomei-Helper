/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 支持暗黑模式
  theme: {
    extend: {
      colors: {
        meituan: {
          DEFAULT: '#FFD100', // 更加纯正的美团黄主色调
          light: '#FFE466',
          dark: '#CCA700',
          50: '#FFFDF0',
          100: '#FFFBE0',
          200: '#FFF5B3',
          300: '#FFF085',
          400: '#FFE657',
          500: '#FFD100',
          600: '#CCA700',
          700: '#997D00',
          800: '#665300',
          900: '#332A00',
        },
        darkbg: {
          DEFAULT: '#0B0F19', // 更有科技感与高级感的深蓝色底色 (Dark Navy)
          card: '#162033',   // 极具质感的卡片背景
          hover: '#1F2C45',  // Hover 状态背景
          border: '#24324F', // 细致的描边色
          muted: '#8F9CAE',  // 灰度文字色
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
