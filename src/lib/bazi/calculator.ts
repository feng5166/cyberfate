import { Solar } from 'lunar-javascript';
import type { BaziInput, BaziResult, BaziChart, Pillar, WuxingCount, TianGan, DiZhi, ShiChen } from './types';
import { TIANGAN_WUXING, DIZHI_WUXING, SHICHEN_DIZHI, WUXING_KEYS, TIANGAN_LIST, DIZHI_LIST } from './constants';

/**
 * 构建一个柱（年/月/日/时柱）
 */
function buildPillar(gan: string, zhi: string): Pillar {
  const tianGan = gan as TianGan;
  const diZhi = zhi as DiZhi;
  
  return {
    gan: tianGan,
    zhi: diZhi,
    ganWuxing: TIANGAN_WUXING[tianGan],
    zhiWuxing: DIZHI_WUXING[diZhi],
  };
}

/**
 * 根据日干和时辰地支计算时干
 * 使用五鼠遁元口诀
 */
function getHourGan(dayGan: TianGan, hourZhi: DiZhi): TianGan {
  // 五鼠遁元：甲己起甲子，乙庚起丙子，丙辛起戊子，丁壬起庚子，戊癸起壬子
  const startGanMap: Record<string, number> = {
    '甲': 0, '己': 0,  // 甲子起
    '乙': 2, '庚': 2,  // 丙子起
    '丙': 4, '辛': 4,  // 戊子起
    '丁': 6, '壬': 6,  // 庚子起
    '戊': 8, '癸': 8,  // 壬子起
  };
  
  const startIndex = startGanMap[dayGan];
  const hourIndex = DIZHI_LIST.indexOf(hourZhi);
  const ganIndex = (startIndex + hourIndex) % 10;
  
  return TIANGAN_LIST[ganIndex];
}

/**
 * 计算时柱
 */
function getHourPillar(dayGan: TianGan, shichen: ShiChen): Pillar | null {
  if (shichen === '不知道') {
    return null;
  }
  
  const hourZhi = SHICHEN_DIZHI[shichen];
  const hourGan = getHourGan(dayGan, hourZhi);
  
  return buildPillar(hourGan, hourZhi);
}

/**
 * 统计五行数量
 */
function countWuxing(chart: BaziChart): WuxingCount {
  const count: WuxingCount = {
    metal: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
  };
  
  // 统计年月日时四柱的天干地支五行
  const pillars = [chart.year, chart.month, chart.day];
  if (chart.hour) {
    pillars.push(chart.hour);
  }
  
  for (const pillar of pillars) {
    const ganKey = WUXING_KEYS[pillar.ganWuxing];
    const zhiKey = WUXING_KEYS[pillar.zhiWuxing];
    count[ganKey]++;
    count[zhiKey]++;
  }
  
  return count;
}

/**
 * 计算八字
 * @param input 输入参数（出生日期、时辰等）
 * @returns 八字计算结果
 */
export function calculateBazi(input: BaziInput): BaziResult {
  const { birthDate, birthHour } = input;
  const [year, month, day] = birthDate.split('-').map(Number);
  
  // 使用 lunar-javascript 计算
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  // 获取年月日柱
  const yearPillar = buildPillar(eightChar.getYearGan(), eightChar.getYearZhi());
  const monthPillar = buildPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
  const dayPillar = buildPillar(eightChar.getDayGan(), eightChar.getDayZhi());
  
  // 获取时柱（如果有时辰）
  const hourPillar = birthHour ? getHourPillar(dayPillar.gan, birthHour) : null;
  
  const chart: BaziChart = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
  
  // 统计五行
  const wuxing = countWuxing(chart);
  
  // 日主（日干 + 五行）
  const dayMaster = `${dayPillar.gan}${dayPillar.ganWuxing}`;
  
  return {
    chart,
    wuxing,
    dayMaster,
  };
}

/**
 * 获取指定日期的干支
 */
export function getDayGanzhi(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  return `${eightChar.getDayGan()}${eightChar.getDayZhi()}`;
}

/**
 * 获取农历日期字符串
 */
export function getLunarDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
  return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}
