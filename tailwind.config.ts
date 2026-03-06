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
        // 主题色
        cyber: {
          dark: '#0f0f1a',
          bg: '#1a1a2e',
          card: '#16213e',
          gold: '#ffd700',
          'gold-dark': '#b8860b',
        },
        // 五行色
        wuxing: {
          metal: '#ffd700',
          wood: '#4ade80',
          water: '#38bdf8',
          fire: '#f97316',
          earth: '#a78b5a',
        },
        // 文字色
        text: {
          primary: '#f5f5f5',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Noto Serif SC', 'serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.4)',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
