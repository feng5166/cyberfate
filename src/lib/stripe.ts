/**
 * @deprecated 新代码请使用 stripe-direct.ts。
 * Stripe SDK 在 Vercel Serverless 环境存在 StripeConnectionError 网络连接问题，
 * 已改用原生 fetch 实现（stripe-direct.ts）绕过该问题。
 * 此文件仅保留以兼容潜在的历史引用，不应在新功能中使用。
 */
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
      timeout: 10000,
      maxNetworkRetries: 3,
    });
  }
  return stripeInstance;
}
