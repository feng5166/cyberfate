import type { DayunTimelineItem, TianGan, WuXing } from './types';
import type { GejuName, RizhuStrength } from './geju';
import type { FlowAnalysis } from './liunian';
import { describeDayun } from './dayunDetail';
import { TIANGAN_WUXING } from './constants';

/**
 * 命盘速读（P0-A）：零 AI 成本的三句话合成断语。
 * 模拟命理师开口第一段话的顺序：盘面定性 → 当下处境 → 今年流年。
 * 全部字段来自排盘接口现成数据，纯模板拼接，确定性。
 */

const STRENGTH_WORD: Record<RizhuStrength, string> = {
  偏强: '身强',
  中和: '中和',
  偏弱: '身弱',
};

/** 格局一句白话定性（正向池，规范见 PRD-BAZI-V2 §7） */
const GEJU_FLAVOR: Record<GejuName, string> = {
  正财格: '务实聚财的格局',
  偏财格: '机遇偏多、敢想敢干的格局',
  正官格: '规矩中见贵气的格局',
  七杀格: '压力与魄力并存的格局',
  正印格: '学识与贵人加持的格局',
  偏印格: '善走冷门、以专取胜的格局',
  食神格: '才华与福气兼得的格局',
  伤官格: '锋芒外露、以才服人的格局',
  建禄格: '白手自立、越干越稳的格局',
  羊刃格: '果决敢拼、宜攻不宜守的格局',
  杂气格: '多面均衡、后劲绵长的格局',
  从强格: '气势一边倒、顺势则昌的格局',
  从弱格: '善于借力、以柔克刚的格局',
  综合格: '不拘一格、可塑性强的格局',
};

/** 流年天干十神 → 当年主基调一句话 */
const YEAR_TEN_GOD_TONE: Record<string, string> = {
  正官: '利名分与晋升，宜按规矩争取',
  七杀: '压力与机会并至，宜主动应对',
  正印: '利学习进修与贵人扶持',
  偏印: '宜钻研沉淀，防思虑过度',
  正财: '正财稳进，宜踏实谋收成',
  偏财: '机遇财偏多，量力而行',
  食神: '才华得展，衣食顺遂',
  伤官: '宜输出表达，慎言防口舌',
  比肩: '朋友助力多，合作先讲清',
  劫财: '人情往来耗财，理财宜保守',
};

export interface QuickReadInput {
  dayGan: TianGan;
  mingGe: {
    geju: GejuName;
    rizhuStrength: RizhuStrength;
    yongShen: WuXing;
    jiShen: WuXing;
  };
  /** 终身大运表（八字直输模式为空数组） */
  dayunTimeline: DayunTimelineItem[];
  /** 当年流年分析（可空） */
  liunian: FlowAnalysis | null;
  currentYear: number;
}

/**
 * 生成 2-3 句速读断语（八字直输/无流年时自动降级，不出空槽）。
 */
export function buildQuickRead(input: QuickReadInput): string[] {
  const { dayGan, mingGe, dayunTimeline, liunian, currentYear } = input;
  const lines: string[] = [];

  // ① 盘面定性
  lines.push(
    `${dayGan}${TIANGAN_WUXING[dayGan]}日主，${mingGe.geju}、${STRENGTH_WORD[mingGe.rizhuStrength]}——${
      GEJU_FLAVOR[mingGe.geju] ?? '底子扎实的格局'
    }。喜${mingGe.yongShen}忌${mingGe.jiShen}，宜多亲近${mingGe.yongShen}属性的人、事与方向。`,
  );

  // ② 当下处境（当前大运）
  const current = dayunTimeline.find((t) => t.isCurrent);
  if (current) {
    const detail = describeDayun(current, dayGan, mingGe.yongShen, mingGe.jiShen);
    const tone =
      detail.fortune === '吉'
        ? '大运助力，这十年宜积极进取'
        : detail.fortune === '凶'
          ? '大运承压，这十年宜稳扎稳打、蓄力为先'
          : '大运平顺，这十年宜按部就班、稳中求进';
    lines.push(
      `当前行 ${detail.ganZhi} 大运（${current.ageStart}-${current.ageEnd}岁，${detail.ganShiShen}），${tone}。`,
    );
  }

  // ③ 今年流年
  if (liunian) {
    const tone = YEAR_TEN_GOD_TONE[liunian.ganTenGod] ?? '流年平缓，稳中有进';
    const dayHit = liunian.interactions.find(
      (it) => it.pillar === 'day' && it.relations.some((r) => r.type === '六冲' || r.type === '三刑'),
    );
    const extra = dayHit ? '；且流年触动婚姻宫（日支），家宅与情感事宜多上心' : '';
    lines.push(`今年 ${currentYear}（${liunian.ganzhi}）流年${liunian.ganTenGod}当值，${tone}${extra}。`);
  }

  return lines;
}
