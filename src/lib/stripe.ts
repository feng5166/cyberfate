import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
  },
  quarterly: {
    name: '季卡会员',
    amount: 7800, // HK$78 in cents
    currency: 'hkd',
    duration: 90,
  },
  yearly: {
    name: '年卡会员',
    amount: 23800, // HK$238 in cents
    currency: 'hkd',
    duration: 365,
  },
} as const;
