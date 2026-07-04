// ===== 五行配色唯一真源（传统五色）=====
// 全站所有五行相关的色块/文字/图表色都从这里取，杜绝“同一个金在同一张卡里 4 种色”。
// 与 tailwind.config.ts 的 element.* 保持一致：
//   bg/text   → 供 Tag / 标签 / 文本用（含 element-*-bg / element-*-text 工具类）
//   hex       → 供图表（甜甜圈/柱状/雷达）等需要具体色值处用
// 配色依据：金=金黄、木=青绿、水=蓝黑、火=朱红、土=黄褐（传统五色，命理受众直觉正确）。

export type WuxingKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface WuxingColor {
  key: WuxingKey;
  cn: string;   // 五行汉字
  bg: string;   // 浅底（标签背景）
  text: string; // 文字色（在浅底/白底上均达 AA）
  hex: string;  // 图表实色
}

export const WUXING: Record<WuxingKey, WuxingColor> = {
  metal: { key: 'metal', cn: '金', bg: '#FBF1D0', text: '#B0870F', hex: '#E0A82E' },
  wood:  { key: 'wood',  cn: '木', bg: '#DCFCE7', text: '#15803D', hex: '#22A366' },
  water: { key: 'water', cn: '水', bg: '#DBEAFE', text: '#1D4ED8', hex: '#3B82F6' },
  fire:  { key: 'fire',  cn: '火', bg: '#FEE2E2', text: '#DC2626', hex: '#E0524D' },
  earth: { key: 'earth', cn: '土', bg: '#F3E7D3', text: '#92400E', hex: '#9B6B3A' },
};

// 五行汉字 → key，便于按“金木水火土”直接取色。
export const WUXING_BY_CN: Record<string, WuxingKey> = {
  金: 'metal', 木: 'wood', 水: 'water', 火: 'fire', 土: 'earth',
};

/** 按五行汉字取配色；未知字回退到中性灰。 */
export function wuxingColor(cn: string): WuxingColor {
  const key = WUXING_BY_CN[cn];
  return key ? WUXING[key] : { key: 'earth', cn, bg: '#F3F4F6', text: '#6B7280', hex: '#9CA3AF' };
}

/** Tag 组件的 variant 名恰好等于 WuxingKey，便于 <Tag variant={key}>。 */
export const WUXING_ORDER: WuxingKey[] = ['metal', 'wood', 'water', 'fire', 'earth'];
