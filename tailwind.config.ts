import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0f0f1a',
          bg: '#1a1a2e',
          card: '#16213e',
          gold: '#ffd700',
          'gold-dark': '#b8860b',
        },
        wuxing: {
          metal: '#ffd700',
          wood: '#4ade80',
          water: '#38bdf8',
          fire: '#f97316',
          earth: '#a78b5a',
        },
      },
      fontFamily: {
        heading: ['Noto Serif SC', 'serif'],
        body: ['PingFang SC', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #ffd700 0%, #f4a460 100%)',
        'gradient-bg': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
