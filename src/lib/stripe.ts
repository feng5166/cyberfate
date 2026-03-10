import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const STRIPE_PLANS = {
  monthly: {
    name: '月卡会员',
    amount: 2990, // ¥29.9 in fen
    currency: 'cny',
    duration: 30,
  },
  quarterly: {
    name: '季卡会员',
    amount: 6900, // ¥69 in fen
    currency: 'cny',
    duration: 90,
  },
  yearly: {
    name: '年卡会员',
    amount: 19900, // ¥199 in fen
    currency: 'cny',
    duration: 365,
  },
} as const;
