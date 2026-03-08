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
        // FateMaster 简洁风格
        primary: '#000000',
        secondary: '#666666',
        muted: '#999999',
        border: '#e0e0e0',
        background: '#ffffff',
        'background-alt': '#f8f8f8',
        // 五行色（保留用于图表）
        wuxing: {
          metal: '#ffd700',
          wood: '#4ade80',
          water: '#38bdf8',
          fire: '#f97316',
          earth: '#a78b5a',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Noto Serif SC', 'serif'],
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-mobile': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['40px', { lineHeight: '1.3', fontWeight: '600' }],
        'h1-mobile': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['32px', { lineHeight: '1.4', fontWeight: '600' }],
        'h2-mobile': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      spacing: {
        'section': '120px',
        'section-mobile': '60px',
      },
    },
  },
  plugins: [],
};

export default config;
