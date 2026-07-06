import { Lunar, Solar } from 'lunar-javascript';
import type { BaziInput, DayunTimelineItem, DiZhi, TianGan, WuXing } from './types';
import { calculateBazi, getDayunStart, getDayunTimeline } from './calculator';
import { analyzeMingGe, type MingGeAnalysis } from './geju';
import { analyzeLiunian, type FlowAnalysis } from './liunian';
import { describeDayun, type DayunFortune } from './dayunDetail';
import { shenshaNature } from './shensha';
import type { TenGod } from './helpers';
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
}

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

  // 流年干支五行对用神/忌神
  score += scoreWuxing(TIANGAN_WUXING[flow.gan], mingGe, 7, 4);
  score += scoreWuxing(DIZHI_WUXING[flow.zhi], mingGe, 5, 3);

  // 流年天干十神取向 + 地支藏干本气十神（半权重）
  score += TEN_GOD_SCORE[mingGe.rizhuStrength][flow.ganTenGod] ?? 0;
  const mainHidden = flow.zhiHiddenTenGods[0];
  if (mainHidden) {
    score += (TEN_GOD_SCORE[mingGe.rizhuStrength][mainHidden.tenGod] ?? 0) * 0.5;
  }

  // 与命局四柱的刑冲会合害（作用于日支加重）
  const PILLAR_LABEL: Record<string, string> = { year: '年支', month: '月支', day: '日支', hour: '时支' };
  for (const it of flow.interactions) {
    const dayWeight = it.pillar === 'day' ? 1.5 : 1;
    for (const rel of it.relations) {
      const effect = RELATION_EFFECT[rel.type];
      if (!effect) continue;
      score += effect.score * dayWeight;
      volatility += effect.volatility;
      if (effect.score < 0) brief.push(`${rel.type}${PILLAR_LABEL[it.pillar] ?? it.pillar}${it.with}`);
    }
  }

  // 流年支引动三合局/三会方（聚变之年，吉凶皆放大）
  const combos = detectFlowCombos(flow.zhi, ctx.chartBranches, mingGe);
  score += combos.score;
  volatility += combos.volatility;
  brief.push(...combos.brief);

  // 流年与日柱伏吟 / 天克地冲（支冲日支已在上面计过，这里补天干层）
  if (flow.gan === ctx.dayGan && flow.zhi === ctx.dayZhi) {
    score -= 3;
    volatility += 2;
    brief.push('伏吟日柱');
  } else if (
    WUXING_CONTROL[TIANGAN_WUXING[flow.gan]] === TIANGAN_WUXING[ctx.dayGan] &&
    RELATION_EFFECT['六冲'] &&
    flow.interactions.some((it) => it.pillar === 'day' && it.relations.some((r) => r.type === '六冲'))
  ) {
    score -= 3;
    volatility += 2;
    brief.push('天克地冲日柱');
  }

  // 岁运互动（童限期无大运则跳过）
  if (ctx.dayun) {
    if (flow.gan === ctx.dayun.gan && flow.zhi === ctx.dayun.zhi) {
      // 岁运并临：大事之年，顺势放大吉凶
      const direction = ctx.dayunScore + score >= 0 ? 1 : -1;
      score += direction * 4;
      volatility += 4;
      brief.push('岁运并临');
    } else {
      const ganClash =
        WUXING_CONTROL[TIANGAN_WUXING[flow.gan]] === TIANGAN_WUXING[ctx.dayun.gan] ||
        WUXING_CONTROL[TIANGAN_WUXING[ctx.dayun.gan]] === TIANGAN_WUXING[flow.gan];
      const zhiChong = relatesChong(flow.zhi, ctx.dayun.zhi);
      if (ganClash && zhiChong) {
        score -= 6;
        volatility += 4;
        brief.push('天克地冲大运');
      } else if (zhiChong) {
        score -= 3;
        volatility += 2;
        brief.push('冲大运支');
      }
    }
  }

  // 流年引动神煞：吉神小幅加分，凶煞小幅减分（封顶 ±4）
  let shenshaScore = 0;
  for (const s of flow.shensha) {
    const nature = shenshaNature(s.name);
    if (nature === '吉') shenshaScore += 1.5;
    else if (nature === '凶') shenshaScore -= 1.5;
  }
  shenshaScore = Math.max(-4, Math.min(4, shenshaScore));
  score += shenshaScore;
  volatility += Math.min(2, flow.shensha.length * 0.5);

  return { score, volatility, brief };
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

    // 振幅：基础 3 + 刑冲贡献 + 换大运之年波动加大
    const vol = 3 + flowScore.volatility * 1.2 + (isDayunStart ? 3 : 0);
    const high = Math.round(clamp(Math.max(open, close) + 1 + rng() * vol * 0.7, CLAMP_MIN, 100));
    const low = Math.round(clamp(Math.min(open, close) - 1 - rng() * vol * 0.7, 12, CLAMP_MAX));

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
    });

    prevClose = close;
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
