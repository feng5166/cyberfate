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
    amount: 3000, // HK$30 in cents
    currency: 'hkd',
    duration: 30,
    paymentLink: 'https://buy.stripe.com/14A6oG3caaAK4Lg20af3a00',
  },
  quarterly: {
    name: '季卡会员',
    amount: 7800, // HK$78 in cents
    currency: 'hkd',
    duration: 90,
    paymentLink: 'https://buy.stripe.com/4gM00i4ge9wGfpUdISf3a01',
  },
  yearly: {
    name: '年卡会员',
    amount: 23800, // HK$238 in cents
    currency: 'hkd',
    duration: 365,
    paymentLink: 'https://buy.stripe.com/cNi00i8wu7oy6To48if3a02',
  },
} as const;
