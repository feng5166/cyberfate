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
    amount: 399, // $3.99 in cents
    currency: 'usd',
    duration: 30,
  },
  quarterly: {
    name: '季卡会员',
    amount: 999, // $9.99 in cents
    currency: 'usd',
    duration: 90,
  },
  yearly: {
    name: '年卡会员',
    amount: 2999, // $29.99 in cents
    currency: 'usd',
    duration: 365,
  },
} as const;
