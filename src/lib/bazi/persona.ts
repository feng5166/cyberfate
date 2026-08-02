import type { TianGan } from './types';
import type { GejuName } from './geju';
import { TIANGAN_WUXING } from './constants';

/**
 * 命格人设（P0-B）：格局 × 日主 → 分享卡人设文案。
 * 只写正向池——任何命盘都必须是一张「愿意发出去」的卡（PRD-BAZI-V2 §7）。
 */

/** 日主天干意象 */
const DAY_MASTER_IMAGE: Record<TianGan, string> = {
  甲: '参天之木',
  乙: '藤蔓之木',
  丙: '烈日之火',
  丁: '灯烛之火',
  戊: '城墙之土',
  己: '田园之土',
  庚: '刀剑之金',
  辛: '珠玉之金',
  壬: '江河之水',
  癸: '雨露之水',
};

const PERSONA_BY_GEJU: Record<GejuName, { epithet: string; tagline: string }> = {
  正财格: { epithet: '一分耕耘一分收获的务实派', tagline: '踏实积累，财富终随本事而来' },
  偏财格: { epithet: '机会嗅觉灵敏的行动派', tagline: '财路在四方，胆识即资本' },
  正官格: { epithet: '自带规则感的秩序建造者', tagline: '走正道，名与位会如期而至' },
  七杀格: { epithet: '刀刃上开花的人', tagline: '压力越大，越能长出锋芒' },
  正印格: { epithet: '被智慧偏爱的学习者', tagline: '贵人与学识，是一生的靠山' },
  偏印格: { epithet: '独辟蹊径的钻研者', tagline: '冷门之处，藏着你的护城河' },
  食神格: { epithet: '把日子过成作品的才华派', tagline: '温和有才，福气藏在热爱里' },
  伤官格: { epithet: '不肯循规蹈矩的锋芒者', tagline: '才华即武器，表达即出路' },
  建禄格: { epithet: '白手起家的自立者', tagline: '不靠祖荫，靠自己站稳' },
  羊刃格: { epithet: '敢闯敢拼的破局者', tagline: '果决是天赋，克制是修行' },
  杂气格: { epithet: '十八般武艺的均衡者', tagline: '多面手体质，关键时刻都顶得上' },
  从强格: { epithet: '顺势而为的强势者', tagline: '认准方向，就全力以赴' },
  从弱格: { epithet: '借力打力的柔术家', tagline: '懂得顺势，四两拨千斤' },
  综合格: { epithet: '难以被定义的复合体', tagline: '不设限，就是你的格局' },
};

export interface Persona {
  /** 如「辛金 · 七杀格」 */
  title: string;
  /** 如「珠玉之金」 */
  image: string;
  /** 如「刀刃上开花的人」 */
  epithet: string;
  tagline: string;
}

export function personaFor(geju: GejuName, dayGan: TianGan): Persona {
  const p = PERSONA_BY_GEJU[geju] ?? PERSONA_BY_GEJU['综合格'];
  return {
    title: `${dayGan}${TIANGAN_WUXING[dayGan]} · ${geju}`,
    image: DAY_MASTER_IMAGE[dayGan] ?? '',
    epithet: p.epithet,
    tagline: p.tagline,
  };
}
