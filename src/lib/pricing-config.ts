export type PlanId = 'monthly' | 'quarterly' | 'yearly';

export interface PlanConfig {
  id: PlanId;
  name: string;
  displayPrice: string;
  amount: number;
  currency: string;
  period: string;
  periodLabel: string;
  duration: number;
  recommended: boolean;
  perks: string[];
}

export const PRICING_CONFIG: Record<PlanId, PlanConfig> = {
  monthly: {
    id: 'monthly',
    name: '基础版',
    displayPrice: '5',
    amount: 500,
    currency: 'hkd',
    period: '月',
    periodLabel: '/ 月',
    duration: 30,
    recommended: false,
    perks: [
      '无限次八字解读',
      '每日运势推送',
      'AI 深度分析报告',
      '标准客服支持',
    ],
  },
  quarterly: {
    id: 'quarterly',
    name: '专业版',
    displayPrice: '6',
    amount: 600,
    currency: 'hkd',
    period: '季',
    periodLabel: '/ 季',
    duration: 90,
    recommended: true,
    perks: [
      '无限次八字解读',
      '每日运势推送',
      'AI 深度分析报告',
      '优先客服支持',
      '紫微斗数',
      '周易占卜（梅花易数）',
    ],
  },
  yearly: {
    id: 'yearly',
    name: '尊享版',
    displayPrice: '7',
    amount: 700,
    currency: 'hkd',
    period: '年',
    periodLabel: '/ 年',
    duration: 365,
    recommended: false,
    perks: [
      '无限次八字解读',
      '每日运势推送',
      'AI 深度分析报告',
      '专属客服支持',
      '紫微斗数',
      '周易占卜（梅花易数）',
      '塔罗占卜',
      '新功能优先体验',
    ],
  },
};

export const PLAN_IDS: PlanId[] = ['monthly', 'quarterly', 'yearly'];

export const PRICING_PLANS_LIST: PlanConfig[] = PLAN_IDS.map(
  (id) => PRICING_CONFIG[id]
);

export function isValidPlanId(id: string): id is PlanId {
  return PLAN_IDS.includes(id as PlanId);
}
