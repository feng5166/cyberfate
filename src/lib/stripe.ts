import Stripe from 'stripe';
import { getEnvVar } from './utils/api-wrapper';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeInstance) {
    const apiKey = getEnvVar('STRIPE_SECRET_KEY');
    if (!apiKey) {
      console.warn('[Stripe] STRIPE_SECRET_KEY 未配置，支付功能不可用');
      return null;
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2026-02-25.clover',
    });
  }
  return stripeInstance;
}

export const STRIPE_PLANS = {
  monthly: {
    name: '月卡会员',
    amount: 500, // HK$5 in cents
    currency: 'hkd',
    duration: 30,
  },
  quarterly: {
    name: '季卡会员',
    amount: 600, // HK$6 in cents
    currency: 'hkd',
    duration: 90,
  },
  yearly: {
    name: '年卡会员',
    amount: 700, // HK$7 in cents
    currency: 'hkd',
    duration: 365,
  },
} as const;
