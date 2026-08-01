import { Lunar, Solar } from 'lunar-javascript';
import type { BaziInput, DayunTimelineItem, DiZhi, Gender, TianGan, WuXing } from './types';
import { calculateBazi, getDayunStart, getDayunTimeline, getMonthGanzhi } from './calculator';
import { analyzeMingGe, type MingGeAnalysis } from './geju';
import { analyzeLiunian, type FlowAnalysis } from './liunian';
import { describeDayun, type DayunFortune } from './dayunDetail';
import { shenshaNature } from './shensha';
import { getTenGod, type TenGod } from './helpers';
import { relateBranches } from './interactions';
import { TIANGAN_WUXING, DIZHI_WUXING } from './constants';

/**
 * 人生K线：基于八字命理的百年运势可视化引擎。
 *
 * 完全确定性计算（同一出生信息永远得到同一条K线）：
 * - 逐年（虚岁 1-100）取流年干支 + 所处大运，与命局用神/忌神、十神、
 *   刑冲会合害逐项计分，合成当年运势分（0-100）
 * - 按金融K线 OHLC 模型输出：开盘=上年收盘附近，收盘=当年运势分，
 *   最高/最低由「振幅」（刑冲越多、换运之年振幅越大）+ 出生信息种子的
 *   确定性伪随机数生成
 * - 附 MA10（十年均线）与最佳/最具挑战十年、巅峰/低谷等概览统计
 */

export type LifeKlineLevel = '极盛' | '上佳' | '平稳' | '承压' | '低谷';

/** 分维度运势分（P1-A：财/事业/感情/健康，仅收盘线） */
export interface DimScores {
  wealth: number;
  career: number;
  love: number;
  health: number;
}
export type DimKey = keyof DimScores;

/** 年内最佳/最差流月（P1-B 影线归真的副产物） */
export interface MonthExtreme {
  /** 公历月 1-12（按该月 15 日所在节气月取干支） */
  month: number;
  ganzhi: string;
}

export interface LifeKlineYearPoint {
  /** 虚岁 */
  age: number;
  /** 公历年 */
  year: number;
  /** 流年干支，如 "丙午" */
  ganzhi: string;
  /** 流年天干对日主的十神 */
  ganTenGod: TenGod;
  open: number;
  close: number;
  high: number;
  low: number;
  /** 十年均线（不足10年为 null） */
  ma10: number | null;
  level: LifeKlineLevel;
  /** 当年一句话短评 */
  comment: string;
  /** 所处大运序号（-1 = 起运前童限） */
  dayunIndex: number;
  /** 是否换大运之年 */
  isDayunStart: boolean;
  /** 刑冲会合摘要（如 "冲日支午"），无则空数组 */
  interactionsBrief: string[];
  /** 分维度收盘分（VIP 能力；API 对非 VIP 剥除此字段） */
  dims?: DimScores;
  /** 年内最佳流月（影线上沿的来源） */
  bestMonth: MonthExtreme;
  /** 年内最差流月（影线下沿的来源） */
  worstMonth: MonthExtreme;
}

export interface LifeKlineDayun {
  index: number;
  ganZhi: string;
  wuxing: WuXing;
  /** 大运天干对日主的十神 */
  tenGod: TenGod;
  fortune: DayunFortune;
  ageStart: number;
  ageEnd: number;
  yearStart: number;
  yearEnd: number;
  isCurrent: boolean;
}

export interface LifeKlineDecade {
  /** 起始虚岁（含） */
  ageStart: number;
  /** 结束虚岁（含） */
  ageEnd: number;
  avg: number;
}

export interface LifeKlineSummary {
  bestDecade: LifeKlineDecade;
  worstDecade: LifeKlineDecade;
  peak: { year: number; age: number; score: number; level: LifeKlineLevel };
  trough: { year: number; age: number; score: number; level: LifeKlineLevel };
  /** 当前虚岁（超出范围则为 null） */
  currentAge: number | null;
  currentYear: number;
  /** 近年走势阶段：上升期 / 平稳期 / 调整期 */
  currentPhase: '上升期' | '平稳期' | '调整期';
}

export interface LifeKlineMeta {
  /** 四柱干支，如 "癸亥 庚申 辛巳 甲午"（无时柱则三柱） */
  fourPillars: string;
  /** 日主，如 "辛金" */
  dayMaster: string;
  zodiac: string;
  mingGe: Pick<MingGeAnalysis, 'geju' | 'rizhuStrength' | 'yongShen' | 'jiShen'>;
  /** 起运描述，如 "4岁4个月起运" */
  dayunStart: string;
  birthYear: number;
}

export interface LifeKlineResult {
  points: LifeKlineYearPoint[];
  dayuns: LifeKlineDayun[];
  summary: LifeKlineSummary;
  meta: LifeKlineMeta;
}

