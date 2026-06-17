import type { BaziChart, DiZhi, WuXing, PillarKey } from './types';
import { DIZHI_LIST } from './constants';

/**
 * 地支刑冲会合害（全量）
 *
 * 覆盖：六冲 / 六合 / 三合局 / 半三合 / 三会方 / 三刑 / 自刑 / 六害。
 * 仅基于命盘中「真实存在」的地支判定（缺时柱则只用三柱）。
 * 规则均附传统口诀来源，便于核对与单测。
 */

export type InteractionType =
  | '六冲'
  | '六合'
  | '三合'
  | '半三合'
  | '三会'
  | '三刑'
  | '自刑'
  | '六害';

export interface BranchInteraction {
  type: InteractionType;
  /** 参与的地支（按命盘出现顺序去重前的实际地支） */
  branches: DiZhi[];
  /** 参与的柱位（年/月/日/时） */
  pillars: PillarKey[];
  /** 合/会化出的五行（仅 六合/三合/半三合/三会 有） */
  huaWuxing?: WuXing;
  /** 说明，如刑的类别 */
  note?: string;
}

interface BranchSlot {
  zhi: DiZhi;
  pillar: PillarKey;
}

// —— 关系表 ——

// 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
const LIU_CHONG: [DiZhi, DiZhi][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// 六合：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火
const LIU_HE: { pair: [DiZhi, DiZhi]; hua: WuXing }[] = [
  { pair: ['子', '丑'], hua: '土' },
  { pair: ['寅', '亥'], hua: '木' },
  { pair: ['卯', '戌'], hua: '火' },
  { pair: ['辰', '酉'], hua: '金' },
  { pair: ['巳', '申'], hua: '水' },
  { pair: ['午', '未'], hua: '火' },
];

// 三合局：申子辰水、亥卯未木、寅午戌火、巳酉丑金。旺神为 子/卯/午/酉。
const SAN_HE: { branches: [DiZhi, DiZhi, DiZhi]; wang: DiZhi; hua: WuXing }[] = [
  { branches: ['申', '子', '辰'], wang: '子', hua: '水' },
  { branches: ['亥', '卯', '未'], wang: '卯', hua: '木' },
  { branches: ['寅', '午', '戌'], wang: '午', hua: '火' },
  { branches: ['巳', '酉', '丑'], wang: '酉', hua: '金' },
];

// 三会方：寅卯辰会木（东方）、巳午未会火（南方）、申酉戌会金（西方）、亥子丑会水（北方）
const SAN_HUI: { branches: [DiZhi, DiZhi, DiZhi]; hua: WuXing }[] = [
  { branches: ['寅', '卯', '辰'], hua: '木' },
  { branches: ['巳', '午', '未'], hua: '火' },
  { branches: ['申', '酉', '戌'], hua: '金' },
  { branches: ['亥', '子', '丑'], hua: '水' },
];

// 三刑（成组）：寅巳申（无恩之刑）、丑戌未（恃势之刑）
const SAN_XING_GROUPS: { branches: [DiZhi, DiZhi, DiZhi]; note: string }[] = [
  { branches: ['寅', '巳', '申'], note: '无恩之刑' },
  { branches: ['丑', '戌', '未'], note: '恃势之刑' },
];

// 三刑（成对，含部分刑）：
// 寅巳、巳申（无恩之刑的两两）、丑戌、戌未（恃势之刑的两两）、子卯（无礼之刑）
// 注：寅申、丑未本身已是六冲，归冲不归刑。
const XING_PAIRS: { pair: [DiZhi, DiZhi]; note: string }[] = [
  { pair: ['寅', '巳'], note: '无恩之刑' },
  { pair: ['巳', '申'], note: '无恩之刑' },
  { pair: ['丑', '戌'], note: '恃势之刑' },
  { pair: ['戌', '未'], note: '恃势之刑' },
  { pair: ['子', '卯'], note: '无礼之刑' },
];

// 自刑：辰辰、午午、酉酉、亥亥
const ZI_XING: DiZhi[] = ['辰', '午', '酉', '亥'];

// 六害：子未、丑午、寅巳、卯辰、申亥、酉戌
const LIU_HAI: [DiZhi, DiZhi][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

const PILLAR_ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];

/** 规范化一对地支为有序 key，便于查表（按地支顺序排序） */
function pairKey(a: DiZhi, b: DiZhi): string {
  const ia = DIZHI_LIST.indexOf(a);
  const ib = DIZHI_LIST.indexOf(b);
  return ia <= ib ? `${a}${b}` : `${b}${a}`;
}

const CHONG_SET = new Set(LIU_CHONG.map(([a, b]) => pairKey(a, b)));
const HE_MAP = new Map(LIU_HE.map(({ pair, hua }) => [pairKey(pair[0], pair[1]), hua]));
const HAI_SET = new Set(LIU_HAI.map(([a, b]) => pairKey(a, b)));
const XING_PAIR_MAP = new Map(XING_PAIRS.map(({ pair, note }) => [pairKey(pair[0], pair[1]), note]));

/** 两两地支关系（不含三支组合），供流年/流月/大运对命局逐支判定复用 */
export type PairRelation = Pick<BranchInteraction, 'type' | 'huaWuxing' | 'note'>;

/**
 * 判定两个地支之间的全部两两关系：六冲/六合/六害/刑(对)/自刑。
 * 三合/三会/三刑全等三支组合不在此处。
 */
export function relateBranches(a: DiZhi, b: DiZhi): PairRelation[] {
  const out: PairRelation[] = [];
  if (a === b) {
    if (ZI_XING.includes(a)) out.push({ type: '自刑', note: `${a}${a}自刑` });
    return out;
  }
  const key = pairKey(a, b);
  if (CHONG_SET.has(key)) out.push({ type: '六冲' });
  if (HE_MAP.has(key)) out.push({ type: '六合', huaWuxing: HE_MAP.get(key) });
  if (HAI_SET.has(key)) out.push({ type: '六害' });
  if (XING_PAIR_MAP.has(key)) out.push({ type: '三刑', note: XING_PAIR_MAP.get(key) });
  return out;
}

/** 收集命盘中真实存在的地支（含柱位） */
function collectBranches(chart: BaziChart): BranchSlot[] {
  const slots: BranchSlot[] = [];
  for (const key of PILLAR_ORDER) {
    const pillar = chart[key];
    if (pillar) slots.push({ zhi: pillar.zhi, pillar: key });
  }
  return slots;
}

/**
 * 分析命盘地支的全部刑冲会合害关系。
 * @returns 命中的关系列表（无命中则为空数组）
 */
export function analyzeInteractions(chart: BaziChart): BranchInteraction[] {
  const slots = collectBranches(chart);
  const results: BranchInteraction[] = [];

  // —— 两两关系：六冲 / 六合 / 六害 / 刑对 / 自刑 ——
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      const branches: DiZhi[] = [a.zhi, b.zhi];
      const pillars: PillarKey[] = [a.pillar, b.pillar];

      for (const rel of relateBranches(a.zhi, b.zhi)) {
        results.push({ ...rel, branches, pillars });
      }
    }
  }

  // —— 三会方（需三支齐全）——
  for (const { branches, hua } of SAN_HUI) {
    const match = matchTriple(slots, branches);
    if (match) {
      results.push({ type: '三会', branches: match.branches, pillars: match.pillars, huaWuxing: hua });
    }
  }

  // —— 三合局 / 半三合 ——
  for (const { branches, wang, hua } of SAN_HE) {
    const full = matchTriple(slots, branches);
    if (full) {
      results.push({ type: '三合', branches: full.branches, pillars: full.pillars, huaWuxing: hua });
      continue; // 全合优先，不再计半合
    }
    // 半三合：旺神 + (生 或 墓) 任一
    const others = branches.filter(z => z !== wang);
    for (const other of others) {
      const match = matchPairAcrossSlots(slots, wang, other);
      if (match) {
        results.push({
          type: '半三合',
          branches: match.branches,
          pillars: match.pillars,
          huaWuxing: hua,
        });
      }
    }
  }

  // —— 三刑成组（寅巳申 / 丑戌未，三支齐全则升级标注）——
  for (const { branches, note } of SAN_XING_GROUPS) {
    const match = matchTriple(slots, branches);
    if (match) {
      results.push({ type: '三刑', branches: match.branches, pillars: match.pillars, note: `${note}(三刑全)` });
    }
  }

  return results;
}

