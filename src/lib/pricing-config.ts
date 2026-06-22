export type PlanId = 'daily' | 'yearly' | 'lifetime';

// BUG-014: 终身版 duration 常量，全链路统一使用而非硬编码 36500
export const LIFETIME_DURATION = 36500;

export interface PlanConfig {
  id: PlanId;
  name: string;
  subtitle: string;      // 卡片副标题
  displayPrice: string;
  amount: number;        // 单位：分（货币最小单位）
  currency: string;      // 'usd' | 'cny'
  period: string;        // 显示用：'天' | '年' | '终身'
  periodLabel: string;   // '/ 天' | '/ 年' | ''
  duration: number;      // 天数（lifetime 用一个很大的数或特殊处理）
  recommended: boolean;
  perksTitle: string;    // 权益分组标题：'单日权益' | '共创者特权'
  perks: string[];
  audienceTitle: string; // '适合人群'
  audience: string[];    // 适合人群列表
  ctaText: string;       // 按钮文案
  badge?: string;        // 角标：'早鸟优惠'
  lockPriceNote?: string;// 价格锁定提示 banner
  footnote?: string;     // 按钮下小字
  originalDisplayPrice?: string; // 划线原价（展示）
  originalAmount?: number;       // 划线原价（分）
  /** 是否可售：false=祖父条款下架（存量有效、不再展示/出售） */
  sellable: boolean;
  periodCard: string;    // '天卡' | '年卡' | '终身卡'
  adminLabel: string;    // '天付 +1天' | '年付 +365天' | '终身'
  adminShortLabel: string; // '天付' | '年付' | '终身'
  /** Stripe 价格 ID（可选，预定义价格模式） */
  stripePriceId?: string;
}

export const PRICING_CONFIG: Record<PlanId, PlanConfig> = {
  daily: {
    id: 'daily',
    name: '单日解锁',
    subtitle: '适合临时使用或尝试服务',
    displayPrice: '9.99',
    amount: 999,         // $9.99 USD
    currency: 'usd',
    period: '天',
    periodLabel: '/ 天',
    duration: 1,
    recommended: false,
    sellable: true,
    perksTitle: '单日权益',
    perks: [
      '智能八字精准分析',
      '当日运势全面解读',
      '每日重要决策指引',
      '重要事项决策指引',
      '正缘姻缘测算与桃花运分析',
      '智能问答交互',
    ],
    audienceTitle: '适合人群',
    audience: [
      '一次性快速分析需求',
      '临时姻缘测算需求',
      '订阅前的体验尝试',
    ],
    ctaText: '立即购买',
    footnote: '一次性支付，到期不自动续费',
    periodCard: '天卡',
    adminLabel: '天付 +1天',
    adminShortLabel: '天付',
  },
  yearly: {
    id: 'yearly',
    name: '年费会员',
    subtitle: '享受全年无限制服务和共创者特权',
    displayPrice: '69.9',
    amount: 6990,        // $69.9 USD
    currency: 'usd',
    period: '年',
    periodLabel: '/ 年',
    duration: 365,
    recommended: true,
    sellable: true,
    badge: '早鸟优惠',
    originalDisplayPrice: '299',
    originalAmount: 29900,
    lockPriceNote: '永久锁定续费价格，后续价格调整不受影响，续费永享原价',
    perksTitle: '共创者特权',
    perks: [
      '每日运势智能分析与提醒',
      '每日重要决策智能指引',
      '重大事项 AI 决策指导',
      '正缘测算与桃花运分析',
      '事业财运全面预测',
      '智能八字问答无限制',
    ],
    audienceTitle: '适合人群',
    audience: [
      '长期日常指引需求',
      '事业与个人发展规划',
      '经常为朋友测算姻缘的人',
    ],
    ctaText: '年费会员',
    footnote: '早鸟优惠 · 续费永享原价',
    periodCard: '年卡',
    adminLabel: '年付 +365天',
    adminShortLabel: '年付',
  },
  // 尊享版：祖父条款下架——存量用户继续有效，不再展示/出售。保留配置以兼容历史订单查询。
  lifetime: {
    id: 'lifetime',
    name: '尊享版',
    subtitle: '终身解锁（已下架，仅存量有效）',
    displayPrice: '199',
    amount: 19900,       // $199 USD
    currency: 'usd',
    period: '终身',
    periodLabel: '',
    duration: LIFETIME_DURATION,
    recommended: false,
    sellable: false,
    perksTitle: '权益',
    perks: [
      '终身全部功能',
      '所有命理模块永久解锁',
      '未来新功能免费享用',
    ],
    audienceTitle: '适合人群',
    audience: [],
    ctaText: '已下架',
    periodCard: '终身卡',
    adminLabel: '终身',
    adminShortLabel: '终身',
  },
};

export const PLAN_IDS: PlanId[] = ['daily', 'yearly', 'lifetime'];

/** 可售套餐（前端定价页/购买入口只用这个；lifetime 已祖父条款下架） */
export const SELLABLE_PLAN_IDS: PlanId[] = PLAN_IDS.filter(
  (id) => PRICING_CONFIG[id].sellable
);

export const PRICING_PLANS_LIST: PlanConfig[] = PLAN_IDS.map(
  (id) => PRICING_CONFIG[id]
);

/** 可售套餐配置列表（定价页渲染用） */
export const SELLABLE_PLANS_LIST: PlanConfig[] = SELLABLE_PLAN_IDS.map(
  (id) => PRICING_CONFIG[id]
);

export function isValidPlanId(id: string): id is PlanId {
  return PLAN_IDS.includes(id as PlanId);
}

/** 是否为当前可售套餐(用于校验购买请求,挡掉已下架的 lifetime) */
export function isSellablePlanId(id: string): id is PlanId {
  return isValidPlanId(id) && PRICING_CONFIG[id].sellable;
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
  const found = SELLABLE_PLAN_IDS.find((id) => PRICING_CONFIG[id].recommended);
  return found ?? SELLABLE_PLAN_IDS[0] ?? PLAN_IDS[0];
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
