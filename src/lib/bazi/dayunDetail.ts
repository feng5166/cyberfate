import type { TianGan, DiZhi, WuXing } from './types';
import { TIANGAN_WUXING } from './constants';
import { getTenGod, getNaYin, type TenGod } from './helpers';
import { DIZHI_HIDDEN_GAN } from './geju';

/** 五行生克 */
const WUXING_GENERATE: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
const WUXING_CONTROL: Record<WuXing, WuXing> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
};

export type DayunFortune = '吉' | '平' | '凶';

/** 十神 → 该领域的一句话倾向（用于按大运天干十神生成事业/财运/感情/健康简评） */
const TEN_GOD_PROFILE: Record<TenGod, { theme: string; aspects: { label: string; text: string }[] }> = {
  '正官': {
    theme: '事业晋升、责任与规范',
    aspects: [
      { label: '事业', text: '利于升职、考公、走正规体系，名分与职位有提升机会。' },
      { label: '财运', text: '财随职来，宜以事业带动收入，不宜投机。' },
      { label: '感情', text: '女命利婚恋遇正缘；男命重责任，关系趋稳定。' },
      { label: '健康', text: '压力偏大，注意肝胆与作息，避免过劳。' },
    ],
  },
  '七杀': {
    theme: '开拓竞争、压力与魄力',
    aspects: [
      { label: '事业', text: '适合开拓、竞争、带兵打仗式的突破，宜主动出击。' },
      { label: '财运', text: '高风险高回报，需有制化方能聚财，谨防冒进。' },
      { label: '感情', text: '关系起伏较大，相处需多包容，忌强势对抗。' },
      { label: '健康', text: '易因争斗劳碌而耗损，注意意外与炎症。' },
    ],
  },
  '正财': {
    theme: '稳健求财、务实积累',
    aspects: [
      { label: '事业', text: '务实经营、踏实做事的收获期，宜守成精进。' },
      { label: '财运', text: '正财得力，正职、稳健投资有进账，适合积累。' },
      { label: '感情', text: '男命利婚恋；重经营与责任，感情趋于落地。' },
      { label: '健康', text: '注意脾胃与饮食规律，勿因忙碌忽视身体。' },
    ],
  },
  '偏财': {
    theme: '机遇财源、人脉与外快',
    aspects: [
      { label: '事业', text: '机会多、人脉广，适合销售、生意、副业拓展。' },
      { label: '财运', text: '偏财活跃，外财、投资、生意有得，宜见好就收。' },
      { label: '感情', text: '异性缘旺、社交活跃，需把握分寸守住关系。' },
      { label: '健康', text: '应酬奔波偏多，注意肠胃与劳逸结合。' },
    ],
  },
  '正印': {
    theme: '学习贵人、庇护与名誉',
    aspects: [
      { label: '事业', text: '利学习、考试、文书、职称，易得贵人提携。' },
      { label: '财运', text: '财气偏稳，重名誉与积累，不宜激进逐利。' },
      { label: '感情', text: '情感温和有依靠，长辈助力多，关系安稳。' },
      { label: '健康', text: '整体平稳，注意睡眠与情绪调养。' },
    ],
  },
  '偏印': {
    theme: '专业钻研、独立与思辨',
    aspects: [
      { label: '事业', text: '适合钻研技术、专业、玄学偏门，宜专精一行。' },
      { label: '财运', text: '财源偏冷门，靠专业技能变现，忌人云亦云。' },
      { label: '感情', text: '内心独立、思虑较多，需主动表达增进沟通。' },
      { label: '健康', text: '易思虑伤神，注意神经、肠胃与作息。' },
    ],
  },
  '食神': {
    theme: '才华表达、福气与享受',
    aspects: [
      { label: '事业', text: '利创作、表达、技艺、教育，发挥才华正当时。' },
      { label: '财运', text: '食神生财，以才华、口才、手艺生财较顺。' },
      { label: '感情', text: '心态愉悦、相处轻松，利感情升温与生育。' },
      { label: '健康', text: '宜节制口腹之欲，整体较为安康舒泰。' },
    ],
  },
  '伤官': {
    theme: '才气张扬、变革与突破',
    aspects: [
      { label: '事业', text: '才华横溢、不拘一格，利创新转型，忌恃才傲物。' },
      { label: '财运', text: '伤官生财，灵活变现机会多，但易聚易散。' },
      { label: '感情', text: '个性鲜明易有波动，沟通需收敛锋芒。' },
      { label: '健康', text: '情绪起伏大，注意呼吸系统与睡眠。' },
    ],
  },
  '比肩': {
    theme: '自立合作、朋友与竞争',
    aspects: [
      { label: '事业', text: '靠自身实力打拼，利合伙、团队协作。' },
      { label: '财运', text: '收入靠己力，注意分财、合伙账目要清晰。' },
      { label: '感情', text: '朋友多、社交广，感情上需多给对方空间。' },
      { label: '健康', text: '精力旺盛但易逞强，注意筋骨与运动损伤。' },
    ],
  },
  '劫财': {
    theme: '冲劲竞争、合作与破耗',
    aspects: [
      { label: '事业', text: '冲劲足、敢争抢，利竞争性行业，忌冲动决策。' },
      { label: '财运', text: '易有破财、合伙纠纷，理财宜保守、留余地。' },
      { label: '感情', text: '竞争与诱惑增多，关系需更多坦诚与信任。' },
      { label: '健康', text: '操劳争胜易耗气血，注意休息与情绪管理。' },
    ],
  },
  '日主': { theme: '自我本气', aspects: [] },
  '未知': { theme: '—', aspects: [] },
};

