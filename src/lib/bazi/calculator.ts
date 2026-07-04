import { Solar, Lunar } from 'lunar-javascript';
import type { BaziInput, BaziResult, BaziChart, Pillar, WuxingCount, WuXing, TianGan, DiZhi, ShiChen, Gender, DayunResult, DayunTimelineItem } from './types';
import { TIANGAN_WUXING, DIZHI_WUXING, SHICHEN_DIZHI, WUXING_KEYS, TIANGAN_LIST, DIZHI_LIST } from './constants';
import { DIZHI_HIDDEN_GAN } from './geju';

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
 * 统计五行力量分布（含藏干）
 * 天干各 +1；地支按藏干（本气/中气/余气）逐个 +1——比只数地支本气更贴近真实旺衰，
 * 也让下游「最旺/最弱五行」与格局旺衰口径一致。每柱至少贡献 2（天干 + 地支本气）。
 */
function countWuxing(chart: BaziChart): WuxingCount {
  const count: WuxingCount = {
    metal: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
  };

  const pillars = [chart.year, chart.month, chart.day];
  if (chart.hour) {
    pillars.push(chart.hour);
  }

  for (const pillar of pillars) {
    // 天干
    count[WUXING_KEYS[pillar.ganWuxing]]++;
    // 地支藏干（含中气/余气）
    for (const hidden of DIZHI_HIDDEN_GAN[pillar.zhi]) {
      count[WUXING_KEYS[TIANGAN_WUXING[hidden]]]++;
    }
  }

  return count;
}

/**
 * 计算八字
 * @param input 输入参数（出生日期、时辰等）
 * @returns 八字计算结果
 *
 * 兼容性保证: 仅传 birthDate + birthHour 的旧调用结果不变。
 * 新增字段 (birthHourNum/birthMinute/isLunar/lateZiShi/knowTime) 全部可选。
 */
export function calculateBazi(input: BaziInput): BaziResult {
  const {
    birthDate,
    birthHour,
    birthHourNum,
    birthMinute,
    isLunar,
    lateZiShi,
    knowTime,
  } = input;
  const [year, month, day] = birthDate.split('-').map(Number);

  // 1. 解析输入日期: 农历则先转阳历, 阳历直接用
  const baseSolar: any = isLunar === true
    ? (Lunar as any).fromYmd(year, month, day).getSolar()
    : (Solar as any).fromYmd(year, month, day);

  // 阳历 y/m/d (用于后续 fromYmdHms)
  const solarY: number = baseSolar.getYear();
  const solarM: number = baseSolar.getMonth();
  const solarD: number = baseSolar.getDay();

  // 2. 时柱精度分支判定
  const hasPreciseTime =
    knowTime !== false && typeof birthHourNum === 'number';

  let yearPillar: Pillar;
  let monthPillar: Pillar;
  let dayPillar: Pillar;
  let hourPillar: Pillar | null = null;
  let lunarRef: any; // 保留对 lunar 对象的引用, 用于生肖立春分界

  if (hasPreciseTime) {
    const minute = typeof birthMinute === 'number' ? birthMinute : 0;

    // 通用精确时分: 让库的 getEightChar 全自动排盘
    // lunar-javascript 默认 sect=2 (早子时流派): 23:00-23:59 仍归当日日柱
    // 切到 sect=1 即「晚子时归次日」: 23:00 后日柱进位
    // setSect 仅在 23:xx 边界生效, 其他时刻无副作用
    const preciseSolar: any = (Solar as any).fromYmdHms(solarY, solarM, solarD, birthHourNum, minute, 0);
    const preciseLunar: any = preciseSolar.getLunar();
    const preciseEC: any = preciseLunar.getEightChar();
    if (lateZiShi === true) {
      preciseEC.setSect(1);
    }

    yearPillar = buildPillar(preciseEC.getYearGan(), preciseEC.getYearZhi());
    monthPillar = buildPillar(preciseEC.getMonthGan(), preciseEC.getMonthZhi());
    dayPillar = buildPillar(preciseEC.getDayGan(), preciseEC.getDayZhi());
    hourPillar = buildPillar(preciseEC.getTimeGan(), preciseEC.getTimeZhi());

    lunarRef = preciseLunar;
  } else {
    // 无精确时分: 走旧逻辑 (向后兼容老调用)
    const lunar: any = baseSolar.getLunar();
    const eightChar: any = lunar.getEightChar();

    yearPillar = buildPillar(eightChar.getYearGan(), eightChar.getYearZhi());
    monthPillar = buildPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
    dayPillar = buildPillar(eightChar.getDayGan(), eightChar.getDayZhi());

    // knowTime===false 强制无时柱; 否则按旧 birthHour (粗时辰) 处理
    if (birthHour) {
      // 选了时辰（knowTime=false 也属于知道时辰）
      hourPillar = getHourPillar(dayPillar.gan, birthHour);
    } else {
      // 真正不知道时辰
      hourPillar = null;
    }

    lunarRef = lunar;
  }

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

  // 生肖按立春分界（八字命理标准）
  const zodiac: string = (lunarRef as any).getYearShengXiaoByLiChun?.() || '未知';

  return {
    chart,
    wuxing,
    dayMaster,
    zodiac,
  };
}

