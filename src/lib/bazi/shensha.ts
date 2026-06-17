import type { BaziChart, TianGan, DiZhi, PillarKey } from './types';
import { TIANGAN_LIST, DIZHI_LIST } from './constants';

/**
 * 神煞（全量首版）
 *
 * 覆盖：
 * - 以日干起：天乙贵人、太极贵人、文昌贵人、禄神、羊刃
 * - 以三合局起（年支 / 日支为主）：桃花(咸池)、驿马、华盖、将星、劫煞
 * - 空亡（旬空，以日柱定旬）
 *
 * 仅基于命盘真实存在的地支判定。规则均附传统取法口诀。
 */

export interface ShenshaHit {
  /** 神煞名 */
  name: string;
  /** 命中的柱位 */
  pillars: PillarKey[];
  /** 命中的地支 */
  branch: DiZhi;
  /** 取法说明 */
  source: string;
}

const PILLAR_ORDER: PillarKey[] = ['year', 'month', 'day', 'hour'];

interface BranchSlot {
  zhi: DiZhi;
  pillar: PillarKey;
}

// —— 以日干起的神煞表 ——

// 天乙贵人：甲戊庚→丑未，乙己→子申，丙丁→亥酉，壬癸→巳卯，辛→午寅
const TIANYI: Record<TianGan, DiZhi[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],
  '辛': ['午', '寅'],
};

// 太极贵人：甲乙→子午，丙丁→卯酉，戊己→辰戌丑未，庚辛→寅亥，壬癸→巳申
const TAIJI: Record<TianGan, DiZhi[]> = {
  '甲': ['子', '午'], '乙': ['子', '午'],
  '丙': ['卯', '酉'], '丁': ['卯', '酉'],
  '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
  '庚': ['寅', '亥'], '辛': ['寅', '亥'],
  '壬': ['巳', '申'], '癸': ['巳', '申'],
};

// 文昌贵人：甲→巳，乙→午，丙→申，丁→酉，戊→申，己→酉，庚→亥，辛→子，壬→寅，癸→卯
const WENCHANG: Record<TianGan, DiZhi> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

// 禄神（临官）：甲→寅，乙→卯，丙戊→巳，丁己→午，庚→申，辛→酉，壬→亥，癸→子
const LUSHEN: Record<TianGan, DiZhi> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

// 羊刃（阳刃，仅阳日干）：甲→卯，丙戊→午，庚→酉，壬→子
const YANGREN: Partial<Record<TianGan, DiZhi>> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
};

// —— 以三合局起的神煞（年支/日支三合局取法）——
// 局：申子辰(水)、寅午戌(火)、巳酉丑(金)、亥卯未(木)。
// 每个局对应一组神煞地支。
interface SanheShensha {
  group: DiZhi[];      // 三合局三支（命主年/日支落入其一即属此局）
  taohua: DiZhi;       // 桃花(咸池)
  yima: DiZhi;         // 驿马
  huagai: DiZhi;       // 华盖
  jiangxing: DiZhi;    // 将星（即旺神）
  jiesha: DiZhi;       // 劫煞
}

const SANHE_SHENSHA: SanheShensha[] = [
  { group: ['申', '子', '辰'], taohua: '酉', yima: '寅', huagai: '辰', jiangxing: '子', jiesha: '巳' },
  { group: ['寅', '午', '戌'], taohua: '卯', yima: '申', huagai: '戌', jiangxing: '午', jiesha: '亥' },
  { group: ['巳', '酉', '丑'], taohua: '午', yima: '亥', huagai: '丑', jiangxing: '酉', jiesha: '寅' },
  { group: ['亥', '卯', '未'], taohua: '子', yima: '巳', huagai: '未', jiangxing: '卯', jiesha: '申' },
];

function collectBranches(chart: BaziChart): BranchSlot[] {
  const slots: BranchSlot[] = [];
  for (const key of PILLAR_ORDER) {
    const pillar = chart[key];
    if (pillar) slots.push({ zhi: pillar.zhi, pillar: key });
  }
  return slots;
}

