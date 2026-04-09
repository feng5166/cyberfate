import { Solar } from 'lunar-javascript';
import type { BaziInput, BaziResult, BaziChart, Pillar, WuxingCount, TianGan, DiZhi, ShiChen, Gender, DayunResult } from './types';
import { TIANGAN_WUXING, DIZHI_WUXING, SHICHEN_DIZHI, WUXING_KEYS, TIANGAN_LIST, DIZHI_LIST } from './constants';

const YANG_GAN_SET = new Set<TianGan>(['甲', '丙', '戊', '庚', '壬']);

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
 * 获取指定日期的流年干支（年柱）
 */
export function getYearGanzhi(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  return `${eightChar.getYearGan()}${eightChar.getYearZhi()}`;
}

function getAgeByBirthDate(birthDate: Date, now: Date): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const dayDiff = now.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return Math.max(0, age);
}

function getFallbackDayun(): DayunResult {
  try {
    const today = new Date();
    const solar = Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    const gan = eightChar.getYearGan() as TianGan;
    const zhi = eightChar.getYearZhi() as DiZhi;

    return {
      gan,
      zhi,
      wuxing: TIANGAN_WUXING[gan],
    };
  } catch {
    return {
      gan: '甲',
      zhi: '子',
      wuxing: '木',
    };
  }
}

/**
 * 获取当前大运（简化版）
 * - 以月柱干支为起点
 * - 阳男阴女顺行，阴男阳女逆行
 * - 起运年龄采用 3-5 岁简化估算，每步 10 年
 */
export function getCurrentDayun(birthDate: string, gender: Gender): DayunResult {
  try {
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return getFallbackDayun();
    }

    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();

    const yearGan = eightChar.getYearGan() as TianGan;
    const monthGan = eightChar.getMonthGan() as TianGan;
    const monthZhi = eightChar.getMonthZhi() as DiZhi;

    const isYearYang = YANG_GAN_SET.has(yearGan);
    const forward = (isYearYang && gender === 'male') || (!isYearYang && gender === 'female');

    const birth = new Date(year, month - 1, day);
    const now = new Date();
    const age = getAgeByBirthDate(birth, now);

    // 起运年龄简化到 3-5 岁，避免固定值导致偏差过大
    const startAge = 3 + ((month + day) % 3);
    const offset = age < startAge ? 0 : Math.floor((age - startAge) / 10) + 1;

    const monthGanIndex = TIANGAN_LIST.indexOf(monthGan);
    const monthZhiIndex = DIZHI_LIST.indexOf(monthZhi);
    if (monthGanIndex < 0 || monthZhiIndex < 0) {
      return getFallbackDayun();
    }

    const step = forward ? offset : -offset;
    const gan = TIANGAN_LIST[(monthGanIndex + step + 10 * 100) % 10];
    const zhi = DIZHI_LIST[(monthZhiIndex + step + 12 * 100) % 12];

    return {
      gan,
      zhi,
      wuxing: TIANGAN_WUXING[gan],
    };
  } catch {
    return getFallbackDayun();
  }
}

/**
 * 获取农历日期字符串（含干支年），如 "癸亥年七月十一"
 */
export function getLunarDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearGanZhi = `${eightChar.getYearGan()}${eightChar.getYearZhi()}`;
  return `${yearGanZhi}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}
