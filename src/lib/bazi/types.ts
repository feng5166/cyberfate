import type { FlowAnalysis, LiuyueItem } from './liunian';

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

// 四柱键值
export type PillarKey = 'year' | 'month' | 'day' | 'hour';

// 结构化四柱（用于前端展示等必须包含时柱的场景）
export type PillarRecord = Record<PillarKey, Pillar>;

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

export interface BaziTrait {
  label: string;
  desc: string;
}

export interface FiveDimensions {
  career: number;
  wealth: number;
  relationship: number;
  health: number;
  studies: number;
}

// 八字计算输入
export interface BaziInput {
  name?: string;
  gender: Gender;
  birthDate: string;  // YYYY-MM-DD (阳历; 若 isLunar=true 则按农历年月日解释)
  birthHour?: ShiChen;       // 旧粗时辰入参, 保留向后兼容
  // —— 新增高精度可选字段 ——
  birthHourNum?: number;     // 0-23 精确小时; 提供则优先于 birthHour
  birthMinute?: number;      // 0-59 精确分钟; 配合 birthHourNum
  isLunar?: boolean;         // true=birthDate 按农历解释, 需转阳历
  lateZiShi?: boolean;       // 晚子时(23:00-23:59 归次日日柱); true=晚子时, false/undefined=早子时(00:00-00:59 归当日)
  knowTime?: boolean;        // 是否知道出生时间; false 时按无时辰(不知道)处理
}

// 八字计算结果
export interface BaziResult {
  chart: BaziChart;
  wuxing: WuxingCount;
  dayMaster: string;  // 日主，如 "丙火"
  zodiac: string;     // 生肖，如 "猪"
}

// 大运结果
export interface DayunResult {
  gan: TianGan;
  zhi: DiZhi;
  wuxing: WuXing;
  /** 起运虚岁（精确节气数日法，lunar-javascript getYun） */
  startAge?: number;
  /** 该大运起始公历年 */
  startYear?: number;
  /** 该大运结束公历年 */
  endYear?: number;
  /** 当前是否处于起运前的童限期（尚未起运，以月柱代之） */
  beforeFirstDayun?: boolean;
}

// 大运时间轴项
export interface DayunTimelineItem {
  index: number;
  gan: TianGan;
  zhi: DiZhi;
  wuxing: WuXing;
  /** 起运虚岁（含），精确节气数日法 */
  ageStart: number;
  /** 该步大运结束虚岁（含） */
  ageEnd: number;
  /** 该步大运起始公历年 */
  yearStart: number;
  /** 该步大运结束公历年 */
  yearEnd: number;
  /** 该步大运的切换月（公历），各步相同，即起运公历月 */
  startMonth: number;
  isCurrent: boolean;
}

// AI 解读结果
export interface BaziAnalysis {
  dayMasterAnalysis: string;
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
  dayunAnalysis?: string;
  traits?: BaziTrait[];
}

export interface MingGeInfo {
  geju: string;
  rizhuStrength: '偏强' | '中和' | '偏弱';
  yongShen: WuXing;
  jiShen: WuXing;
  /** 完整喜用神集（含从格顺势）；缺省时回退单一 yongShen */
  yongShenAll?: WuXing[];
  /** 完整忌神集 */
  jiShenAll?: WuXing[];
}

/** 神煞展示项（首屏命盘「神煞」模块用，含吉凶分类） */
export interface ShenshaDisplay {
  name: string;
  pillars: PillarKey[];
  branch: DiZhi;
  nature: '吉' | '凶' | '中';
}

export interface BaziApiResult {
  pillars: PillarRecord;
  /** 是否存在真实时柱；false 表示用户未提供时辰，pillars.hour 为占位值不应展示 */
  hasHour?: boolean;
  wuxing: WuxingCount;
  aiAnalysis: string;
  fiveDimensions?: FiveDimensions;
  traits?: BaziTrait[];
  mingGe?: MingGeInfo;
  birthPlace?: string;
  _source?: string;
  lunarDate?: string;
  zodiac?: string;
  trueSolarOffsetMinutes?: number | null;
  dayunStartDescription?: string;
  dayunStartAt?: string;
  // —— 首屏结构化命盘模块（开始解读时一次性算出）——
  /** 神煞罗列（文昌/驿马/桃花…，含吉凶） */
  shensha?: ShenshaDisplay[];
  /** 当前公历年流年分析（干支 + 与命盘关系） */
  liunian?: FlowAnalysis;
  /** 当前公历年 12 个流月 */
  liuyue?: LiuyueItem[];
  /** 终身大运表（约 8 步） */
  dayunTimeline?: DayunTimelineItem[];
  // —— V2 新增（PRD-BAZI-V2）——
  /** 刑冲会合害（命局四柱地支两两关系） */
  interactions?: import('./interactions').BranchInteraction[];
  /** 关键应期（未来 10 年扫描；非 VIP 服务端只返回最近 1 条） */
  yingqi?: {
    vip: boolean;
    total: number;
    items: import('./yingqi').YingqiItem[];
  };
}

export interface BaziHistoryRecord {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  birthHour: string;
  birthPlace?: string;
  dayMaster: string;
  dayMasterElement?: WuXing;
  aiSummary: string;
  aiAnalysis: string;
  pillars: PillarRecord;
  wuxing: WuxingCount;
  fiveDimensions?: FiveDimensions;
  traits?: BaziTrait[];
  lunarDate?: string;
  zodiac?: string;
  trueSolarOffsetMinutes?: number | null;
  dayunStartDescription?: string;
  dayunStartAt?: string;
  source?: 'bazi';
  createdAt: string;
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
  studies: number;    // 1-5
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
