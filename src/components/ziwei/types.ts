export interface StarInfo {
  name: string;
  type: 'major' | 'minor' | 'auxiliary' | 'evil';
  brightness?: '庙' | '旺' | '得' | '利' | '平' | '不' | '陷';
}

export interface PalaceData {
  name: string;
  branch: string;       // 地支
  stem?: string;        // 天干
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  isLife?: boolean;      // 是否为命宫
}

export const STAR_COLORS: Record<string, string> = {
  '紫微': '#7C3AED',
  '天机': '#059669',
  '太阳': '#D97706',
  '武曲': '#6B7280',
  '天同': '#DB2777',
  '廉贞': '#DC2626',
  '天府': '#CA8A04',
  '太阴': '#3B82F6',
  '贪狼': '#047857',
  '巨门': '#374151',
  '天相': '#A16207',
  '七杀': '#991B1B',
  '破军': '#6D28D9',
  '天梁': '#4338CA',
};

export const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女',
  '财帛', '疾厄', '迁移', '交友',
  '官禄', '田宅', '福德', '父母',
] as const;

export const SHICHEN_OPTIONS = [
  { value: '0', label: '子时 (23:00-00:59)' },
  { value: '1', label: '丑时 (01:00-02:59)' },
  { value: '2', label: '寅时 (03:00-04:59)' },
  { value: '3', label: '卯时 (05:00-06:59)' },
  { value: '4', label: '辰时 (07:00-08:59)' },
  { value: '5', label: '巳时 (09:00-10:59)' },
  { value: '6', label: '午时 (11:00-12:59)' },
  { value: '7', label: '未时 (13:00-14:59)' },
  { value: '8', label: '申时 (15:00-16:59)' },
  { value: '9', label: '酉时 (17:00-18:59)' },
  { value: '10', label: '戌时 (19:00-20:59)' },
  { value: '11', label: '亥时 (21:00-22:59)' },
];
