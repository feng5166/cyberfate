import type { WuXing } from './types';
import type { TenGod } from './helpers';
import type { LifeKlineLevel } from './lifeKline';

/**
 * 宜忌建议词库（P1-C：本地模板，零 AI 成本）。
 *
 * 表述规范（PRD §8）：低谷年一律「提醒-蓄力-给建议」框架，
 * 禁用恐吓词；建议是可操作的行为，不是玄学消费引导。
 */

/** 用神五行 → 宜做的事 */
const YONG_SHEN_YI: Record<WuXing, string[]> = {
  木: ['进修学习', '拓展人脉', '启动酝酿已久的计划'],
  火: ['展示表达', '扩大曝光', '推进合作与宣传'],
  土: ['储蓄固本', '深耕主业', '安顿家宅'],
  金: ['理清财务规则', '专业深耕', '做减法断舍离'],
  水: ['流动求变', '发展异地机会', '学习新技能'],
};

/** 忌神五行 → 该避开的事 */
const JI_SHEN_JI: Record<WuXing, string[]> = {
  木: ['盲目扩张', '另起炉灶'],
  火: ['冲动冒进', '高调张扬'],
  土: ['固守不变', '重资产押注'],
  金: ['硬碰硬对抗', '过度计较'],
  水: ['漂浮不定', '投机流动资金'],
};

/** 十神特有提醒（追加到忌里，低分年权重更高） */
const TEN_GOD_CAUTION: Partial<Record<TenGod, string>> = {
  劫财: '合伙与借贷需谨慎',
  比肩: '合作分工先讲清',
  七杀: '防压力透支身体',
  伤官: '慎言防口舌是非',
  偏财: '忌大额投机',
  偏印: '防思虑过度',
};

/** 十神特有机会（追加到宜里，高分年权重更高） */
const TEN_GOD_CHANCE: Partial<Record<TenGod, string>> = {
  正官: '争取晋升与正名',
  正财: '稳步落袋为安',
  偏财: '留意外财机遇',
  食神: '输出作品与才华',
  伤官: '大胆展示锋芒',
  正印: '考证进修有成',
};

export interface YearAdvice {
  yi: string[];
  ji: string[];
}

/**
 * 按等级 + 用神/忌神 + 流年十神生成当年宜忌（各最多 2 条，确定性）。
 */
export function adviceForYear(args: {
  level: LifeKlineLevel;
  yongShen: WuXing;
  jiShen: WuXing;
  tenGod: TenGod;
}): YearAdvice {
  const { level, yongShen, jiShen, tenGod } = args;
  const good = level === '极盛' || level === '上佳';

  const yi: string[] = [];
  const ji: string[] = [];

  const yiPool = YONG_SHEN_YI[yongShen];
  const jiPool = JI_SHEN_JI[jiShen];

  if (good) {
    const chance = TEN_GOD_CHANCE[tenGod];
    yi.push(yiPool[0]);
    if (chance) yi.push(chance);
    else yi.push(yiPool[1]);
    ji.push(jiPool[0]);
  } else {
    // 低分年：宜取「蓄力型」词条（词库后位更偏稳），忌加十神提醒
    yi.push(yiPool[yiPool.length - 1]);
    const caution = TEN_GOD_CAUTION[tenGod];
    ji.push(jiPool[0]);
    if (caution) ji.push(caution);
    else ji.push(jiPool[1]);
  }

  return { yi: yi.slice(0, 2), ji: ji.slice(0, 2) };
}