// ---------------------------------------------------------------------------
// 确定性伪随机：出生信息 + 年份做种子，保证同一命盘K线永远一致
// ---------------------------------------------------------------------------

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32：返回 [0,1) 的确定性伪随机序列 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 五行生克 + 计分
// ---------------------------------------------------------------------------

const WUXING_GENERATE: Record<WuXing, WuXing> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

const WUXING_CONTROL: Record<WuXing, WuXing> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

// 三合局：申子辰水、亥卯未木、寅午戌火、巳酉丑金（旺神 子/卯/午/酉）
const SAN_HE: { branches: [DiZhi, DiZhi, DiZhi]; wang: DiZhi; hua: WuXing }[] = [
  { branches: ['申', '子', '辰'], wang: '子', hua: '水' },
  { branches: ['亥', '卯', '未'], wang: '卯', hua: '木' },
  { branches: ['寅', '午', '戌'], wang: '午', hua: '火' },
  { branches: ['巳', '酉', '丑'], wang: '酉', hua: '金' },
];

// 三会方：寅卯辰木、巳午未火、申酉戌金、亥子丑水
const SAN_HUI: { branches: [DiZhi, DiZhi, DiZhi]; hua: WuXing }[] = [
  { branches: ['寅', '卯', '辰'], hua: '木' },
  { branches: ['巳', '午', '未'], hua: '火' },
  { branches: ['申', '酉', '戌'], hua: '金' },
  { branches: ['亥', '子', '丑'], hua: '水' },
];

/** 某五行相对用神/忌神的分值：正=助用神，负=助忌神 */
function scoreWuxing(
  wx: WuXing,
  mingGe: MingGeAnalysis,
  weightDirect: number,
  weightIndirect: number,
): number {
  if (mingGe.yongShenAll.includes(wx)) return weightDirect;
  if (mingGe.jiShenAll.includes(wx)) return -weightDirect;
  if (mingGe.yongShenAll.includes(WUXING_GENERATE[wx])) return weightIndirect;
  if (mingGe.jiShenAll.includes(WUXING_GENERATE[wx])) return -weightIndirect;
  return 0;
}

/** 十神对日主的助益，按身强弱取向（身强喜泄耗、身弱喜生扶） */
const TEN_GOD_SCORE: Record<'偏强' | '中和' | '偏弱', Partial<Record<TenGod, number>>> = {
  偏强: {
    食神: 3, 伤官: 1, 正财: 3, 偏财: 2, 正官: 3, 七杀: 1,
    正印: -2, 偏印: -3, 比肩: -2, 劫财: -3,
  },
  中和: {
    正官: 2, 正印: 2, 正财: 2, 食神: 2, 偏财: 1,
    七杀: -1, 伤官: -1, 劫财: -1, 偏印: -1,
  },
  偏弱: {
    正印: 3, 偏印: 2, 比肩: 2, 劫财: 1,
    七杀: -3, 伤官: -2, 偏财: -2, 正官: -1, 正财: -1, 食神: -1,
  },
};

/** 地支两两关系计分与振幅贡献 */
const RELATION_EFFECT: Record<string, { score: number; volatility: number }> = {
  六冲: { score: -4, volatility: 3 },
  三刑: { score: -3, volatility: 2 },
  自刑: { score: -2, volatility: 2 },
  六害: { score: -2, volatility: 1 },
  六合: { score: 2, volatility: 0 },
};

interface FlowScore {
  score: number;
  volatility: number;
  brief: string[];
  /** 分维度原始增量（相对命局基准的偏移） */
  dims: DimScores;
}

interface FlowContext {
  /** 命局真实存在的地支 */
  chartBranches: DiZhi[];
  /** 日柱 */
  dayGan: TianGan;
  dayZhi: DiZhi;
  /** 当前所处大运（童限期为 null） */
  dayun: { gan: TianGan; zhi: DiZhi } | null;
  /** 当前大运的五行分（用于岁运并临的吉凶放大方向） */
  dayunScore: number;
  /** 性别决定配偶星（男以财星、女以官杀为感情线主星） */
  gender: Gender;
}

/** 十神对四维的权重分布（乘以该十神的取向分值，正负号随之） */
const TEN_GOD_DIMS: Partial<Record<TenGod, Partial<DimScores>>> = {
  正财: { wealth: 1 },
  偏财: { wealth: 1 },
  正官: { career: 1 },
  七杀: { career: 0.8, health: 0.4 },
  正印: { career: 0.5, health: 0.7 },
  偏印: { career: 0.3, health: 0.4 },
  食神: { wealth: 0.5, health: 0.5 },
  伤官: { wealth: 0.4, career: 0.3 },
  比肩: { wealth: 0.4, career: 0.3 },
  劫财: { wealth: 0.7, career: 0.2 },
};

const LOVE_SHENSHA = ['桃花', '红鸾', '天喜'];