export interface DayunHiddenGod {
  gan: TianGan;
  shishen: TenGod;
}

export interface DayunDetail {
  ganZhi: string;
  wuxing: WuXing;
  /** 天干十神（大运天干相对日主） */
  ganShiShen: TenGod;
  /** 地支藏干十神（本气在前） */
  hiddenGods: DayunHiddenGod[];
  /** 纳音 */
  naYin: string;
  /** 大运五行相对用神/忌神的吉凶判断 */
  fortune: DayunFortune;
  /** 吉凶判断依据说明 */
  fortuneReason: string;
  /** 该阶段主题 */
  theme: string;
  /** 事业/财运/感情/健康四维简评 */
  aspects: { label: string; text: string }[];
}

/**
 * 计算大运吉凶：大运五行与命局用神/忌神的关系。
 * - 等于用神，或生用神 → 吉
 * - 等于忌神，或生忌神 → 凶
 * - 其余 → 平
 * 缺用神/忌神（如无 mingGe）时退回与日主的生扶关系判断。
 */
function judgeFortune(
  dayunWuxing: WuXing,
  dayGan: TianGan,
  yongShen?: WuXing,
  jiShen?: WuXing,
): { fortune: DayunFortune; reason: string } {
  if (yongShen) {
    if (dayunWuxing === yongShen) {
      return { fortune: '吉', reason: `大运五行「${dayunWuxing}」正是命局喜用神，助运较吉。` };
    }
    if (WUXING_GENERATE[dayunWuxing] === yongShen) {
      return { fortune: '吉', reason: `大运五行「${dayunWuxing}」生扶喜用神「${yongShen}」，趋吉。` };
    }
  }
  if (jiShen) {
    if (dayunWuxing === jiShen) {
      return { fortune: '凶', reason: `大运五行「${dayunWuxing}」为命局忌神，需谨慎防耗。` };
    }
    if (WUXING_GENERATE[dayunWuxing] === jiShen) {
      return { fortune: '凶', reason: `大运五行「${dayunWuxing}」生助忌神「${jiShen}」，运势偏滞。` };
    }
  }

  // 无用忌神信息时：以大运五行对日主的生扶/克泄判断
  const dayWuxing = TIANGAN_WUXING[dayGan];
  if (dayunWuxing === dayWuxing || WUXING_GENERATE[dayunWuxing] === dayWuxing) {
    return { fortune: '吉', reason: `大运五行「${dayunWuxing}」生扶日主，较为有利。` };
  }
  if (WUXING_CONTROL[dayunWuxing] === dayWuxing) {
    return { fortune: '凶', reason: `大运五行「${dayunWuxing}」克制日主，宜稳健应对。` };
  }
  return { fortune: '平', reason: `大运五行「${dayunWuxing}」与命局关系平和，按部就班即可。` };
}

/**
 * 生成选中大运的确定性详情（不依赖 AI）。
 * @param item 大运项（含 gan/zhi/wuxing）
 * @param dayGan 日主天干
 * @param yongShen 命局喜用神（可选，来自 analyzeMingGe / mingGe）
 * @param jiShen 命局忌神（可选）
 */
export function describeDayun(
  item: { gan: TianGan; zhi: DiZhi; wuxing: WuXing },
  dayGan: TianGan,
  yongShen?: WuXing,
  jiShen?: WuXing,
): DayunDetail {
  const ganShiShen = getTenGod(dayGan, item.gan);

  const hidden = DIZHI_HIDDEN_GAN[item.zhi] || [];
  const hiddenGods: DayunHiddenGod[] = hidden.map((g) => ({
    gan: g,
    shishen: getTenGod(dayGan, g),
  }));

  const { fortune, reason } = judgeFortune(item.wuxing, dayGan, yongShen, jiShen);
  const profile = TEN_GOD_PROFILE[ganShiShen] || TEN_GOD_PROFILE['未知'];

  return {
    ganZhi: `${item.gan}${item.zhi}`,
    wuxing: item.wuxing,
    ganShiShen,
    hiddenGods,
    naYin: getNaYin(item.gan, item.zhi),
    fortune,
    fortuneReason: reason,
    theme: profile.theme,
    aspects: profile.aspects,
  };
}
