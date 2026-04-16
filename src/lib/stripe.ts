import Stripe from 'stripe';
import { getEnvVar } from './utils/api-wrapper';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeInstance) {
    const apiKey = getEnvVar('STRIPE_SECRET_KEY');
    console.log('[Stripe] API Key 长度:', apiKey?.length, '前缀:', apiKey?.substring(0, 10));
    if (!apiKey) {
      console.warn('[Stripe] STRIPE_SECRET_KEY 未配置，支付功能不可用');
      return null;
    }
    stripeInstance = new Stripe(apiKey);
  }
  return stripeInstance;
}