/** 流年支引动的三合局/三会方（流年支补全命局中已有的两支） */
function detectFlowCombos(
  flowZhi: DiZhi,
  chartBranches: DiZhi[],
  mingGe: MingGeAnalysis,
): { score: number; volatility: number; brief: string[] } {
  let score = 0;
  let volatility = 0;
  const brief: string[] = [];

  const comboScore = (hua: WuXing, direct: number, indirect: number) =>
    scoreWuxing(hua, mingGe, direct, indirect);

  for (const { branches, wang, hua } of SAN_HE) {
    if (!branches.includes(flowZhi)) continue;
    const others = branches.filter((z) => z !== flowZhi);
    const fullMatch = others.every((z) => chartBranches.includes(z));
    if (fullMatch) {
      const s = comboScore(hua, 8, 4);
      score += s;
      volatility += 2;
      brief.push(`三合${hua}局${s < 0 ? '(助忌)' : ''}`);
      continue;
    }
    // 半三合：流年支与命局一支配成含旺神的半合
    const half = others.find(
      (z) => chartBranches.includes(z) && (z === wang || flowZhi === wang),
    );
    if (half) {
      const s = comboScore(hua, 3, 2);
      score += s;
      volatility += 1;
      if (s !== 0) brief.push(`半三合${hua}${s < 0 ? '(助忌)' : ''}`);
    }
  }

  for (const { branches, hua } of SAN_HUI) {
    if (!branches.includes(flowZhi)) continue;
    const others = branches.filter((z) => z !== flowZhi);
    if (others.every((z) => chartBranches.includes(z))) {
      const s = comboScore(hua, 9, 5);
      score += s;
      volatility += 2;
      brief.push(`三会${hua}方${s < 0 ? '(助忌)' : ''}`);
    }
  }

  return { score, volatility, brief };
}

