import type { BaziChart, Gender, TianGan } from './types';
import { getTenGod } from './helpers';
import { DIZHI_HIDDEN_GAN, analyzeMingGe } from './geju';
import {
  getDayGanzhi,
  getYearGanzhi,
  getLunarDate,
  getCurrentDayun,
  getDayunTimeline,
} from './calculator';
import { describeDayun } from './dayunDetail';
import { analyzeInteractions } from './interactions';
import { analyzeShensha, shenshaNature } from './shensha';
import { analyzeLiunian, analyzeLiuyue, analyzeLiuyueRange } from './liunian';

/**
 * 八字「真实工具」流水线
 *
 * 把本地确定性命理算法编排成一串有序步骤，每步都产出**真实计算结果**。
 * 供 AI 八字问答接口逐步推送（替代前端写死的假思考动画），
 * 并把结构化结果注入 prompt，让模型基于事实而非臆测作答。
 */

export interface ToolStepResult {
  /** 步骤机器名 */
  name: string;
  /** 人读一行摘要（前端步骤行展示） */
  label: string;
  /** 结构化结果（前端可展开 + 注入 prompt） */
  data: unknown;
}

export interface ToolchainInput {
  chart: BaziChart;
  birth: {
    birthDate: string;
    gender: Gender;
    birthHourNum?: number;
    birthMinute?: number;
  };
  /** 北京时间当天 YYYY-MM-DD（由调用方传入，避免服务端时区误差） */
  today: string;
  /** 流月推算的月数：1=仅当月（默认）；>1=逐月铺开（用于运势走势类问答） */
  liuyueMonths?: number;
  /** 流月推算的起点（公历年月）；缺省时从 today 当月起 */
  liuyueStart?: { year: number; month: number };
}

type StepFn = (ctx: ToolchainInput) => ToolStepResult | ToolStepResult[];

/** 步骤 1：查询今天日期与干支 */
function queryDate({ today }: ToolchainInput): ToolStepResult {
  const dayGanzhi = getDayGanzhi(today);
  const yearGanzhi = getYearGanzhi(today);
  const lunar = getLunarDate(today);
  return {
    name: 'queryDate',
    label: `今日 ${today}（${lunar}），日干支 ${dayGanzhi}`,
    data: { today, lunar, dayGanzhi, yearGanzhi },
  };
}

/** 步骤 2：分析四柱十神 */
function analyzeTenGods({ chart }: ToolchainInput): ToolStepResult {
  const dayGan = chart.day.gan;
  const stemGods = {
    year: getTenGod(dayGan, chart.year.gan),
    month: getTenGod(dayGan, chart.month.gan),
    day: '日主' as const,
    hour: chart.hour ? getTenGod(dayGan, chart.hour.gan) : null,
  };
  const branchMainGods = (['year', 'month', 'day', 'hour'] as const)
    .map(key => {
      const pillar = chart[key];
      if (!pillar) return null;
      const main = (DIZHI_HIDDEN_GAN[pillar.zhi] ?? [])[0] as TianGan | undefined;
      return main ? { pillar: key, zhi: pillar.zhi, hiddenMain: main, tenGod: getTenGod(dayGan, main) } : null;
    })
    .filter(Boolean);

  return {
    name: 'analyzeTenGods',
    label: `日主 ${dayGan}${chart.day.ganWuxing}，天干十神：年${stemGods.year}·月${stemGods.month}·时${stemGods.hour ?? '无'}`,
    data: { dayMaster: `${dayGan}${chart.day.ganWuxing}`, stemGods, branchMainGods },
  };
}

/** 步骤 3：分析刑冲会合 */
function analyzeInteractionsStep({ chart }: ToolchainInput): ToolStepResult {
  const interactions = analyzeInteractions(chart);
  const summary = interactions.length
    ? interactions.map(i => `${i.branches.join('')}${i.type}`).join('、')
    : '四柱地支无明显刑冲会合';
  return {
    name: 'analyzeInteractions',
    label: `刑冲会合：${summary}`,
    data: { interactions },
  };
}

