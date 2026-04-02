import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色系（新设计规范）
        brand: {
          black: "#0F0F0F",
          gray: "#6B7280",
          light: "#9CA3AF",
          border: "#E5E7EB",
          "border-light": "#F3F4F6",
          bg: "#FAFAFA",
        },
        // 五行色
        element: {
          wood: { bg: "#D1FAE5", text: "#059669" },
          fire: { bg: "#FEE2E2", text: "#DC2626" },
          earth: { bg: "#FEF3C7", text: "#D97706" },
          metal: { bg: "#F3E8FF", text: "#7C3AED" },
          water: { bg: "#DBEAFE", text: "#2563EB" },
        },
        // 保留旧色兼容（逐步迁移）
        primary: '#000000',
        secondary: '#666666',
        muted: '#999999',
        border: '#e0e0e0',
        background: '#ffffff',
        'background-alt': '#f8f8f8',
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', '"Songti SC"', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading)', 'Noto Serif SC', 'serif'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.2', fontWeight: '400' }],
        'display-mobile': ['36px', { lineHeight: '1.2', fontWeight: '400' }],
        h1: ['40px', { lineHeight: '1.25', fontWeight: '600' }],
        h2: ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        section: '120px',
        'section-mobile': '60px',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
        form: '0 4px 16px rgba(0,0,0,0.06)',
        pricing: '0 8px 32px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
