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

/** 生我者（印）：取「生出 X」的五行。用于身弱取印为用。 */
const WUXING_GENERATED_BY: Record<WuXing, WuXing> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
};

/** 克我者（官杀）：取「克 X」的五行。用于身强取官杀为用。 */
const WUXING_CONTROLLED_BY: Record<WuXing, WuXing> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
};

/**
 * 日主强弱分档阈值（得令+得地+得势 综合分）。
 * 抽出为具名常量，避免散落魔法数字，便于统一校准。
 */
export const RIZHU_STRENGTH_THRESHOLDS = {
  /** ≥ 此分判「偏强」 */
  strong: 40,
  /** ≥ 此分（且 < strong）判「中和」，低于则「偏弱」 */
  neutral: 10,
} as const;

/**
 * 调候用神（按月令寒燥取暖润）—— 仅用于「中和」局的喜用判定。
 * 冬月(亥子丑)气寒 → 喜火暖局；夏月(巳午未)气燥 → 喜水润局。
 * 春(寅卯辰)/秋(申酉戌)气候平和，不强制调候，退回五行均衡法。
 */
const TIAOHOU_BY_MONTH: Partial<Record<DiZhi, WuXing>> = {
  '亥': '火', '子': '火', '丑': '火',
  '巳': '水', '午': '水', '未': '水',
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
  if (total >= RIZHU_STRENGTH_THRESHOLDS.strong) strength = '偏强';
  else if (total >= RIZHU_STRENGTH_THRESHOLDS.neutral) strength = '中和';
  else strength = '偏弱';

  return { strength, score: total, detail: { deLing, deDi, deShi } };
}

export interface YongShenResult {
  /** 主用神（向后兼容） */
  yongShen: WuXing;
  /** 主忌神（向后兼容） */
  jiShen: WuXing;
  /** 完整喜用神（按重要度，去重） */
  yongShenAll: WuXing[];
  /** 完整忌神（去重） */
  jiShenAll: WuXing[];
}

/**
 * 从格检测（保守）：仅在证据充分时判定，避免误判把普通身弱/身强的用神方向整个反过来。
 * - 从弱格：日主完全无根(得地=0) + 不得令 + 天干无帮扶（放弃抵抗、顺从旺神）。
 * - 从强格：日主得令 + 多根 + 天干多帮 且综合分极高（顺其旺势）。
 */
function detectCongGe(
  chart: BaziChart,
  strength: { score: number; detail: { deLing: number; deDi: number; deShi: number } },
): '从强格' | '从弱格' | null {
  const zhiList: DiZhi[] = [chart.year.zhi, chart.month.zhi, chart.day.zhi];
  if (chart.hour) zhiList.push(chart.hour.zhi);
  const rooted = hasRoot(chart.day.gan, zhiList);
  const { deLing, deDi, deShi } = strength.detail;

  if (!rooted && deDi === 0 && deLing <= 0 && deShi <= 0) return '从弱格';
  if (rooted && deLing >= 30 && deDi >= 40 && deShi >= 20 && strength.score >= 90) return '从强格';
  return null;
}

/**
 * 计算用神和忌神（含完整喜用/忌神集，含从格顺势）
 *
 * 常规：
 * - 日主偏强 → 克泄耗为用（财/食伤/官杀），生助为忌（比劫/印）
 * - 日主偏弱 → 生助为用（印/比劫），克泄耗为忌（财/食伤/官杀）
 * - 日主中和 → 调候优先，再退回五行均衡
 * 从格（顺势）：
 * - 从弱格 → 顺从旺神（克泄耗为用，帮身为忌）
 * - 从强格 → 顺其旺势（比劫印为用，逆势官杀财为忌）
 */
