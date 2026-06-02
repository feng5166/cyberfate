import type { BaziChart, TianGan, DiZhi } from '@/lib/bazi/types';
import { getTenGod, type TenGod } from '@/lib/bazi/helpers';
import { DIZHI_HIDDEN_GAN } from '@/lib/bazi/geju';

export const SHISHEN_NAMES: TenGod[] = [
  '比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀', '正印', '偏印',
];

export const SHISHEN_INFO: Record<TenGod, { represent: string; trait: string }> = {
  比肩: {
    represent: '兄弟、朋友、同辈、同事',
    trait: '独立自主，意志坚定，重义气，但易固执己见，竞争心强',
  },
  劫财: {
    represent: '兄弟、对手、合作伙伴',
    trait: '热情豪爽，勇于争取，但易冲动破财，需注意人际边界',
  },
  食神: {
    represent: '才艺、口福、子女（女命）、晚辈',
    trait: '温和含蓄，富艺术天赋，享受生活，乐观随和',
  },
  伤官: {
    represent: '才华、表达、子女（女命）、创意',
    trait: '聪明灵秀，表现欲强，叛逆有个性，富创造力但易锋芒外露',
  },
  正财: {
    represent: '稳定收入、妻子（男命）、勤劳所得',
    trait: '务实勤勉，节俭谨慎，重视家庭责任，理财稳健',
  },
  偏财: {
    represent: '横财、机会、父亲、外财',
    trait: '慷慨豁达，善交际，应变力强，理财灵活但易投机',
  },
  正官: {
    represent: '丈夫（女命）、官职、规矩、权威',
    trait: '正直守信，自律有责任感，重视名誉与规则',
  },
  七杀: {
    represent: '压力、挑战、改革、偏夫（女命）',
    trait: '果敢决断，行动力强，有领导才能，但易急躁冲动',
  },
  正印: {
    represent: '母亲、贵人、学问、庇护',
    trait: '仁厚善良，重视学习与名声，福气深厚，依赖性较强',
  },
  偏印: {
    represent: '继母、宗教、玄学、偏门技艺',
    trait: '思维独特，富直觉力，善偏门学问，但易孤僻多思',
  },
  日主: {
    represent: '自身',
    trait: '命主本人',
  },
  未知: {
    represent: '—',
    trait: '—',
  },
};

export type PillarKey = 'year' | 'month' | 'day' | 'hour';

export const PILLAR_STAGE: Record<PillarKey, { label: string; stage: string }> = {
  year: { label: '年柱', stage: '童年到青年' },
  month: { label: '月柱', stage: '成年基础运' },
  day: { label: '日柱', stage: '自身性格' },
  hour: { label: '时柱', stage: '中年到晚年' },
};

export interface HiddenGanItem {
  gan: TianGan;
  god: TenGod;
  ratio: number;
  position: 'main' | 'middle' | 'rest';
  represent: string;
  trait: string;
}

export interface PillarShishen {
  ganGod: TenGod;
  ganRepresent: string;
  ganTrait: string;
  hidden: HiddenGanItem[];
}

export type SideShishen = Record<PillarKey, PillarShishen | null>;

const RATIO_BY_LENGTH: Record<number, number[]> = {
  1: [100],
  2: [70, 30],
  3: [60, 25, 15],
};

const POSITION_BY_INDEX: Array<HiddenGanItem['position']> = ['main', 'middle', 'rest'];

function buildHidden(dayGan: TianGan, zhi: DiZhi): HiddenGanItem[] {
  const list = DIZHI_HIDDEN_GAN[zhi] || [];
  const ratios = RATIO_BY_LENGTH[list.length] || RATIO_BY_LENGTH[3];
  return list.map((gan, idx) => {
    const god = getTenGod(dayGan, gan);
    const info = SHISHEN_INFO[god] || SHISHEN_INFO.未知;
    return {
      gan,
      god,
      ratio: ratios[idx] ?? 10,
      position: POSITION_BY_INDEX[idx] || 'rest',
      represent: info.represent,
      trait: info.trait,
    };
  });
}

export function calcSideShishen(chart: BaziChart): SideShishen {
  const dayGan = chart.day.gan;
  const buildPillar = (pillar: BaziChart['year'] | null): PillarShishen | null => {
    if (!pillar) return null;
    const ganGod = getTenGod(dayGan, pillar.gan);
    const info = SHISHEN_INFO[ganGod] || SHISHEN_INFO.未知;
    return {
      ganGod,
      ganRepresent: info.represent,
      ganTrait: info.trait,
      hidden: buildHidden(dayGan, pillar.zhi),
    };
  };
  return {
    year: buildPillar(chart.year),
    month: buildPillar(chart.month),
    day: buildPillar(chart.day),
    hour: buildPillar(chart.hour),
  };
}

export interface ShishenSummary {
  counts: Record<string, number>;
  text: string;
}

export function buildShishenSummary(side: SideShishen): ShishenSummary {
  const counts: Record<string, number> = {};
  (Object.keys(side) as PillarKey[]).forEach((key) => {
    const p = side[key];
    if (!p) return;
    if (p.ganGod !== '日主' && p.ganGod !== '未知') {
      counts[p.ganGod] = (counts[p.ganGod] || 0) + 1;
    }
    p.hidden.forEach((h) => {
      if (h.god !== '日主' && h.god !== '未知') {
        counts[h.god] = (counts[h.god] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominantList = sorted.slice(0, 3).map(([n, c]) => `${n}(${c}次)`);
  const dominant = dominantList.join('、');
  const top = sorted[0]?.[0] as TenGod | undefined;
  const topTrait = top ? SHISHEN_INFO[top]?.trait : '';

  const text = dominant
    ? `日主所见十神分布：${dominant}。${top ? `主导十神为${top}，${topTrait}。` : ''}人生各阶段以年柱（童年青年）、月柱（成年基础）、日柱（自身性格）、时柱（中晚年）依次展开，通过四柱十神可见性格走向与运势重心。`
    : '十神分布平和，命局结构稳健。';

  return { counts, text };
}