function scoreFlow(flow: FlowAnalysis, mingGe: MingGeAnalysis, ctx: FlowContext): FlowScore {
  let score = 0;
  let volatility = 0;
  const brief: string[] = [];
  const dims: DimScores = { wealth: 0, career: 0, love: 0, health: 0 };

  /** 十神分值按维度权重分摊（含配偶星入感情线） */
  const spreadTenGod = (tg: TenGod, v: number) => {
    for (const [k, w] of Object.entries(TEN_GOD_DIMS[tg] ?? {})) {
      dims[k as DimKey] += v * (w as number);
    }
    const spouseWeight =
      ctx.gender === 'male'
        ? tg === '正财' ? 0.7 : tg === '偏财' ? 0.35 : 0
        : tg === '正官' ? 0.7 : tg === '七杀' ? 0.35 : 0;
    if (spouseWeight) dims.love += v * spouseWeight;
  };

  // 流年干支五行对用神/忌神
  const wxScore =
    scoreWuxing(TIANGAN_WUXING[flow.gan], mingGe, 7, 4) +
    scoreWuxing(DIZHI_WUXING[flow.zhi], mingGe, 5, 3);
  score += wxScore;
  // 五行喜忌是所有维度共同的底色
  for (const k of Object.keys(dims) as DimKey[]) dims[k] += wxScore * 0.35;

  // 流年天干十神取向 + 地支藏干本气十神（半权重）
  const ganTgScore = TEN_GOD_SCORE[mingGe.rizhuStrength][flow.ganTenGod] ?? 0;
  score += ganTgScore;
  spreadTenGod(flow.ganTenGod, ganTgScore);
  const mainHidden = flow.zhiHiddenTenGods[0];
  if (mainHidden) {
    const hiddenScore = (TEN_GOD_SCORE[mingGe.rizhuStrength][mainHidden.tenGod] ?? 0) * 0.5;
    score += hiddenScore;
    spreadTenGod(mainHidden.tenGod, hiddenScore);
  }

  // 与命局四柱的刑冲会合害（作用于日支加重；日支=婚姻宫入感情线，月支=事业宫入事业线）
  const PILLAR_LABEL: Record<string, string> = { year: '年支', month: '月支', day: '日支', hour: '时支' };
  for (const it of flow.interactions) {
    const dayWeight = it.pillar === 'day' ? 1.5 : 1;
    for (const rel of it.relations) {
      const effect = RELATION_EFFECT[rel.type];
      if (!effect) continue;
      score += effect.score * dayWeight;
      volatility += effect.volatility;
      if (effect.score < 0) brief.push(`${rel.type}${PILLAR_LABEL[it.pillar] ?? it.pillar}${it.with}`);
      dims.love += effect.score * (it.pillar === 'day' ? 1.8 : 0.2);
      dims.career += effect.score * (it.pillar === 'month' ? 0.8 : 0.2);
      dims.health += effect.score * 0.4;
    }
  }

  // 流年支引动三合局/三会方（聚变之年，吉凶皆放大）
  const combos = detectFlowCombos(flow.zhi, ctx.chartBranches, mingGe);
  score += combos.score;
  volatility += combos.volatility;
  brief.push(...combos.brief);
  for (const k of Object.keys(dims) as DimKey[]) dims[k] += combos.score * 0.3;

  // 流年与日柱伏吟 / 天克地冲（支冲日支已在上面计过，这里补天干层）
  if (flow.gan === ctx.dayGan && flow.zhi === ctx.dayZhi) {
    score -= 3;
    volatility += 2;
    brief.push('伏吟日柱');
    dims.love -= 2;
    dims.health -= 1.5;
  } else if (
    WUXING_CONTROL[TIANGAN_WUXING[flow.gan]] === TIANGAN_WUXING[ctx.dayGan] &&
    RELATION_EFFECT['六冲'] &&
    flow.interactions.some((it) => it.pillar === 'day' && it.relations.some((r) => r.type === '六冲'))
  ) {
    score -= 3;
    volatility += 2;
    brief.push('天克地冲日柱');
    dims.love -= 2;
    dims.health -= 1.5;
  }

  // 岁运互动（童限期无大运则跳过）
  if (ctx.dayun) {
    if (flow.gan === ctx.dayun.gan && flow.zhi === ctx.dayun.zhi) {
      // 岁运并临：大事之年，顺势放大吉凶
      const direction = ctx.dayunScore + score >= 0 ? 1 : -1;
      score += direction * 4;
      volatility += 4;
      brief.push('岁运并临');
      for (const k of Object.keys(dims) as DimKey[]) dims[k] += direction * 1.5;
      dims.health -= 1;
    } else {
      const ganClash =
        WUXING_CONTROL[TIANGAN_WUXING[flow.gan]] === TIANGAN_WUXING[ctx.dayun.gan] ||
        WUXING_CONTROL[TIANGAN_WUXING[ctx.dayun.gan]] === TIANGAN_WUXING[flow.gan];
      const zhiChong = relatesChong(flow.zhi, ctx.dayun.zhi);
      if (ganClash && zhiChong) {
        score -= 6;
        volatility += 4;
        brief.push('天克地冲大运');
        dims.career -= 2;
        dims.health -= 1;
      } else if (zhiChong) {
        score -= 3;
        volatility += 2;
        brief.push('冲大运支');
        dims.career -= 1;
      }
    }
  }

  // 流年引动神煞：吉神小幅加分，凶煞小幅减分（封顶 ±4）；桃花类入感情线
  let shenshaScore = 0;
  let loveShensha = 0;
  for (const s of flow.shensha) {
    const nature = shenshaNature(s.name);
    if (nature === '吉') shenshaScore += 1.5;
    else if (nature === '凶') shenshaScore -= 1.5;
    if (LOVE_SHENSHA.some((n) => s.name.includes(n))) loveShensha += 1.5;
  }
  shenshaScore = Math.max(-4, Math.min(4, shenshaScore));
  score += shenshaScore;
  volatility += Math.min(2, flow.shensha.length * 0.5);
  dims.health += shenshaScore * 0.5;
  dims.love += Math.min(3, loveShensha);

  return { score, volatility, brief, dims };
}

// ---------------------------------------------------------------------------
// 流月轻量计分（P1-B：影线归真 + 流月下钻共用）
// ---------------------------------------------------------------------------

interface MonthScore {
  month: number;
  ganzhi: string;
  gan: TianGan;
  zhi: DiZhi;
  /** 相对当年基准的原始偏移分 */
  delta: number;
}

/**
 * 某公历月的轻量运势计分：月干支五行对用神 + 月干十神取向 +
 * 月支与命局/流年支的刑冲会合。不计神煞（性能考量，年层已计）。
 */
function scoreMonth(
  chartBranches: DiZhi[],
  dayGan: TianGan,
  mingGe: MingGeAnalysis,
  yearZhi: DiZhi,
  year: number,
  month: number,
): MonthScore {
  const ganzhi = getMonthGanzhi(`${year}-${String(month).padStart(2, '0')}-15`);
  const gan = ganzhi[0] as TianGan;
  const zhi = ganzhi[1] as DiZhi;

  let delta = scoreWuxing(TIANGAN_WUXING[gan], mingGe, 5, 3) + scoreWuxing(DIZHI_WUXING[zhi], mingGe, 4, 2);
  delta += (TEN_GOD_SCORE[mingGe.rizhuStrength][getTenGod(dayGan, gan)] ?? 0) * 0.8;

  for (const branch of chartBranches) {
    for (const rel of relateBranches(zhi, branch)) {
      delta += (RELATION_EFFECT[rel.type]?.score ?? 0) * 0.6;
    }
  }
  for (const rel of relateBranches(zhi, yearZhi)) {
    delta += (RELATION_EFFECT[rel.type]?.score ?? 0) * 0.5;
  }

  return { month, ganzhi, gan, zhi, delta };
}

