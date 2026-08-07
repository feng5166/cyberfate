// 紫微命盘速读 + 四化叙事（PRD-ZIWEI-V2 P0-A / P1-A）
//
// 纯模板合成、零 AI 成本。命理师开口顺序：①命宫定性 ②身宫与命主身主 ③当前大限。
// 全部文案走正向池；化忌一律「功课-成长」框架（规范同 K线/八字 PRD）。

import type { TianGan, SihuaType } from './types';
import type { ZiweiPalaceLike, ZiweiDayunItem, ZiweiLiunianSihua } from './dayun';
import { calcNatalSihua } from './dayun';

/** 14 主星一句白话（正向池） */
export const MAJOR_STAR_FLAVOR: Record<string, string> = {
  紫微: '帝星坐镇，自带定盘星气场',
  天机: '智多星，谋略与应变见长',
  太阳: '光热外放，天生能带动众人',
  武曲: '行动派财星，刚毅务实',
  天同: '福星高照，松弛感与好人缘',
  廉贞: '张力之星，原则与魅力并存',
  天府: '库星稳重，天生的资源整合者',
  太阴: '静水深流，细腻与积蓄的高手',
  贪狼: '多才多艺，欲望即燃料',
  巨门: '以口才立身，深究善辩',
  天相: '印星可靠，善辅佐懂平衡',
  天梁: '荫星长者风，遇难有人扶',
  七杀: '将星胆识，敢打硬仗的开拓者',
  破军: '先破后立，天生的变革先锋',
};

/** 宫位 → 人生领域白话 */
export const PALACE_DOMAIN: Record<string, string> = {
  命宫: '自我成长与个人舞台',
  兄弟: '同辈情谊与合作关系',
  夫妻: '感情与亲密关系',
  子女: '家庭传承与创造力',
  财帛: '进财方式与理财',
  疾厄: '健康与身心调养',
  迁移: '外出发展与环境变化',
  交友: '人脉圈层与团队',
  官禄: '事业与职业发展',
  田宅: '家宅根基与资产',
  福德: '心态修养与精神生活',
  父母: '长辈缘分与资源庇荫',
};

const SHA_PO_LANG = ['七杀', '破军', '贪狼'];
const JI_YUE_TONG_LIANG = ['天机', '太阴', '天同', '天梁'];

export interface ZiweiQuickReadInput {
  palaces: ZiweiPalaceLike[];
  mingzhu?: string;
  shenzhu?: string;
  wuxingJu?: string;
  dayunList: ZiweiDayunItem[];
}

/** 命宫定性一句话（含基础格局检测；空宫借对宫并明确标注） */
export function describeLifePalace(palaces: ZiweiPalaceLike[]): string {
  const life = palaces.find((p) => p.isLife);
  if (!life) return '命盘信息不全，命宫定性暂缺。';
  const stars = life.majorStars.map((s) => s.name);

  // 空宫：借对宫（地支相冲宫）主星
  if (stars.length === 0) {
    const opposite = palaces.find(
      (p) => p !== life && oppositeBranch(life.branch) === p.branch,
    );
    const borrowed = opposite?.majorStars.map((s) => s.name) ?? [];
    if (borrowed.length > 0) {
      return `命宫无主星、借对宫${borrowed.join('')}安身——不设限的多面手体质，环境给什么就能长成什么，可塑性是你最大的底牌。`;
    }
    return '命宫无主星——不被单一标签定义的自由格局，人生剧本自己写。';
  }

  const label = stars.join('');
  // 基础格局检测（只写正向池）
  if (stars.includes('紫微') && stars.includes('天府')) {
    return `${label}坐命，「紫府同宫」——帝星与库星同座，气度与资源兼备，天生适合坐镇核心、统筹全局。`;
  }
  if (stars.some((s) => SHA_PO_LANG.includes(s))) {
    const flavor = stars.map((s) => MAJOR_STAR_FLAVOR[s]).filter(Boolean)[0] ?? '';
    return `${label}坐命，杀破狼一系——为变化而生的开拓者，${flavor}；人生宜攻不宜守，越折腾越有戏。`;
  }
  if (stars.every((s) => JI_YUE_TONG_LIANG.includes(s))) {
    return `${label}坐命，机月同梁一系——善筹划的稳健派，靠专业与口碑立身，细水长流反而走得最远。`;
  }
  const flavors = stars.map((s) => MAJOR_STAR_FLAVOR[s]).filter(Boolean);
  return `${label}坐命——${flavors.join('；')}。`;
}

function oppositeBranch(branch: string): string {
  const order = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const idx = order.indexOf(branch);
  return idx >= 0 ? order[(idx + 6) % 12] : '';
}

/**
 * 速读三句话：①命宫定性 ②身宫/命主身主 ③当前大限。
 * 数据不全时自动降级（少一句不出空槽）。
 */
