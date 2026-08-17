/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 亮蓝/天蓝主题（同色系深浅变化）
        navy: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9", // 主色（亮蓝/天蓝）
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
          950: "#082F49",
        },
        gold: {
          DEFAULT: "#0284C7", // 改为同色系深蓝（无对比强调色）
          light: "#38BDF8",
          dark: "#0369A1",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          dark: "#F1F5F9",
          light: "#FFFFFF",
        },
      },
      fontFamily: {
        brush: ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', 'cursive', 'serif'],
        kai: ['"LXGW WenKai"', '"Noto Serif SC"', 'serif'],
        serif: ['"LXGW WenKai"', '"Noto Serif SC"', 'serif'],
        display: ['"LXGW WenKai"', '"Noto Serif SC"', 'serif'],
        alibaba: ['"Alibaba PuHuiTi"', '"Alibaba PuHuiTi 3.0"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      boxShadow: {
        seal: "0 2px 8px rgba(14, 165, 233, 0.25)",
        card: "0 4px 20px rgba(7, 89, 133, 0.08)",
        glow: "0 0 24px rgba(14, 165, 233, 0.18)",
      },
      backgroundImage: {
        'navy-gradient': "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
        'navy-radial': "radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.05) 0%, transparent 50%)",
      },
      animation: {
        'scroll-up': 'scroll-up 25s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'scroll-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
