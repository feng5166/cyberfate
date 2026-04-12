import type { BaziChart, TianGan, DiZhi, WuXing } from './types';
import { TIANGAN_WUXING, DIZHI_WUXING } from './constants';
import { getTenGod, type TenGod } from './helpers';

/**
 * 地支藏干表
 * 每个地支内含 1~3 个天干（本气、中气、余气）
 */
export const DIZHI_HIDDEN_GAN: Record<DiZhi, TianGan[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

export type GejuName =
  | '正财格' | '偏财格'
  | '正官格' | '七杀格'
  | '正印格' | '偏印格'
  | '食神格' | '伤官格'
  | '建禄格' | '羊刃格'
  | '杂气格' | '从强格' | '从弱格'
  | '综合格';

/**
 * 判断月令地支的本气十神来定格局
 * 取月支藏干本气（第一个）与日干求十神，即为格局名称
 */
function getMonthMainTenGod(dayGan: TianGan, monthZhi: DiZhi): TenGod {
  const hiddenGans = DIZHI_HIDDEN_GAN[monthZhi];
  if (!hiddenGans.length) return '未知';
  return getTenGod(dayGan, hiddenGans[0]);
}

const TEN_GOD_TO_GEJU: Partial<Record<TenGod, GejuName>> = {
  '正财': '正财格',
  '偏财': '偏财格',
  '正官': '正官格',
  '七杀': '七杀格',
  '正印': '正印格',
  '偏印': '偏印格',
  '食神': '食神格',
  '伤官': '伤官格',
  '比肩': '建禄格',
  '劫财': '羊刃格',
};

const WUXING_GENERATE: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

const WUXING_CONTROL: Record<WuXing, WuXing> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
};

/**
 * 检查天干是否在地支中有根（即通根）
 */
function hasRoot(gan: TianGan, zhiList: DiZhi[]): boolean {
  const ganWuxing = TIANGAN_WUXING[gan];
  return zhiList.some(zhi => {
    const hidden = DIZHI_HIDDEN_GAN[zhi];
    return hidden.some(h => TIANGAN_WUXING[h] === ganWuxing);
  });
}

/**
 * 检查某个十神是否在天干中透出
 */
function isTenGodTransparent(dayGan: TianGan, chart: BaziChart, tenGod: TenGod): boolean {
  const ganList = [chart.year.gan, chart.month.gan];
  if (chart.hour) ganList.push(chart.hour.gan);

  return ganList.some(g => getTenGod(dayGan, g) === tenGod);
}

/**
 * 判断格局
 *
 * 基本规则：
 * 1. 以月支藏干本气的十神作为初步格局
 * 2. 如果本气为比肩/劫财（建禄/羊刃），检查月支藏干中气/余气是否透出
 * 3. 如果透出则以透出的十神定格局
 * 4. 杂气格：月支为辰/戌/丑/未且本气为比劫但无其他透出
 */
export function determineGeju(chart: BaziChart): GejuName {
  const dayGan = chart.day.gan;
  const monthZhi = chart.month.zhi;

  const mainTenGod = getMonthMainTenGod(dayGan, monthZhi);

  if (mainTenGod !== '比肩' && mainTenGod !== '劫财' && mainTenGod !== '日主') {
    return TEN_GOD_TO_GEJU[mainTenGod] || '综合格';
  }

  const hiddenGans = DIZHI_HIDDEN_GAN[monthZhi];
  for (let i = 1; i < hiddenGans.length; i++) {
    const god = getTenGod(dayGan, hiddenGans[i]);
    if (god !== '比肩' && god !== '劫财' && god !== '日主' && god !== '未知') {
      if (isTenGodTransparent(dayGan, chart, god)) {
        return TEN_GOD_TO_GEJU[god] || '综合格';
      }
    }
  }

  const isEarthBranch = ['辰', '戌', '丑', '未'].includes(monthZhi);
  if (isEarthBranch) {
    return '杂气格';
  }

  return TEN_GOD_TO_GEJU[mainTenGod] || '综合格';
}

export type RizhuStrength = '偏强' | '中和' | '偏弱';

/**
 * 月令旺相判断 —— 日干在月支是否得令
 * 得令 = 月支五行生日干五行 或 月支五行与日干五行相同
 */
function getDeLing(dayGan: TianGan, monthZhi: DiZhi): number {
  const dayWuxing = TIANGAN_WUXING[dayGan];
  const monthWuxing = DIZHI_WUXING[monthZhi];

  if (dayWuxing === monthWuxing) return 30;
  if (WUXING_GENERATE[monthWuxing] === dayWuxing) return 20;

  if (WUXING_CONTROL[monthWuxing] === dayWuxing) return -20;
  if (WUXING_GENERATE[dayWuxing] === monthWuxing) return -10;

  return 0;
}

/**
 * 得地 —— 日干在地支中是否有根气
 * 本气 +20，中气 +10，余气 +5
 */