/** 在 slots 中匹配一组三支是否全部存在，返回对应柱位（每支取首个匹配的不同柱） */
function matchTriple(
  slots: BranchSlot[],
  triple: [DiZhi, DiZhi, DiZhi],
): { branches: DiZhi[]; pillars: PillarKey[] } | null {
  const used = new Set<number>();
  const branches: DiZhi[] = [];
  const pillars: PillarKey[] = [];
  for (const target of triple) {
    const idx = slots.findIndex((s, k) => !used.has(k) && s.zhi === target);
    if (idx === -1) return null;
    used.add(idx);
    branches.push(slots[idx].zhi);
    pillars.push(slots[idx].pillar);
  }
  return { branches, pillars };
}

/** 在 slots 中匹配两个不同地支各取一柱（柱位需不同） */
function matchPairAcrossSlots(
  slots: BranchSlot[],
  a: DiZhi,
  b: DiZhi,
): { branches: DiZhi[]; pillars: PillarKey[] } | null {
  const ai = slots.findIndex(s => s.zhi === a);
  if (ai === -1) return null;
  const bi = slots.findIndex((s, k) => k !== ai && s.zhi === b);
  if (bi === -1) return null;
  return {
    branches: [slots[ai].zhi, slots[bi].zhi],
    pillars: [slots[ai].pillar, slots[bi].pillar],
  };
}