function scoreYearMonths(
  chartBranches: DiZhi[],
  dayGan: TianGan,
  mingGe: MingGeAnalysis,
  yearZhi: DiZhi,
  year: number,
): MonthScore[] {
  const out: MonthScore[] = [];
  for (let m = 1; m <= 12; m++) out.push(scoreMonth(chartBranches, dayGan, mingGe, yearZhi, year, m));
  return out;
}

// 六冲对照（岁运互查用）
const CHONG_PAIRS: [DiZhi, DiZhi][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];
function relatesChong(a: DiZhi, b: DiZhi): boolean {
  return CHONG_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ---------------------------------------------------------------------------
// 等级与短评
// ---------------------------------------------------------------------------

export function levelFromScore(score: number): LifeKlineLevel {
  if (score >= 85) return '极盛';
  if (score >= 72) return '上佳';
  if (score >= 58) return '平稳';
  if (score >= 45) return '承压';
  return '低谷';
}

/** 十神 × 高/低分位的一句话短评 */
const TEN_GOD_COMMENT: Partial<Record<TenGod, { high: string; low: string }>> = {
  正官: { high: '官星得力，事业顺遂有升迁之象', low: '官星受制，谋事宜守不宜进' },
  七杀: { high: '官杀极旺，权势显赫', low: '七杀攻身，压力较大宜稳守' },
  正印: { high: '印星护身，贵人扶持学业有成', low: '印星虚浮，静养蓄力为宜' },
  偏印: { high: '偏印生慧，宜钻研专业另辟蹊径', low: '枭神夺食，谨防思虑过度' },
  正财: { high: '财星当令，正财稳进收获颇丰', low: '财来财去，理财宜保守' },
  偏财: { high: '偏财透干，机遇偏多可谋外财', low: '偏财不稳，投机需谨慎' },
  食神: { high: '食神生财，才华得展衣食丰足', low: '食神受克，创意受阻宜养身' },
  伤官: { high: '伤官吐秀，锋芒毕露宜展才华', low: '伤官见官，慎言慎行防口舌' },
  比肩: { high: '比肩帮身，朋友助力合作有成', low: '比肩争财，合伙谨慎防分耗' },
  劫财: { high: '劫财化敌为友，竞争中得势', low: '劫财耗财，破财风险需防范' },
};

function commentFor(tenGod: TenGod, score: number): string {
  const c = TEN_GOD_COMMENT[tenGod];
  if (!c) return score >= 60 ? '流年平顺，稳中有进' : '流年平缓，宜蓄势待时';
  return score >= 60 ? c.high : c.low;
}

// ---------------------------------------------------------------------------
// 回测年份选择（P0-A：从已经历的年份中选极值年做「准/不准」投票）
// ---------------------------------------------------------------------------

/** 回测区间下限：太小的年纪没有可回忆的「运势」 */
const BACKTEST_MIN_AGE = 18;
/** 虚岁低于此值不出回测模块（可回忆区间太短） */
const BACKTEST_MIN_CURRENT_AGE = 20;

export interface BacktestPick {
  peak: LifeKlineYearPoint;
  trough: LifeKlineYearPoint;
}

/**
 * 从用户已经历的区间（虚岁 [18, 当前-1]）选收盘最高与最低各一年。
 * 两年相隔 ≤2 年时低分年取次低，保证回忆能拉开；选不出两个不同年份返回 null。
 */
export function selectBacktestYears(result: LifeKlineResult): BacktestPick | null {
  const { currentAge } = result.summary;
  if (currentAge === null || currentAge < BACKTEST_MIN_CURRENT_AGE) return null;

  const past = result.points.filter((p) => p.age >= BACKTEST_MIN_AGE && p.age <= currentAge - 1);
  if (past.length < 2) return null;

  const peak = past.reduce((a, b) => (b.close > a.close ? b : a));
  const ascending = [...past].sort((a, b) => a.close - b.close);
  const trough = ascending.find((p) => Math.abs(p.year - peak.year) > 2) ?? ascending[0];
  if (trough.age === peak.age) return null;

  return { peak, trough };
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

const CLAMP_MIN = 18;
const CLAMP_MAX = 98;

function clamp(v: number, min = CLAMP_MIN, max = CLAMP_MAX): number {
  return Math.min(max, Math.max(min, v));
}

export interface LifeKlineOptions {
  /** 覆盖的虚岁跨度，默认 100 */
  span?: number;
  /** 「当前年」，默认取系统时间所在公历年 */
  currentYear?: number;
}

export function computeLifeKline(input: BaziInput, options: LifeKlineOptions = {}): LifeKlineResult {
  const span = options.span ?? 100;
  const currentYear = options.currentYear ?? new Date().getFullYear();

  const bazi = calculateBazi(input);
  const chart = bazi.chart;
  const dayGan = chart.day.gan;
  const mingGe = analyzeMingGe(chart);

  // 农历输入先转公历，保证出生年与大运推法一致
  const [by, bm, bd] = input.birthDate.split('-').map(Number);
  const solar = input.isLunar === true
    ? (Lunar as unknown as { fromYmd: (y: number, m: number, d: number) => { getSolar: () => { toYmd: () => string; getYear: () => number } } })
        .fromYmd(by, bm, bd).getSolar()
    : (Solar as unknown as { fromYmd: (y: number, m: number, d: number) => { toYmd: () => string; getYear: () => number } })
        .fromYmd(by, bm, bd);
  const solarBirthDate = solar.toYmd();
  const birthYear = solar.getYear();

  const hourNum = input.knowTime !== false && typeof input.birthHourNum === 'number'
    ? input.birthHourNum
    : undefined;
  const timeline = getDayunTimeline(
    solarBirthDate,
    input.gender,
    hourNum,
    input.birthMinute,
    Math.ceil(span / 10) + 2,
  );
  const dayunStart = getDayunStart(solarBirthDate, input.gender, hourNum, input.birthMinute);

  const dayuns: LifeKlineDayun[] = timeline.map((t) => {
    const detail = describeDayun(t, dayGan, mingGe.yongShen, mingGe.jiShen);
    return {
      index: t.index,
      ganZhi: detail.ganZhi,
      wuxing: t.wuxing,
      tenGod: detail.ganShiShen,
      fortune: detail.fortune,
      ageStart: t.ageStart,
      ageEnd: t.ageEnd,
      yearStart: t.yearStart,
      yearEnd: t.yearEnd,
      isCurrent: t.isCurrent,
    };
  });

  // 大运五行分（起运前童限期以月柱五行减半计）
  const dayunScoreByIndex = new Map<number, number>();
  for (const t of timeline) {
    dayunScoreByIndex.set(
      t.index,
      scoreWuxing(TIANGAN_WUXING[t.gan], mingGe, 9, 5) + scoreWuxing(DIZHI_WUXING[t.zhi], mingGe, 6, 3),
    );
  }
  const childhoodScore = Math.round(
    (scoreWuxing(chart.month.ganWuxing, mingGe, 9, 5) + scoreWuxing(chart.month.zhiWuxing, mingGe, 6, 3)) / 2,
  );

  const findDayun = (age: number): DayunTimelineItem | undefined =>
    timeline.find((t) => age >= t.ageStart && age <= t.ageEnd);

  const rng = mulberry32(hashSeed(
    `${solarBirthDate}|${input.gender}|${hourNum ?? 'x'}|${input.birthMinute ?? 'x'}`,
  ));
  /** [-1,1) 的确定性噪声 */
  const noise = () => rng() * 2 - 1;

  const chartBranches = [chart.year, chart.month, chart.day, chart.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => p.zhi);

  const points: LifeKlineYearPoint[] = [];
  let prevClose: number | null = null;
  let prevDims: DimScores | null = null;

  for (let age = 1; age <= span; age++) {
    const year = birthYear + age - 1;
    const flow = analyzeLiunian(chart, year);
    const dayun = findDayun(age);
    const dayunScore = dayun ? (dayunScoreByIndex.get(dayun.index) ?? 0) : childhoodScore;
    const flowScore = scoreFlow(flow, mingGe, {
      chartBranches,
      dayGan,
      dayZhi: chart.day.zhi,
      dayun: dayun ? { gan: dayun.gan, zhi: dayun.zhi } : null,
      dayunScore,
      gender: input.gender,
    });

    const isDayunStart = dayun ? age === dayun.ageStart : false;

    // 目标运势分：命局基准 50 + 大运 + 流年（放大 1.2 拉开动态范围）
    const target = clamp(50 + (dayunScore + flowScore.score) * 1.2 + noise() * 2, 22, 96);

    // 收盘价向目标缓动，模拟运势的连续性（年度变化幅度有限）
    let close: number;
    let open: number;
    if (prevClose === null) {
      close = Math.round(target);
      open = clamp(Math.round(target + noise() * 3));
    } else {
      const delta = target - prevClose;
      // 平常年份单年变化有限；刑冲聚变/岁运并临之年（振幅大）允许更大跳变
      const maxStep = 12 + flowScore.volatility * 1.5;
      const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep) * 0.7 + noise() * 2.5;
      close = Math.round(clamp(prevClose + step));
      open = Math.round(clamp(prevClose + noise() * 1.5));
    }

    // 影线归真（P1-B）：上下影锚定当年 12 流月的真实极值，每根影线可解释
    const months = scoreYearMonths(chartBranches, dayGan, mingGe, flow.zhi, year);
    const bestM = months.reduce((a, b) => (b.delta > a.delta ? b : a));
    const worstM = months.reduce((a, b) => (b.delta < a.delta ? b : a));
    const high = Math.round(clamp(Math.max(open, close) + 1 + Math.max(0, bestM.delta) * 0.55, CLAMP_MIN, 100));
    const low = Math.round(clamp(Math.min(open, close) - 1 - Math.max(0, -worstM.delta) * 0.55, 12, CLAMP_MAX));

    // 分维度收盘线（P1-A）：各维度独立缓动，确定性无噪声
    const dims: DimScores = { wealth: 0, career: 0, love: 0, health: 0 };
    for (const k of Object.keys(dims) as DimKey[]) {
      const dimTarget = clamp(50 + (dayunScore * 0.8 + flowScore.dims[k]) * 1.2, 22, 96);
      if (prevDims === null) {
        dims[k] = Math.round(dimTarget);
      } else {
        const dDelta = dimTarget - prevDims[k];
        const dStep = Math.sign(dDelta) * Math.min(Math.abs(dDelta), 10 + flowScore.volatility) * 0.7;
        dims[k] = Math.round(clamp(prevDims[k] + dStep));
      }
    }

    points.push({
      age,
      year,
      ganzhi: flow.ganzhi,
      ganTenGod: flow.ganTenGod,
      open,
      close,
      high,
      low,
      ma10: null,
      level: levelFromScore(close),
      comment: commentFor(flow.ganTenGod, close),
      dayunIndex: dayun ? dayun.index : -1,
      isDayunStart,
      interactionsBrief: flowScore.brief,
      dims,
      bestMonth: { month: bestM.month, ganzhi: bestM.ganzhi },
      worstMonth: { month: worstM.month, ganzhi: worstM.ganzhi },
    });

    prevClose = close;
    prevDims = dims;
  }

  // MA10
  for (let i = 0; i < points.length; i++) {
    if (i < 9) continue;
    let sum = 0;
    for (let j = i - 9; j <= i; j++) sum += points[j].close;
    points[i].ma10 = Math.round((sum / 10) * 10) / 10;
  }

  // 十年段统计
  const decades: LifeKlineDecade[] = [];
  for (let start = 1; start <= span; start += 10) {
    const seg = points.filter((p) => p.age >= start && p.age <= start + 9);
    if (!seg.length) continue;
    decades.push({
      ageStart: start,
      ageEnd: Math.min(start + 9, span),
      avg: Math.round(seg.reduce((s, p) => s + p.close, 0) / seg.length),
    });
  }
  const bestDecade = decades.reduce((a, b) => (b.avg > a.avg ? b : a));
  const worstDecade = decades.reduce((a, b) => (b.avg < a.avg ? b : a));

  const peakPoint = points.reduce((a, b) => (b.close > a.close ? b : a));
  const troughPoint = points.reduce((a, b) => (b.close < a.close ? b : a));

  const currentAgeRaw = currentYear - birthYear + 1;
  const currentAge = currentAgeRaw >= 1 && currentAgeRaw <= span ? currentAgeRaw : null;

  // 当前阶段：近5年收盘均值 vs 前5年
  let currentPhase: LifeKlineSummary['currentPhase'] = '平稳期';
  if (currentAge !== null) {
    const idx = currentAge - 1;
    const recent = points.slice(Math.max(0, idx - 4), idx + 1);
    const prior = points.slice(Math.max(0, idx - 9), Math.max(0, idx - 4));
    if (recent.length && prior.length) {
      const avg = (arr: LifeKlineYearPoint[]) => arr.reduce((s, p) => s + p.close, 0) / arr.length;
      const diff = avg(recent) - avg(prior);
      if (diff > 3) currentPhase = '上升期';
      else if (diff < -3) currentPhase = '调整期';
    }
  }

  const pillarText = (p: { gan: TianGan; zhi: DiZhi } | null) => (p ? `${p.gan}${p.zhi}` : '');
  const fourPillars = [chart.year, chart.month, chart.day, chart.hour]
    .map(pillarText)
    .filter(Boolean)
    .join(' ');

  return {
    points,
    dayuns,
    summary: {
      bestDecade,
      worstDecade,
      peak: { year: peakPoint.year, age: peakPoint.age, score: peakPoint.close, level: levelFromScore(peakPoint.close) },
      trough: { year: troughPoint.year, age: troughPoint.age, score: troughPoint.close, level: levelFromScore(troughPoint.close) },
      currentAge,
      currentYear,
      currentPhase,
    },
    meta: {
      fourPillars,
      dayMaster: bazi.dayMaster,
      zodiac: bazi.zodiac,
      mingGe: {
        geju: mingGe.geju,
        rizhuStrength: mingGe.rizhuStrength,
        yongShen: mingGe.yongShen,
        jiShen: mingGe.jiShen,
      },
      dayunStart: dayunStart.description,
      birthYear,
    },
  };
}

// ---------------------------------------------------------------------------
// 流月K线（P1-B 下钻：某一年的 12 根月K线）
// ---------------------------------------------------------------------------

export interface LiuyueKlinePoint {
  /** 公历月 1-12 */
  month: number;
  ganzhi: string;
  /** 月干对日主的十神 */
  tenGod: TenGod;
  open: number;
  close: number;
  high: number;
  low: number;
  level: LifeKlineLevel;
  comment: string;
}

export interface LiuyueKlineResult {
  year: number;
  age: number;
  yearGanzhi: string;
  /** 当年收盘分（月线围绕此基准展开） */
  yearClose: number;
  points: LiuyueKlinePoint[];
}

/** 某一年的流月K线：月线围绕当年收盘分展开，确定性可复现。年份不在跨度内返回 null。 */
export function computeLiuyueKline(
  input: BaziInput,
  year: number,
  options: LifeKlineOptions = {},
): LiuyueKlineResult | null {
  const result = computeLifeKline(input, options);
  const yearPoint = result.points.find((p) => p.year === year);
  if (!yearPoint) return null;

  const chart = calculateBazi(input).chart;
  const mingGe = analyzeMingGe(chart);
  const chartBranches = [chart.year, chart.month, chart.day, chart.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => p.zhi);
  const flowZhi = yearPoint.ganzhi[1] as DiZhi;

  const months = scoreYearMonths(chartBranches, chart.day.gan, mingGe, flowZhi, year);
  const anchor = yearPoint.close;
  let prev = yearPoint.open;
  const points: LiuyueKlinePoint[] = months.map((m) => {
    const close = Math.round(clamp(anchor + m.delta * 0.9, 12, 98));
    const open = prev;
    const spread = 1 + Math.abs(m.delta) * 0.2;
    const high = Math.round(Math.min(100, Math.max(open, close) + spread));
    const low = Math.round(Math.max(10, Math.min(open, close) - spread));
    const tenGod = getTenGod(chart.day.gan, m.gan);
    prev = close;
    return {
      month: m.month,
      ganzhi: m.ganzhi,
      tenGod,
      open,
      close,
      high,
      low,
      level: levelFromScore(close),
      comment: commentFor(tenGod, close),
    };
  });

  return { year, age: yearPoint.age, yearGanzhi: yearPoint.ganzhi, yearClose: yearPoint.close, points };
}

// ---------------------------------------------------------------------------
// 叙事化人生剧本（P2-A：模板拼接，零 AI 成本）
// ---------------------------------------------------------------------------

/**
 * 把 summary/meta/points 翻译成一段有起承转合的白话叙事（3-4 句）。
 * 边界命盘（低龄/当前年超跨度/无时辰）自动降级，不产生空槽位。
 */
export function buildNarrative(result: LifeKlineResult): string[] {
  const { meta, summary, points, dayuns } = result;
  const out: string[] = [];

  out.push(
    `你是${meta.dayMaster}命，${meta.mingGe.geju}、日主${meta.mingGe.rizhuStrength}，喜${meta.mingGe.yongShen}而忌${meta.mingGe.jiShen}——这是这条K线与生俱来的底色。`,
  );

  const ca = summary.currentAge;
  if (ca === null) {
    out.push(
      `纵观百年，${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁是平均最高的十年，${summary.peak.year} 年（${summary.peak.age}岁）为全程巅峰。`,
    );
    return out;
  }

  const past = points.filter((p) => p.age >= 10 && p.age < ca);
  if (past.length >= 3) {
    const pastPeak = past.reduce((a, b) => (b.close > a.close ? b : a));
    out.push(`回望来路，${pastPeak.year} 年（${pastPeak.age}岁）是你已经走过的一段高点——${pastPeak.comment}。`);
  }

  const curDayun = dayuns.find((d) => d.isCurrent);
  if (curDayun) {
    const left = Math.max(1, curDayun.ageEnd - ca + 1);
    out.push(
      `此刻你行至 ${curDayun.ganZhi} 大运（${curDayun.tenGod}），整体处于${summary.currentPhase}，这步大运还余约 ${left} 年。`,
    );
  } else {
    out.push(`此刻你整体处于${summary.currentPhase}。`);
  }

  const nextRise = points.find((p) => p.age > ca && (p.level === '上佳' || p.level === '极盛'));
  if (nextRise) {
    const bestAhead = summary.bestDecade.ageStart > ca;
    out.push(
      `往前看，下一段明显的上坡从 ${nextRise.year} 年（${nextRise.age}岁）铺开${
        bestAhead ? `，而你的最佳十年（${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd}岁）尚未到来` : '，届时宜乘势而上'
      }。`,
    );
  } else {
    out.push(
      `往前看，${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁是全程平均最高的十年，眼下宜蓄势打底。`,
    );
  }

  return out;
}
