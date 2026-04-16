const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function getStripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

interface StripeDirectResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function stripeRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<StripeDirectResponse<T>> {
  const key = getStripeKey();
  if (!key) {
    return { ok: false, status: 0, error: 'STRIPE_SECRET_KEY 未配置' };
  }

  const url = `${STRIPE_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body?.error?.message ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, status: res.status, data: body as T };
}

interface StripeCustomerList {
  object: string;
  data: Array<{ id: string; email?: string }>;
  has_more: boolean;
}

export interface TestConnectionResult {
  ok: boolean;
  mode?: 'live' | 'test';
  message: string;
  latencyMs?: number;
  customerCount?: number;
  error?: string;
}

export async function testStripeConnection(): Promise<TestConnectionResult> {
  const key = getStripeKey();
  if (!key) {
    return { ok: false, message: 'STRIPE_SECRET_KEY 未配置' };
  }

  const mode = key.startsWith('sk_live_') ? 'live' : 'test';
  const start = Date.now();

  const res = await stripeRequest<StripeCustomerList>('/customers?limit=1');
  const latencyMs = Date.now() - start;

  if (!res.ok) {
    return {
      ok: false,
      mode,
      message: `Stripe API 调用失败: ${res.error}`,
      latencyMs,
      error: res.error,
    };
  }

  return {
    ok: true,
    mode,
    message: `Stripe 连接正常 (${mode} 模式)`,
    latencyMs,
    customerCount: res.data?.data.length ?? 0,
  };
}

export { stripeRequest };
