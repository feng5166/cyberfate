import type { TianGan, DiZhi, WuXing } from './types';

type Polarity = '阳' | '阴';

const TIANGAN_INFO: Record<TianGan, { wuxing: WuXing; polarity: Polarity }> = {
  '甲': { wuxing: '木', polarity: '阳' },
  '乙': { wuxing: '木', polarity: '阴' },
  '丙': { wuxing: '火', polarity: '阳' },
  '丁': { wuxing: '火', polarity: '阴' },
  '戊': { wuxing: '土', polarity: '阳' },
  '己': { wuxing: '土', polarity: '阴' },
  '庚': { wuxing: '金', polarity: '阳' },
  '辛': { wuxing: '金', polarity: '阴' },
  '壬': { wuxing: '水', polarity: '阳' },
  '癸': { wuxing: '水', polarity: '阴' },
};

const GENERATING_MAP: Record<WuXing, WuXing> = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木',
};

const CONTROLLING_MAP: Record<WuXing, WuXing> = {
  '木': '土',
  '火': '金',
  '土': '水',
  '金': '木',
  '水': '火',
};

export type TenGod =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '正财'
  | '偏财'
  | '正官'
  | '七杀'
  | '正印'
  | '偏印'
  | '日主'
  | '未知';

export function getTenGod(dayGan: TianGan, targetGan: TianGan): TenGod {
  if (!dayGan || !targetGan) {
    return '未知';
  }
  const day = TIANGAN_INFO[dayGan];
  const target = TIANGAN_INFO[targetGan];
  if (!day || !target) {
    return '未知';
  }

  if (dayGan === targetGan) {
    return '比肩';
  }

  if (day.wuxing === target.wuxing) {
    return day.polarity === target.polarity ? '比肩' : '劫财';
  }

  if (GENERATING_MAP[day.wuxing] === target.wuxing) {
    return day.polarity === target.polarity ? '食神' : '伤官';
  }

  if (CONTROLLING_MAP[day.wuxing] === target.wuxing) {
    return day.polarity === target.polarity ? '偏财' : '正财';
  }

  if (GENERATING_MAP[target.wuxing] === day.wuxing) {
    return day.polarity === target.polarity ? '偏印' : '正印';
  }

  if (CONTROLLING_MAP[target.wuxing] === day.wuxing) {
    return day.polarity === target.polarity ? '七杀' : '正官';
  }

  return '未知';
}

const NAYIN_GROUPS = [
  { combos: ['甲子', '乙丑'], name: '海中金' },
  { combos: ['丙寅', '丁卯'], name: '炉中火' },
  { combos: ['戊辰', '己巳'], name: '大林木' },
  { combos: ['庚午', '辛未'], name: '路旁土' },
  { combos: ['壬申', '癸酉'], name: '剑锋金' },
  { combos: ['甲戌', '乙亥'], name: '山头火' },
  { combos: ['丙子', '丁丑'], name: '洞下水' },
  { combos: ['戊寅', '己卯'], name: '城头土' },
  { combos: ['庚辰', '辛巳'], name: '白蜡金' },
  { combos: ['壬午', '癸未'], name: '杨柳木' },
  { combos: ['甲申', '乙酉'], name: '泉中水' },
  { combos: ['丙戌', '丁亥'], name: '屋上土' },
  { combos: ['戊子', '己丑'], name: '霹雳火' },
  { combos: ['庚寅', '辛卯'], name: '松柏木' },
  { combos: ['壬辰', '癸巳'], name: '常流水' },
  { combos: ['甲午', '乙未'], name: '砂中金' },
  { combos: ['丙申', '丁酉'], name: '山下火' },
  { combos: ['戊戌', '己亥'], name: '平地木' },
  { combos: ['庚子', '辛丑'], name: '壁上土' },
  { combos: ['壬寅', '癸卯'], name: '金箔金' },
  { combos: ['甲辰', '乙巳'], name: '佛灯火' },
  { combos: ['丙午', '丁未'], name: '天河水' },
  { combos: ['戊申', '己酉'], name: '大驿土' },
  { combos: ['庚戌', '辛亥'], name: '钗钏金' },
  { combos: ['壬子', '癸丑'], name: '桑柘木' },
  { combos: ['甲寅', '乙卯'], name: '大溪水' },
  { combos: ['丙辰', '丁巳'], name: '沙中土' },
  { combos: ['戊午', '己未'], name: '天上火' },
  { combos: ['庚申', '辛酉'], name: '石榴木' },
  { combos: ['壬戌', '癸亥'], name: '大海水' },
];

const NAYIN_MAP = NAYIN_GROUPS.reduce<Record<string, string>>((acc, group) => {
  group.combos.forEach(combo => {
    acc[combo] = group.name;
  });
  return acc;
}, {});

export function getNaYin(gan: TianGan, zhi: DiZhi): string {
  const key = `${gan}${zhi}`;
  return NAYIN_MAP[key] || '纳音待查';
}