/** 地支 → 生肖（按八字年柱地支直接映射） */
const ZHI_SHENGXIAO: Record<string, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
  午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
};

/**
 * 直接由八字（四柱干支）排盘，不需要出生日期。
 * 用于「八字直输」模式：六柱衍生模块（四柱/五行/格局/十神/神煞/流年流月）均可由此计算；
 * 终身大运/起运因需出生那一刻到节气的距离推算，本模式不提供（由调用方决定隐藏）。
 * 时柱可选：hourGan/hourZhi 任一缺失即视为「无时柱」。
 */
export function calculateBaziFromPillars(input: {
  yearGan: string; yearZhi: string;
  monthGan: string; monthZhi: string;
  dayGan: string; dayZhi: string;
  hourGan?: string; hourZhi?: string;
}): BaziResult {
  const year = buildPillar(input.yearGan, input.yearZhi);
  const month = buildPillar(input.monthGan, input.monthZhi);
  const day = buildPillar(input.dayGan, input.dayZhi);
  const hour = input.hourGan && input.hourZhi ? buildPillar(input.hourGan, input.hourZhi) : null;

  const chart: BaziChart = { year, month, day, hour };
  const wuxing = countWuxing(chart);
  const dayMaster = `${day.gan}${day.ganWuxing}`;
  const zodiac = ZHI_SHENGXIAO[input.yearZhi] || '未知';

  return { chart, wuxing, dayMaster, zodiac };
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

/**
 * 获取指定日期的流月干支（月柱，按节气换月，非公历月）。
 */
export function getMonthGanzhi(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  return `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`;
}

function getBeijingNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

/** 当前公历年份（按北京时间） */
function getCurrentYear(): number {
  const today = getBeijingNow();
  return today.getUTCFullYear();
}

function getFallbackDayun(): DayunResult {
  try {
    const today = getBeijingNow();
    const solar = Solar.fromYmd(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());
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
 * 用出生信息构建 lunar-javascript 的 EightChar 对象。
 * 提供精确时分时按时分构建（起运计算更准），否则退回当日 0 点。
 */
function buildEightChar(birthDate: string, birthHourNum?: number, birthMinute?: number): any | null {
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const solar = typeof birthHourNum === 'number'
    ? (Solar as any).fromYmdHms(year, month, day, birthHourNum, typeof birthMinute === 'number' ? birthMinute : 0, 0)
    : Solar.fromYmd(year, month, day);
  return solar.getLunar().getEightChar();
}

/** male=1 / female=0（lunar-javascript getYun 约定） */
function genderToNum(gender: Gender): number {
  return gender === 'male' ? 1 : 0;
}

/**
 * 从 lunar-javascript 的 getYun().getDaYun() 取出「真正的」大运列表。
 * 索引 0 为起运前童限期（干支为空），故跳过，返回干支齐全的大运。
 */
function getRealDayunList(eightChar: any, gender: Gender): any[] {
  const yun = eightChar.getYun(genderToNum(gender));
  const raw = yun.getDaYun() as any[];
  return raw.filter((d) => {
    const gz = d.getGanZhi?.();
    return typeof gz === 'string' && gz.length >= 2;
  });
}

/**
 * 获取当前大运（精确节气数日法，基于 lunar-javascript getYun）。
 * - 起运虚岁、各步公历年份均来自库的节气数日计算，非估算。
 * - 若当前年份尚未起运（童限期），以月柱代之并标记 beforeFirstDayun。
 * @param birthHourNum 可选精确小时(0-23)；提供后起运计算更准。
 */
export function getCurrentDayun(
  birthDate: string,
  gender: Gender,
  birthHourNum?: number,
  birthMinute?: number,
): DayunResult {
  try {
    const eightChar = buildEightChar(birthDate, birthHourNum, birthMinute);
    if (!eightChar) return getFallbackDayun();

    const dayunList = getRealDayunList(eightChar, gender);
    if (!dayunList.length) return getFallbackDayun();

    const currentYear = getCurrentYear();

    // 起运前（童限期）：以月柱代表当前阶段
    const firstStartYear = dayunList[0].getStartYear() as number;
    if (currentYear < firstStartYear) {
      const gan = eightChar.getMonthGan() as TianGan;
      const zhi = eightChar.getMonthZhi() as DiZhi;
      return {
        gan,
        zhi,
        wuxing: TIANGAN_WUXING[gan],
        startYear: firstStartYear,
        beforeFirstDayun: true,
      };
    }

    // 命中当前年份所在的大运，否则取最后一步
    const active =
      dayunList.find((d) => currentYear >= d.getStartYear() && currentYear <= d.getEndYear()) ||
      dayunList[dayunList.length - 1];

    const gz = active.getGanZhi() as string;
    const gan = gz[0] as TianGan;
    const zhi = gz[1] as DiZhi;

    return {
      gan,
      zhi,
      wuxing: TIANGAN_WUXING[gan],
      startAge: active.getStartAge(),
      startYear: active.getStartYear(),
      endYear: active.getEndYear(),
    };
  } catch {
    return getFallbackDayun();
  }
}

/**
 * 计算精确「起运」描述（精确到月，节气数日法，基于 lunar-javascript getYun）。
 * - 起运顺逆依「阳男阴女顺行、阴男阳女逆行」由库按性别内部处理，故必须传性别。
 * - getStartYear/Month 为出生到起运节气的精确折算（3 天 = 1 岁、1 天 = 4 个月）。
 * @param birthHourNum 可选精确小时(0-23)；提供后起运计算更准（时辰影响数日差）。
 * @returns description 形如「5岁2个月起运」；at 形如「2030年4月起运」（起运公历年月）。
 */
export function getDayunStart(
  birthDate: string,
  gender: Gender,
  birthHourNum?: number,
  birthMinute?: number,
): { description: string; at: string } {
  try {
    const eightChar = buildEightChar(birthDate, birthHourNum, birthMinute);
    if (!eightChar) return { description: '待计算', at: '—' };

    const yun = eightChar.getYun(genderToNum(gender));
    const years = yun.getStartYear() as number;
    const months = yun.getStartMonth() as number;

    const description =
      years === 0 && months === 0
        ? '出生即起运'
        : `${years > 0 ? `${years}岁` : ''}${months > 0 ? `${months}个月` : ''}起运`;

    const startSolar = yun.getStartSolar();
    const at = `${startSolar.getYear()}年${startSolar.getMonth()}月起运`;

    return { description, at };
  } catch {
    return { description: '待计算', at: '—' };
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

/**
 * 获取大运时间轴（精确版，基于 lunar-javascript getYun）。
 * - 返回前 6 步大运，每步约 10 年。
 * - 起运虚岁、公历年份段均为库的节气数日精确计算。
 * - 顺逆排布由库按「阳男阴女顺行、阴男阳女逆行」内部处理。
 * @param birthHourNum 可选精确小时(0-23)；提供后起运计算更准。
 */
export function getDayunTimeline(
  birthDate: string,
  gender: Gender,
  birthHourNum?: number,
  birthMinute?: number,
  /** 返回的大运步数；默认 8（约起运后 80 年，覆盖终身大运表）。 */
  steps: number = 8,
): DayunTimelineItem[] {
  try {
    const eightChar = buildEightChar(birthDate, birthHourNum, birthMinute);
    if (!eightChar) return [];

    const dayunList = getRealDayunList(eightChar, gender);
    if (!dayunList.length) return [];

    const currentYear = getCurrentYear();
    // 大运每 10 年切换一次，切换月恒为起运的公历月（起运日 + i*10 年）。
    const startMonth = eightChar.getYun(genderToNum(gender)).getStartSolar().getMonth() as number;

    return dayunList.slice(0, Math.max(1, steps)).map((d, i) => {
      const gz = d.getGanZhi() as string;
      const gan = gz[0] as TianGan;
      const zhi = gz[1] as DiZhi;
      const yearStart = d.getStartYear() as number;
      const yearEnd = d.getEndYear() as number;

      return {
        index: i,
        gan,
        zhi,
        wuxing: TIANGAN_WUXING[gan],
        ageStart: d.getStartAge() as number,
        ageEnd: d.getEndAge() as number,
        yearStart,
        yearEnd,
        startMonth,
        isCurrent: currentYear >= yearStart && currentYear <= yearEnd,
      };
    });
  } catch (error) {
    console.error('getDayunTimeline error:', error);
    return [];
  }
}
