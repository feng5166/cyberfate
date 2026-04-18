export type PlanId = 'daily' | 'yearly' | 'lifetime';

// BUG-014: 终身版 duration 常量，全链路统一使用而非硬编码 36500
export const LIFETIME_DURATION = 36500;

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
  periodCard: string;    // '天卡' | '年卡' | '终身卡'
  adminLabel: string;    // '天付 +1天' | '年付 +365天' | '终身'
  adminShortLabel: string; // '天付' | '年付' | '终身'
  /** Stripe 价格 ID（可选，预定义价格模式） */
  stripePriceId?: string;
}

export const PRICING_CONFIG: Record<PlanId, PlanConfig> = {
  daily: {
    id: 'daily',
    name: '基础版',
    displayPrice: '1',
    amount: 100,         // $1 USD
    currency: 'usd',
    period: '天',
    periodLabel: '/ 天',
    duration: 1,
    recommended: false,
    periodCard: '天卡',
    adminLabel: '天付 +1天',
    adminShortLabel: '天付',
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
    displayPrice: '2',
    amount: 200,        // $2 USD
    currency: 'usd',
    period: '年',
    periodLabel: '/ 年',
    duration: 365,
    recommended: true,
    periodCard: '年卡',
    adminLabel: '年付 +365天',
    adminShortLabel: '年付',
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
    displayPrice: '3',
    amount: 300,       // $3 USD
    currency: 'usd',
    period: '终身',
    periodLabel: '',
    duration: LIFETIME_DURATION,
    recommended: false,
    periodCard: '终身卡',
    adminLabel: '终身',
    adminShortLabel: '终身',
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

export const PLAN_NAME_TO_ID: Record<string, PlanId> = Object.fromEntries(
  PLAN_IDS.map((id) => [PRICING_CONFIG[id].name, id])
) as Record<string, PlanId>;

export const PLAN_ID_TO_NAME: Record<PlanId, string> = Object.fromEntries(
  PLAN_IDS.map((id) => [id, PRICING_CONFIG[id].name])
) as Record<PlanId, string>;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  cny: '¥',
};

export function getPlanName(planId: string): string {
  if (!isValidPlanId(planId)) return planId;
  return PRICING_CONFIG[planId].name;
}

export function getPlanDisplayName(planId: string): string {
  if (!isValidPlanId(planId)) return planId;
  const config = PRICING_CONFIG[planId];
  return `${config.name}（${config.periodCard}）`;
}

export function getPlanPeriodLabel(planId: string): string {
  if (!isValidPlanId(planId)) return '';
  return PRICING_CONFIG[planId].period;
}

export function isLifetimePlan(planId: string): boolean {
  return planId === 'lifetime';
}

export function getDefaultPlanId(): PlanId {
  const found = PLAN_IDS.find((id) => PRICING_CONFIG[id].recommended);
  return found ?? PLAN_IDS[0];
}

export function getCurrencySymbol(planId?: PlanId): string {
  if (!planId || !isValidPlanId(planId)) return '$';
  return CURRENCY_SYMBOLS[PRICING_CONFIG[planId].currency] ?? '$';
}

export function formatPrice(planId: PlanId): string {
  const config = PRICING_CONFIG[planId];
  const symbol = getCurrencySymbol(planId);
  const price = config.displayPrice;
  if (isLifetimePlan(planId)) return `${symbol}${price}`;
  return `${symbol}${price} / ${config.period}`;
}