function getDeDi(dayGan: TianGan, chart: BaziChart): number {
  const dayWuxing = TIANGAN_WUXING[dayGan];
  let score = 0;

  const zhiList: DiZhi[] = [chart.year.zhi, chart.month.zhi, chart.day.zhi];
  if (chart.hour) zhiList.push(chart.hour.zhi);

  for (const zhi of zhiList) {
    const hidden = DIZHI_HIDDEN_GAN[zhi];
    hidden.forEach((h, index) => {
      if (TIANGAN_WUXING[h] === dayWuxing) {
        if (index === 0) score += 20;
        else if (index === 1) score += 10;
        else score += 5;
      }
    });
  }

  return score;
}

/**
 * 得势 —— 天干中同类/生我的个数
 */
function getDeShi(dayGan: TianGan, chart: BaziChart): number {
  const dayWuxing = TIANGAN_WUXING[dayGan];
  let score = 0;

  const ganList: TianGan[] = [chart.year.gan, chart.month.gan];
  if (chart.hour) ganList.push(chart.hour.gan);

  for (const gan of ganList) {
    const ganWuxing = TIANGAN_WUXING[gan];
    if (ganWuxing === dayWuxing) score += 15;
    else if (WUXING_GENERATE[ganWuxing] === dayWuxing) score += 10;
    else if (WUXING_CONTROL[ganWuxing] === dayWuxing) score -= 10;
    else if (WUXING_GENERATE[dayWuxing] === ganWuxing) score -= 5;
  }

  return score;
}

/**
 * 综合评分判断日主强弱
 *
 * 得令(0~30) + 得地(0~80) + 得势(-30~45) = 总分
 * >= 40 偏强
 * 10~39 中和
 * < 10 偏弱
 */
export function calculateRizhuStrength(chart: BaziChart): {
  strength: RizhuStrength;
  score: number;
  detail: { deLing: number; deDi: number; deShi: number };
} {
  const dayGan = chart.day.gan;

  const deLing = getDeLing(dayGan, chart.month.zhi);
  const deDi = getDeDi(dayGan, chart);
  const deShi = getDeShi(dayGan, chart);

  const total = deLing + deDi + deShi;

  let strength: RizhuStrength;
  if (total >= 40) strength = '偏强';
  else if (total >= 10) strength = '中和';
  else strength = '偏弱';

  return { strength, score: total, detail: { deLing, deDi, deShi } };
}

/**
 * 计算用神和忌神
 *
 * 日主偏强 → 需要克泄耗：官杀（克）、食伤（泄）、财（耗）为用神
 *           → 生助为忌：印（生）、比劫（助）为忌神
 * 日主偏弱 → 需要生助：印（生）、比劫（助）为用神
 *           → 克泄耗为忌：官杀（克）、食伤（泄）、财（耗）为忌神
 * 日主中和 → 平衡调候，以五行缺失/最弱为用神，最旺为忌神
 */
export function calculateYongShen(
  chart: BaziChart,
  strength: RizhuStrength
): { yongShen: WuXing; jiShen: WuXing } {
  const dayWuxing = TIANGAN_WUXING[chart.day.gan];

  if (strength === '偏强') {
    const yongShen = WUXING_CONTROL[dayWuxing];
    const jiShen = dayWuxing;
    return { yongShen, jiShen };
  }

  if (strength === '偏弱') {
    const generating: Record<WuXing, WuXing> = {
      '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
    };
    const yongShen = generating[dayWuxing];
    const jiShen = WUXING_CONTROL[dayWuxing];
    return { yongShen, jiShen };
  }

  const wuxingCount: Record<WuXing, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const allGan: TianGan[] = [chart.year.gan, chart.month.gan, chart.day.gan];
  if (chart.hour) allGan.push(chart.hour.gan);
  const allZhi: DiZhi[] = [chart.year.zhi, chart.month.zhi, chart.day.zhi];
  if (chart.hour) allZhi.push(chart.hour.zhi);

  for (const gan of allGan) wuxingCount[TIANGAN_WUXING[gan]]++;
  for (const zhi of allZhi) wuxingCount[DIZHI_WUXING[zhi]]++;

  const entries = Object.entries(wuxingCount) as [WuXing, number][];
  entries.sort((a, b) => a[1] - b[1]);

  const weakest = entries[0][0];
  const strongest = entries[entries.length - 1][0];

  const yongShen = weakest === dayWuxing ? entries[1][0] : weakest;
  const jiShen = strongest === dayWuxing ? entries[entries.length - 2][0] : strongest;

  return { yongShen, jiShen };
}

export interface MingGeAnalysis {
  geju: GejuName;
  rizhuStrength: RizhuStrength;
  strengthScore: number;
  yongShen: WuXing;
  jiShen: WuXing;
}

/**
 * 一站式命格分析：格局 + 日主强弱 + 用神忌神
 */
export function analyzeMingGe(chart: BaziChart): MingGeAnalysis {
  const geju = determineGeju(chart);
  const { strength, score } = calculateRizhuStrength(chart);
  const { yongShen, jiShen } = calculateYongShen(chart, strength);

  return {
    geju,
    rizhuStrength: strength,
    strengthScore: score,
    yongShen,
    jiShen,
  };
}