export function calculateYongShen(
  chart: BaziChart,
  strength: RizhuStrength,
  geju?: string,
): YongShenResult {
  const dayWuxing = TIANGAN_WUXING[chart.day.gan];
  const yin = WUXING_GENERATED_BY[dayWuxing];   // 印（生我）
  const bi = dayWuxing;                          // 比劫（同我）
  const shi = WUXING_GENERATE[dayWuxing];        // 食伤（我生）
  const cai = WUXING_CONTROL[dayWuxing];         // 财（我克）
  const guan = WUXING_CONTROLLED_BY[dayWuxing];  // 官杀（克我）
  const dedup = (arr: WuXing[]): WuXing[] => [...new Set(arr)];

  // —— 从格：顺势而为 ——
  if (geju === '从弱格') {
    return { yongShen: cai, jiShen: bi, yongShenAll: dedup([cai, shi, guan]), jiShenAll: dedup([yin, bi]) };
  }
  if (geju === '从强格') {
    return { yongShen: bi, jiShen: guan, yongShenAll: dedup([bi, yin]), jiShenAll: dedup([guan, cai, shi]) };
  }

  // —— 常规身强：克泄耗为用 ——
  if (strength === '偏强') {
    return { yongShen: cai, jiShen: bi, yongShenAll: dedup([cai, shi, guan]), jiShenAll: dedup([bi, yin]) };
  }

  // —— 常规身弱：生助为用 ——
  if (strength === '偏弱') {
    return { yongShen: yin, jiShen: cai, yongShenAll: dedup([yin, bi]), jiShenAll: dedup([cai, shi, guan]) };
  }

  // —— 中和局：先调候（寒暖燥湿），再退回五行均衡 ——
  const wuxingCount: Record<WuXing, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const allGan: TianGan[] = [chart.year.gan, chart.month.gan, chart.day.gan];
  if (chart.hour) allGan.push(chart.hour.gan);
  const allZhi: DiZhi[] = [chart.year.zhi, chart.month.zhi, chart.day.zhi];
  if (chart.hour) allZhi.push(chart.hour.zhi);

  for (const gan of allGan) wuxingCount[TIANGAN_WUXING[gan]]++;
  for (const zhi of allZhi) wuxingCount[DIZHI_WUXING[zhi]]++;

  const entries = (Object.entries(wuxingCount) as [WuXing, number][])
    .sort((a, b) => a[1] - b[1]); // 升序：最弱在前
  const maxCount = entries[entries.length - 1][1];

  const tiaohou = TIAOHOU_BY_MONTH[chart.month.zhi];
  const yongShen: WuXing =
    (tiaohou && tiaohou !== dayWuxing && wuxingCount[tiaohou] < maxCount)
      ? tiaohou
      : (entries.find(([el]) => el !== dayWuxing)?.[0] ?? entries[0][0]);

  const jiShen: WuXing =
    [...entries].reverse().find(([el]) => el !== dayWuxing && el !== yongShen)?.[0]
    ?? entries[entries.length - 1][0];

  return { yongShen, jiShen, yongShenAll: [yongShen], jiShenAll: [jiShen] };
}

export interface MingGeAnalysis {
  geju: GejuName;
  rizhuStrength: RizhuStrength;
  strengthScore: number;
  yongShen: WuXing;
  jiShen: WuXing;
  yongShenAll: WuXing[];
  jiShenAll: WuXing[];
}

/**
 * 一站式命格分析：格局（含从格）+ 日主强弱 + 用神忌神（含完整喜用/忌神集）
 */
export function analyzeMingGe(chart: BaziChart): MingGeAnalysis {
  const strengthResult = calculateRizhuStrength(chart);
  const cong = detectCongGe(chart, strengthResult);
  const geju: GejuName = cong ?? determineGeju(chart);
  const { yongShen, jiShen, yongShenAll, jiShenAll } = calculateYongShen(
    chart,
    strengthResult.strength,
    geju,
  );

  return {
    geju,
    rizhuStrength: strengthResult.strength,
    strengthScore: strengthResult.score,
    yongShen,
    jiShen,
    yongShenAll,
    jiShenAll,
  };
}