/** 步骤 4：查询神煞（按吉凶分类计数） */
function queryShensha({ chart }: ToolchainInput): ToolStepResult {
  const shensha = analyzeShensha(chart);
  // 按神煞名聚合命中次数（同名多柱计多次，体现"贵人满盘/某煞重"）
  const counts = new Map<string, number>();
  for (const s of shensha) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);

  const ji: string[] = [];
  const xiong: string[] = [];
  const zhong: string[] = [];
  for (const [name, n] of counts) {
    const tag = n > 1 ? `${name}×${n}` : name;
    const nature = shenshaNature(name);
    if (nature === '吉') ji.push(tag);
    else if (nature === '凶') xiong.push(tag);
    else zhong.push(tag);
  }
  const jiCount = ji.reduce((s, t) => s + (Number(t.split('×')[1]) || 1), 0);
  const xiongCount = xiong.reduce((s, t) => s + (Number(t.split('×')[1]) || 1), 0);

  const parts: string[] = [];
  if (ji.length) parts.push(`吉神(${jiCount})：${ji.join('、')}`);
  if (zhong.length) parts.push(`中性：${zhong.join('、')}`);
  if (xiong.length) parts.push(`凶煞(${xiongCount})：${xiong.join('、')}`);

  return {
    name: 'queryShensha',
    label: parts.length ? `神煞 ${parts.join('；')}` : '未见常用神煞',
    data: { shensha, ji, zhong, xiong, jiCount, xiongCount },
  };
}

/** 步骤 5：查询大运（当前 + 时间轴） */
function queryDayun({ chart, birth }: ToolchainInput): ToolStepResult {
  const mingGe = analyzeMingGe(chart);
  const current = getCurrentDayun(birth.birthDate, birth.gender, birth.birthHourNum, birth.birthMinute);
  const timeline = getDayunTimeline(birth.birthDate, birth.gender, birth.birthHourNum, birth.birthMinute);
  const detail = describeDayun(
    { gan: current.gan, zhi: current.zhi, wuxing: current.wuxing },
    chart.day.gan,
    mingGe.yongShen,
    mingGe.jiShen,
  );
  const range = current.beforeFirstDayun
    ? `尚未起运（童限期，约 ${current.startYear} 年起运）`
    : `${current.startYear}–${current.endYear} 年`;
  return {
    name: 'queryDayun',
    label: `当前大运 ${current.gan}${current.zhi}（${detail.ganShiShen}·${detail.fortune}），${range}`,
    data: { current, detail, timeline, yongShen: mingGe.yongShen, jiShen: mingGe.jiShen },
  };
}

/** 步骤 6：分析流年 */
function analyzeLiunianStep({ chart, today }: ToolchainInput): ToolStepResult {
  const year = Number(today.slice(0, 4));
  const flow = analyzeLiunian(chart, year);
  return {
    name: 'analyzeLiunian',
    label: flow.label,
    data: { year, flow },
  };
}

/** 步骤 7：分析流月（默认仅当月；liuyueMonths>1 时从 liuyueStart/当月起逐月铺开） */
function analyzeLiuyueStep({ chart, today, liuyueMonths, liuyueStart }: ToolchainInput): ToolStepResult | ToolStepResult[] {
  const year = liuyueStart?.year ?? Number(today.slice(0, 4));
  const month = liuyueStart?.month ?? Number(today.slice(5, 7));
  const count = Math.max(1, Math.min(12, Math.floor(liuyueMonths ?? 1)));

  if (count === 1) {
    const flow = analyzeLiuyue(chart, year, month);
    return { name: 'analyzeLiuyue', label: flow.label, data: { year, month, flow } };
  }

  return analyzeLiuyueRange(chart, year, month, count).map(item => ({
    name: 'analyzeLiuyue',
    label: item.label,
    data: { year: item.year, month: item.month, flow: item },
  }));
}

/** 固定顺序的工具链（八字解读的标准推算范式） */
const STEPS: StepFn[] = [
  queryDate,
  analyzeTenGods,
  analyzeInteractionsStep,
  queryShensha,
  queryDayun,
  analyzeLiunianStep,
  analyzeLiuyueStep,
];

/**
 * 顺序执行整条工具链，返回每步的真实结果。
 * 单步失败不影响其余步骤（产出降级占位，便于排查）。
 */
export function runBaziToolchain(input: ToolchainInput): ToolStepResult[] {
  const out: ToolStepResult[] = [];
  for (const step of STEPS) {
    try {
      const result = step(input);
      if (Array.isArray(result)) out.push(...result);
      else out.push(result);
    } catch (err) {
      out.push({
        name: step.name || 'unknown',
        label: '该步计算暂不可用',
        data: { error: err instanceof Error ? err.message : String(err) },
      });
    }
  }
  return out;
}

/** 把工具链结果汇总成注入 prompt 的「命理推算事实」文本 */
export function toolchainToPromptFacts(steps: ToolStepResult[]): string {
  return steps
    .map((s, i) => `${i + 1}. ${s.label}`)
    .join('\n');
}
