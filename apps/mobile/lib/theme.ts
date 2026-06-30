import type { TextStyle, ViewStyle } from 'react-native';

/**
 * 设计 token 单一真源。颜色全部经 WCAG 复核：
 * 正文级文字在米底 #FAF6EE / 白卡上 ≥ 4.5:1；大字/图形 ≥ 3:1。
 * - accent  亮橙：仅用于「填充块/图形/大字 hero」(按钮底用 accentDeep)
 * - accentDeep 深橙：承载小号橙色文字与主按钮底(白字 4.87:1)
 * - weak    收深至 #6E6A60(米底 5.0:1)，可安全承载说明性文字
 */
export const colors = {
  bg: '#FAF6EE',
  bgDeep: '#F2EDE0',
  card: '#FFFFFF',
  cardRaised: '#FFFCF6',
  ink: '#1B2540',
  secondary: '#5A5A5A', // 正文次级 6.9:1
  weak: '#6E6A60', // 说明/脚注 5.0:1（原 #9E9E9E 仅 2.5:1 已弃用）
  faint: '#B8B2A4', // 纯装饰/占位，不承载信息
  border: '#E8E0D0',
  accent: '#E87722', // 亮橙：填充/图形/hero 大字
  accentDeep: '#B85410', // 深橙：小号橙字 + 主按钮底（白字 4.87:1）
  accentSoft: '#F6E3D2',
  danger: '#C0392B',
};

/** 五行色：自米橙宣纸调性重制，降饱和，白卡/底纹上均 ≥ 3:1 */
export const wuxingColor: Record<string, string> = {
  木: '#6B8E5A', // 黛绿
  火: '#C2553B', // 朱
  土: '#A8761F', // 赭
  金: '#8F7340', // 秋香
  水: '#4A6B82', // 黛蓝
};

/** 间距尺度 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 } as const;

/** 圆角尺度 */
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** 字阶（每级带 size + lineHeight + weight，命理大数字走 displayXL/display） */
export const type = {
  displayXL: { fontSize: 44, lineHeight: 50, fontWeight: '800' },
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  h1: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  h2: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

/** 卡片柔和投影，给「米底 + 白卡」补层次（CARD 不再只靠描边分离） */
export const elevation = {
  card: {
    shadowColor: '#1B2540',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;
