export type PlanId = 'daily' | 'yearly' | 'lifetime';

export interface PlanConfig {
  id: PlanId;
  name: string;
  displayPrice: string;
  amount: number;        // 单位：分（货币最小单位）
  currency: string;      // 'usd' | 'cny'
  period: string;        // 显示用：'天' | '年' | '终身'
  periodLabel: string;   // '/ 天' | '/ 年' | ''
  duration: number;      // 天数（lifetime 用一个很大的数或特殊处理）
  recommended: boolean;
  perks: string[];
  /** Stripe 价格 ID（可选，预定义价格模式） */
  stripePriceId?: string;
}

export const PRICING_CONFIG: Record<PlanId, PlanConfig> = {
  daily: {
    id: 'daily',
    name: '基础版',
    displayPrice: '$9.99',
    amount: 999,         // $9.99 USD
    currency: 'usd',
    period: '天',
    periodLabel: '/ 天',
    duration: 1,
    recommended: false,
    perks: [
      '当日全功能解锁',
      '八字深度解读',
      '每日运势查看',
      'AI 分析报告',
    ],
  },
  yearly: {
    id: 'yearly',
    name: '专业版',
    displayPrice: '$49',
    amount: 4900,        // $49 USD
    currency: 'usd',
    period: '年',
    periodLabel: '/ 年',
    duration: 365,
    recommended: true,
    perks: [
      '全年全功能解锁',
      '八字 + 紫微斗数',
      '梅花易数占卜',
      '塔罗牌阵',
      '合婚分析',
      '优先 AI 模型',
      '专属客服支持',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: '尊享版',
    displayPrice: '$199',
    amount: 19900,       // $199 USD
    currency: 'usd',
    period: '终身',
    periodLabel: '',
    duration: 36500,     // ~100 年，实际视为永久
    recommended: false,
    perks: [
      '终身全部功能',
      '所有命理模块永久解锁',
      '未来新功能免费享用',
      '最高优先级客服',
      '会员专属社群',
      '定制化分析报告',
      'API 调用额度提升',
    ],
  },
};

export const PLAN_IDS: PlanId[] = ['daily', 'yearly', 'lifetime'];

export const PRICING_PLANS_LIST: PlanConfig[] = PLAN_IDS.map(
  (id) => PRICING_CONFIG[id]
);

export function isValidPlanId(id: string): id is PlanId {
  return PLAN_IDS.includes(id as PlanId);
}
