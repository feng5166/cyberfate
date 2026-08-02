import type { BaziChart, Gender } from './types';
import { analyzeLiunian } from './liunian';

/**
 * 关键应期扫描（P1-D）：从未来流年中确定性提取「什么时候」。
 * 命理依据：
 * - 婚缘：配偶星（男财星/女官星）透干，或流年支六合日支（婚姻宫逢合）
 * - 事业：官杀透干（女命七杀主事业，正官归婚缘）
 * - 财运：财星透干（男命正财归婚缘，偏财主财；女命正偏财皆主财）
 * - 谨慎：流年六冲/三刑日支（措辞走提醒-蓄力框架，禁恐吓词）
 */

export type YingqiKind = '婚缘' | '事业' | '财运' | '谨慎';

export interface YingqiItem {
  year: number;
  /** 距今年数（0 = 今年） */
  offset: number;
  ganzhi: string;
  kind: YingqiKind;
  reason: string;
}

export function scanYingqi(
  chart: BaziChart,
  gender: Gender,
  fromYear: number,
  span = 10,
): YingqiItem[] {
  const out: YingqiItem[] = [];

  for (let i = 0; i < span; i++) {
    const year = fromYear + i;
    const flow = analyzeLiunian(chart, year);
    const tg = flow.ganTenGod;
    const push = (kind: YingqiKind, reason: string) =>
      out.push({ year, offset: i, ganzhi: flow.ganzhi, kind, reason });

    // 婚缘：配偶星透干
    if (gender === 'male' && tg === '正财') push('婚缘', '正财透干，妻星当值，情感易有实质进展');
    if (gender === 'female' && tg === '正官') push('婚缘', '正官透干，夫星当值，正缘信号较强');
    // 婚缘：婚姻宫逢合（六合日支）
    const dayHe = flow.interactions.find(
      (it) => it.pillar === 'day' && it.relations.some((r) => r.type === '六合'),
    );
    if (dayHe) push('婚缘', `流年${flow.zhi}合入婚姻宫（日支${dayHe.with}），人际情感易生联结`);

    // 事业
    if (gender === 'male' && (tg === '正官' || tg === '七杀')) {
      push('事业', tg === '正官' ? '官星透干，利晋升与名分落定' : '七杀透干，宜主动出击、竞岗破局');
    }
    if (gender === 'female' && tg === '七杀') push('事业', '七杀透干，魄力当值，宜主动争取话语权');

    // 财运
    if (tg === '偏财') push('财运', '偏财透干，机遇之财偏多，量力把握');
    if (gender === 'female' && tg === '正财') push('财运', '正财透干，正路财稳进，宜踏实谋收成');

    // 谨慎年：冲/刑婚姻宫
    const dayClash = flow.interactions.find(
      (it) => it.pillar === 'day' && it.relations.some((r) => r.type === '六冲' || r.type === '三刑'),
    );
    if (dayClash) {
      const rel = dayClash.relations.find((r) => r.type === '六冲' || r.type === '三刑')!;
      push('谨慎', `流年${rel.type}日支，家宅与情感多变动，宜稳字当头、提前安排`);
    }
  }

  return out;
}
