import type { BaziChart, TianGan, DiZhi, PillarKey } from './types';
import { getTenGod, type TenGod } from './helpers';
import { DIZHI_HIDDEN_GAN } from './geju';
import { relateBranches, type PairRelation } from './interactions';
import { getShenshaTargets, analyzeShensha } from './shensha';
import { getYearGanzhi, getMonthGanzhi } from './calculator';

/**
 * 流年 / 流月分析层
 *
 * 在确定性干支之上补一层「作用关系」：
 * - 流年/流月天干对日主的十神
 * - 流年/流月地支藏干对日主的十神
 * - 流年/流月地支与命局四柱地支的刑冲会合害
 *
 * 干支取值仍走 lunar-javascript（经 calculator），保证与排盘一致。
 */

export interface FlowBranchRelation {
  /** 命局中被作用的地支 */
  with: DiZhi;
  /** 该地支所在柱位 */
  pillar: PillarKey;
  /** 命中的两两关系 */
  relations: PairRelation[];
}

/** 流月/流年引动的神煞 */
export interface FlowShensha {
  name: string;
  /** 流月逢=流月地支本身命中神煞靶位；引动=流月与命局带煞柱刑冲会合 */
  type: '流月逢' | '引动';
  detail: string;
}

export interface FlowAnalysis {
  /** 干支，如 "丙午" */
  ganzhi: string;
  gan: TianGan;
  zhi: DiZhi;
  /** 天干对日主的十神 */
  ganTenGod: TenGod;
  /** 地支藏干对日主的十神（本气在前） */
  zhiHiddenTenGods: { gan: TianGan; tenGod: TenGod }[];
  /** 与命局四柱地支的刑冲会合害 */
  interactions: FlowBranchRelation[];
  /** 该流月/流年引动的神煞 */
  shensha: FlowShensha[];
  /** 人读摘要 */
  label: string;
}

const PILLAR_ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];

/** 计算某流月/流年地支引动的神煞 */
function analyzeFlowShensha(chart: BaziChart, zhi: DiZhi): FlowShensha[] {
  const out: FlowShensha[] = [];
  const seen = new Set<string>();
  const push = (s: FlowShensha) => {
    const key = `${s.name}|${s.type}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };

  // A：流月地支本身命中神煞靶位（流月逢桃花/驿马/华盖…）
  for (const t of getShenshaTargets(chart)) {
    if (t.branch === zhi) push({ name: t.name, type: '流月逢', detail: t.source });
  }

  // B：流月地支与命局「带煞之柱」刑冲会合 → 引动该神煞
  for (const s of analyzeShensha(chart)) {
    const rels = relateBranches(zhi, s.branch);
    if (rels.length) {
      push({
        name: s.name,
        type: '引动',
        detail: `流月${zhi}与${s.pillars.join('/')}柱${s.branch}相${rels.map(r => r.type).join('、')}`,
      });
    }
  }

  return out;
}

function analyzeFlow(chart: BaziChart, ganzhi: string, period: string): FlowAnalysis {
  const dayGan = chart.day.gan;
  const gan = ganzhi[0] as TianGan;
  const zhi = ganzhi[1] as DiZhi;

  const ganTenGod = getTenGod(dayGan, gan);

  const zhiHiddenTenGods = (DIZHI_HIDDEN_GAN[zhi] ?? []).map(h => ({
    gan: h,
    tenGod: getTenGod(dayGan, h),
  }));

  const interactions: FlowBranchRelation[] = [];
  for (const key of PILLAR_ORDER) {
    const pillar = chart[key];
    if (!pillar) continue;
    const relations = relateBranches(zhi, pillar.zhi);
    if (relations.length) {
      interactions.push({ with: pillar.zhi, pillar: key, relations });
    }
  }

  const relText = interactions.length
    ? interactions
        .map(it => `${it.pillar}支${it.with}(${it.relations.map(r => r.type).join('、')})`)
        .join('，')
    : '与命局地支无明显刑冲会合';

  const shensha = analyzeFlowShensha(chart, zhi);
  const shenshaText = shensha.length
    ? `；神煞：${shensha.map(s => `${s.name}(${s.type})`).join('、')}`
    : '';

  const label = `${period}${ganzhi}：天干${gan}为${ganTenGod}，地支${zhi}藏${zhiHiddenTenGods
    .map(t => `${t.gan}(${t.tenGod})`)
    .join('')}；${relText}${shenshaText}`;

  return { ganzhi, gan, zhi, ganTenGod, zhiHiddenTenGods, interactions, shensha, label };
}

/**
 * 分析某一流年（公历年）。
 * 取该年 7 月 1 日的年柱干支，避开立春换年边界。
 */
export function analyzeLiunian(chart: BaziChart, year: number): FlowAnalysis {
  const ganzhi = getYearGanzhi(`${year}-07-01`);
  return analyzeFlow(chart, ganzhi, `${year}年流年`);
}

/**
 * 分析某一流月（公历年 + 月）。
 * 取该月 15 日的月柱干支（按节气换月），避开月初节气边界。
 */
export function analyzeLiuyue(chart: BaziChart, year: number, month: number): FlowAnalysis {
  const mm = String(month).padStart(2, '0');
  const ganzhi = getMonthGanzhi(`${year}-${mm}-15`);
  return analyzeFlow(chart, ganzhi, `${year}年${month}月流月`);
}

/** 流月分析（含公历年月） */
export type LiuyueItem = FlowAnalysis & { year: number; month: number };

/**
 * 连续分析从 (startYear, startMonth) 起的 count 个流月（跨年自动进位）。
 * 用于「下半年/未来几个月运势走势」这类需要逐月推演的问答。
 */
export function analyzeLiuyueRange(
  chart: BaziChart,
  startYear: number,
  startMonth: number,
  count: number,
): LiuyueItem[] {
  const out: LiuyueItem[] = [];
  let y = startYear;
  let m = startMonth;
  for (let i = 0; i < Math.max(0, count); i++) {
    out.push({ year: y, month: m, ...analyzeLiuyue(chart, y, m) });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
