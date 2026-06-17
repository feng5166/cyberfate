/**
 * 支付签名校验(纯函数,可单测)。
 * 从 payment/webhook 与 payment/callback 路由抽出——Next.js App Router 的 route.ts
 * 只应导出 HTTP handler,这些工具函数放在 lib 里供路由与测试共同 import。
 */
import crypto from 'crypto';

export function parseSignatureHeader(
  header: string
): { timestamp: number; signatures: string[] } | null {
  if (typeof header !== 'string') {
    return null;
  }

  const items = header.split(',');
  const timestamp = items
    .map((item) => item.split('='))
    .filter(([key]) => key === 't')
    .map(([, value]) => parseInt(value, 10))[0] ?? -1;

  const signatures = items
    .map((item) => item.split('='))
    .filter(([key]) => key === 'v1')
    .map(([, value]) => value);

  return { timestamp, signatures };
}

export function computeSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * 校验 Stripe Webhook 签名(参考官方 SDK 实现)。
 * 泛型 T 让调用方保留自己的事件类型(如路由的 StripeEvent)。
 */
export function verifyStripeWebhook<T = unknown>(
  payload: string,
  header: string,
  secret: string,
  tolerance: number = 300
): { valid: boolean; event?: T; error?: string } {
  const details = parseSignatureHeader(header);

  if (!details || details.timestamp === -1) {
    return { valid: false, error: 'Unable to extract timestamp and signatures from header' };
  }

  if (details.signatures.length === 0) {
    return { valid: false, error: 'No signatures found with expected scheme v1' };
  }

  const expectedSignature = computeSignature(`${details.timestamp}.${payload}`, secret);

  const signatureFound = details.signatures.some((sig) => secureCompare(sig, expectedSignature));
  if (!signatureFound) {
    return { valid: false, error: 'Webhook signature verification failed' };
  }

  const timestampAge = Math.floor(Date.now() / 1000) - details.timestamp;
  if (tolerance > 0 && timestampAge > tolerance) {
    return { valid: false, error: `Timestamp outside tolerance. Age: ${timestampAge}s` };
  }

  try {
    const event = JSON.parse(payload) as T;
    return { valid: true, event };
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }
}

/**
 * 校验自有回调的 HMAC 签名。secret 默认取 CALLBACK_SECRET 环境变量。
 */
export function verifyCallbackSignature(
  body: string,
  signature: string | null,
  secret: string | undefined = process.env.CALLBACK_SECRET
): boolean {
  if (!secret) {
    console.error('[PaymentCallback] CALLBACK_SECRET 未配置，拒绝请求');
    return false;
  }
  if (!signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