export function buildZiweiQuickRead(input: ZiweiQuickReadInput): string[] {
  const { palaces, mingzhu, shenzhu, wuxingJu, dayunList } = input;
  const lines: string[] = [];

  // ① 命宫定性
  lines.push(describeLifePalace(palaces));

  // ② 身宫 + 命主身主
  const body = palaces.find((p) => p.isBody);
  const parts: string[] = [];
  if (body) {
    const domain = PALACE_DOMAIN[body.name] ?? body.name;
    parts.push(`身宫落${body.name}宫，后天的着力点偏向${domain}`);
  }
  if (mingzhu && shenzhu) parts.push(`命主${mingzhu}、身主${shenzhu}`);
  if (wuxingJu) parts.push(`${wuxingJu}起运`);
  if (parts.length) lines.push(`${parts.join('；')}。`);

  // ③ 当前大限
  const current = dayunList.find((d) => d.isCurrent);
  if (current) {
    const domain = PALACE_DOMAIN[current.palaceName] ?? current.palaceName;
    const starText = current.majorStars.length ? `（${current.majorStars.join('')}）` : '（借对宫之力）';
    lines.push(
      `当前行${current.palaceName}宫大限${starText}，${current.ageStart}-${current.ageEnd}岁——这十年的人生主场景是${domain}，把精力优先投在这里最划算。`,
    );
  }

  return lines;
}

// ================================================================
// 四化叙事（P1-A）：禄=财源机遇 / 权=掌控力 / 科=名声贵人 / 忌=人生功课
// ================================================================

export interface SihuaNarrativeItem {
  type: SihuaType;
  star: string;
  palaceName: string | null;
  /** 单字标签：禄/权/科/忌 */
  short: string;
  /** 主题词 */
  theme: string;
  text: string;
}

const SIHUA_META: Record<SihuaType, { short: string; theme: string }> = {
  化禄: { short: '禄', theme: '财源与机遇' },
  化权: { short: '权', theme: '掌控与竞争力' },
  化科: { short: '科', theme: '名声与贵人' },
  化忌: { short: '忌', theme: '人生功课' },
};

function sihuaText(type: SihuaType, star: string, palaceName: string | null): string {
  const domain = palaceName ? (PALACE_DOMAIN[palaceName] ?? palaceName) : '';
  switch (type) {
    case '化禄':
      return palaceName
        ? `${star}化禄落${palaceName}宫：${domain}是你此生的进财与机遇入口，资源与好运多从这里来——多投入，回报率最高。`
        : `${star}化禄：机遇随${star}的特质而来，顺着它的领域找财源。`;
    case '化权':
      return palaceName
        ? `${star}化权落${palaceName}宫：你在${domain}上有天然的话语权与掌控力，敢拿主意的地方就是你的主场。`
        : `${star}化权：竞争力藏在${star}的特质里，主动出手比等待更有利。`;
    case '化科':
      return palaceName
        ? `${star}化科落${palaceName}宫：名声与贵人从${domain}而来，好口碑会在这里持续为你铺路。`
        : `${star}化科：以${star}之长立名，声誉是你的隐形资产。`;
    case '化忌':
      return palaceName
        ? `${star}化忌落${palaceName}宫：${domain}是你此生要修的功课——不是短板判决，而是提醒你在这里多用心经营；修好了，它反而成为你最稳的底盘。`
        : `${star}化忌：与${star}相关的议题需要多一分耐心打理，把功课做在前面。`;
  }
}

/** 生年四化叙事（确定性，替换 V1 假「人生四化」文案） */
export function buildSihuaNarrative(palaces: ZiweiPalaceLike[], yearGan: TianGan): SihuaNarrativeItem[] {
  const natal: ZiweiLiunianSihua[] = calcNatalSihua(palaces, yearGan);
  return natal.map(({ type, star, palaceName }) => ({
    type,
    star,
    palaceName,
    short: SIHUA_META[type].short,
    theme: SIHUA_META[type].theme,
    text: sihuaText(type, star, palaceName),
  }));
}

/** 流年一句话（大运切换器的流年条目用）：流年命宫 + 禄忌两端 */
export function describeLiunianBrief(
  palaceName: string,
  majorStars: string[],
  sihua: ZiweiLiunianSihua[],
): string {
  const domain = PALACE_DOMAIN[palaceName] ?? palaceName;
  const lu = sihua.find((s) => s.type === '化禄');
  const ji = sihua.find((s) => s.type === '化忌');
  const starText = majorStars.length ? majorStars.join('') : '借对宫';
  const luText = lu?.palaceName ? `机会面在${lu.palaceName}宫` : '';
  const jiText = ji?.palaceName ? `功课面在${ji.palaceName}宫` : '';
  const tail = [luText, jiText].filter(Boolean).join('，');
  return `流年命宫走${palaceName}（${starText}），主题围绕${domain}${tail ? `；${tail}` : ''}。`;
}
