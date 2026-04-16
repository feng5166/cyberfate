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
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripeInstance;
}
