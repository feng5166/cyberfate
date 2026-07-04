import type { Config } from "tailwindcss";

const config: Config = {
  // 注意：App Router 没有 #__next 节点，曾经的 important: '#__next' 会把所有工具类
  // 限定到不存在的选择器，一旦配置被加载就会让整站样式失效，故移除。
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== 品牌色系（唯一真源）=====
        brand: {
          // 墨色 ink：正文/标题。与 globals.css --brand-black 对齐为 #1C1A16（对比度 ~17.5:1，AAA）。
          // 历史上 tailwind 曾为 #0F0F0F 与 globals 打架，现统一。
          black: "#1C1A16",
          ink: "#1C1A16",
          gray: "#6B7280",       // 次要文字（AA）
          light: "#9CA3AF",      // 仅限 ≥18px 大字/图标
          border: "#E5E7EB",     // 交互边界
          "border-light": "#F3F4F6", // 装饰分隔
          bg: "#FAF9F6",         // 暖宣纸画布（与 body 背景统一，原 #FAFAFA 偏冷已弃用）

          // ===== 唯一强调色：暖古铜橙 =====
          // 全站主 CTA / 选中态 / 激活指示唯一用色。墨色只做文字，不做强调。
          accent: "#C2762B",
          "accent-hover": "#A86425",
          "accent-soft": "#FBEEDD",  // 图标底片 / 极浅强调块
          "accent-tint": "#FAF3EC",  // 选中行/段控激活底
        },
        // ===== 五行色（传统五色，数据可视化唯一语言）=====
        // 金=金黄 / 木=青绿 / 水=蓝黑 / 火=朱红 / 土=黄褐。与 src/data/wuxing.ts 保持一致。
        element: {
          wood: { bg: "#DCFCE7", text: "#15803D" },
          fire: { bg: "#FEE2E2", text: "#DC2626" },
          earth: { bg: "#F3E7D3", text: "#92400E" },
          metal: { bg: "#FBF1D0", text: "#B0870F" },
          water: { bg: "#DBEAFE", text: "#1D4ED8" },
        },
        // 保留旧色兼容（逐步迁移；勿新增使用）
        primary: '#1C1A16',
        secondary: '#666666',
        muted: '#999999',
        border: '#e0e0e0',
        background: '#FAF9F6',
        'background-alt': '#f8f8f8',
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', '"Songti SC"', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-display-secondary)', '"Cormorant Garamond"', '"Noto Serif SC"', 'serif'],
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
        'card-hover': '0 4px 20px rgba(28,26,22,0.08)',
        form: '0 4px 16px rgba(0,0,0,0.06)',
        pricing: '0 8px 32px rgba(0,0,0,0.1)',
      },
      // ===== z-index 层级（唯一真源，供 chrome/浮层统一引用）=====
      zIndex: {
        rail: '10',    // 侧栏轨道
        header: '20',  // 顶栏
        overlay: '30', // 遮罩
        drawer: '40',  // 抽屉/底栏
        toast: '50',   // 提示/浮层最上
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
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