/** 在命盘中找出落在 targets 集合里的全部柱位 */
function findPillars(slots: BranchSlot[], targets: DiZhi[]): { branch: DiZhi; pillars: PillarKey[] }[] {
  const out: { branch: DiZhi; pillars: PillarKey[] }[] = [];
  const set = new Set(targets);
  const byBranch = new Map<DiZhi, PillarKey[]>();
  for (const s of slots) {
    if (!set.has(s.zhi)) continue;
    const list = byBranch.get(s.zhi) ?? [];
    list.push(s.pillar);
    byBranch.set(s.zhi, list);
  }
  for (const [branch, pillars] of byBranch) out.push({ branch, pillars });
  return out;
}

/** 计算日柱旬空（空亡）的两个地支 */
function getKongWang(dayGan: TianGan, dayZhi: DiZhi): DiZhi[] {
  const ganIdx = TIANGAN_LIST.indexOf(dayGan);
  const zhiIdx = DIZHI_LIST.indexOf(dayZhi);
  if (ganIdx < 0 || zhiIdx < 0) return [];
  // 旬首地支（甲所在地支）= (日支 - 日干) 回退至甲
  const xunShouZhi = (zhiIdx - ganIdx + 12) % 12;
  const kong1 = (xunShouZhi + 10) % 12;
  const kong2 = (xunShouZhi + 11) % 12;
  return [DIZHI_LIST[kong1], DIZHI_LIST[kong2]];
}

/**
 * 分析命盘神煞。
 * @returns 命中的神煞列表（去重后）
 */
export function analyzeShensha(chart: BaziChart): ShenshaHit[] {
  const slots = collectBranches(chart);
  const dayGan = chart.day.gan;
  const dayZhi = chart.day.zhi;
  const yearZhi = chart.year.zhi;
  const hits: ShenshaHit[] = [];

  const pushHits = (
    name: string,
    targets: DiZhi[],
    source: string,
  ) => {
    for (const { branch, pillars } of findPillars(slots, targets)) {
      hits.push({ name, branch, pillars, source });
    }
  };

  // 以日干起
  pushHits('天乙贵人', TIANYI[dayGan] ?? [], `日干${dayGan}见${(TIANYI[dayGan] ?? []).join('')}`);
  pushHits('太极贵人', TAIJI[dayGan] ?? [], `日干${dayGan}见${(TAIJI[dayGan] ?? []).join('')}`);
  pushHits('文昌贵人', WENCHANG[dayGan] ? [WENCHANG[dayGan]] : [], `日干${dayGan}见${WENCHANG[dayGan]}`);
  pushHits('禄神', LUSHEN[dayGan] ? [LUSHEN[dayGan]] : [], `日干${dayGan}临官在${LUSHEN[dayGan]}`);
  if (YANGREN[dayGan]) {
    pushHits('羊刃', [YANGREN[dayGan] as DiZhi], `阳日干${dayGan}刃在${YANGREN[dayGan]}`);
  }

  // 以三合局起（年支、日支各取一次，去重）
  for (const ref of [{ zhi: yearZhi, label: '年支' }, { zhi: dayZhi, label: '日支' }]) {
    const sh = SANHE_SHENSHA.find(s => s.group.includes(ref.zhi));
    if (!sh) continue;
    pushHits('桃花', [sh.taohua], `${ref.label}${ref.zhi}属${sh.group.join('')}局，桃花在${sh.taohua}`);
    pushHits('驿马', [sh.yima], `${ref.label}${ref.zhi}属${sh.group.join('')}局，驿马在${sh.yima}`);
    pushHits('华盖', [sh.huagai], `${ref.label}${ref.zhi}属${sh.group.join('')}局，华盖在${sh.huagai}`);
    pushHits('将星', [sh.jiangxing], `${ref.label}${ref.zhi}属${sh.group.join('')}局，将星在${sh.jiangxing}`);
    pushHits('劫煞', [sh.jiesha], `${ref.label}${ref.zhi}属${sh.group.join('')}局，劫煞在${sh.jiesha}`);
  }

  // 空亡（以日柱定旬）
  pushHits('空亡', getKongWang(dayGan, dayZhi), `日柱${dayGan}${dayZhi}旬空`);

  return dedupe(hits);
}

/** 同名 + 同柱位 + 同地支视为重复（年支/日支取法可能重叠） */
function dedupe(hits: ShenshaHit[]): ShenshaHit[] {
  const seen = new Set<string>();
  const out: ShenshaHit[] = [];
  for (const h of hits) {
    const key = `${h.name}|${h.branch}|${[...h.pillars].sort().join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}
