// 天干类型
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

// 地支类型
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

// 五行类型
export type WuXing = '金' | '木' | '水' | '火' | '土';

// 时辰类型（12时辰 + 不知道）
export type ShiChen = 
  | '子时' | '丑时' | '寅时' | '卯时' | '辰时' | '巳时'
  | '午时' | '未时' | '申时' | '酉时' | '戌时' | '亥时'
  | '不知道';

// 性别类型
export type Gender = 'male' | 'female';

// 柱（年柱/月柱/日柱/时柱）
export interface Pillar {
  gan: TianGan;
  zhi: DiZhi;
  ganWuxing: WuXing;
  zhiWuxing: WuXing;
}

// 八字命盘
export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

// 五行统计
export interface WuxingCount {
  metal: number;   // 金
  wood: number;    // 木
  water: number;   // 水
  fire: number;    // 火
  earth: number;   // 土
}

// 八字计算输入
export interface BaziInput {
  name?: string;
  gender: Gender;
  birthDate: string;  // YYYY-MM-DD
  birthHour?: ShiChen;
}

// 八字计算结果
export interface BaziResult {
  chart: BaziChart;
  wuxing: WuxingCount;
  dayMaster: string;  // 日主，如 "丙火"
}

// AI 解读结果
export interface BaziAnalysis {
  dayMasterAnalysis: string;
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
}

// 完整的八字响应
export interface BaziResponse {
  success: boolean;
  data?: {
    bazi: BaziResult;
    analysis: BaziAnalysis;
  };
  error?: string;
}

// 每日运势评分
export interface DailyRatings {
  career: number;     // 1-5
  wealth: number;     // 1-5
  love: number;       // 1-5
  health: number;     // 1-5
}

// 幸运信息
export interface LuckyInfo {
  color: string;
  numbers: number[];
  direction: string;
}

// 每日运势响应
export interface DailyResponse {
  success: boolean;
  data?: {
    date: string;
    lunarDate: string;
    dayGanzhi: string;
    overall: number;
    ratings: DailyRatings;
    suitable: string[];
    avoid: string[];
    lucky: LuckyInfo;
    advice: string;
  };
  error?: string;
}
