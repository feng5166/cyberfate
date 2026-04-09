// 紫微斗数（三合派）类型定义

export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export type WuxingJu = 2 | 3 | 4 | 5 | 6;
export type WuxingJuName = '水二局' | '木三局' | '金四局' | '土五局' | '火六局';

export type Brightness = '庙' | '旺' | '得' | '利' | '平' | '不' | '陷';

export type StarType = 'major' | 'minor' | 'auxiliary' | 'evil' | 'sihua';

export type SihuaType = '化禄' | '化权' | '化科' | '化忌';

export interface StarInfo {
  name: string;
  type: StarType;
  brightness?: Brightness;
  sihua?: SihuaType;
}

export interface PalaceInfo {
  name: string;
  branch: DiZhi;
  stem: TianGan;
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  auxiliaryStars: StarInfo[];
  isLife?: boolean;
  isBody?: boolean;
}

export interface ZiweiInput {
  birthDate: string;    // YYYY-MM-DD 公历
  birthHour: number;    // 0-11 对应子时到亥时
  gender: 'male' | 'female';
  birthPlace?: { longitude: number; latitude: number };
}

export interface ZiweiDebugInfo {
  solarDate: string;
  lunarDate: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  trueSolarTime?: string;
  trueSolarOffset?: number;
  mingGongBranch: DiZhi;
  shenGongBranch: DiZhi;
  wuxingJu: WuxingJuName;
  wuxingJuNumber: number;
  ziweiStarBranch: DiZhi;
  algorithm: 'sanhe';
}

export interface ZiweiResult {
  palaces: PalaceInfo[];
  mingGong: DiZhi;
  shenGong: DiZhi;
  mingzhu: string;
  shenzhu: string;
  wuxingJu: WuxingJuName;
  debug: ZiweiDebugInfo;
}
