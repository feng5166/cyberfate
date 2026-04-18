/**
 * 使用原生 fetch 直接调用 Stripe REST API，是项目的主要 Stripe 实现。
 * 背景：Stripe Node.js SDK（stripe.ts）在 Vercel Serverless 环境会触发
 * StripeConnectionError，原因是 SDK 使用的底层 HTTP 客户端与 Vercel 的
 * 网络层存在兼容性问题。改用原生 fetch 后连接稳定，故以此为准。
 * 所有新的 Stripe 调用应使用本文件的导出函数。
 */
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

  const isWrite = options?.method && options.method !== 'GET';
  const idempotencyHeaders: Record<string, string> = isWrite
    ? { 'Idempotency-Key': crypto.randomUUID() }
    : {};

  const url = `${STRIPE_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...idempotencyHeaders,
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

// ── Checkout Session ──

export interface PriceData {
  currency: string;
  unit_amount: number;
  product_data: {
    name: string;
    description?: string;
  };
}

export interface CheckoutSessionParams {
  customerEmail?: string;
  customerId?: string;
  priceId?: string;
  priceData?: PriceData;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription';
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  object: string;
  url: string | null;
  status: string;
  payment_status: string;
  customer: string | null;
  customer_email: string | null;
  mode: string;
  metadata: Record<string, string>;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<StripeDirectResponse<StripeCheckoutSession>> {
  const body = new URLSearchParams();

  body.set('mode', params.mode ?? 'payment');
  body.set('success_url', params.successUrl);
  body.set('cancel_url', params.cancelUrl);

  body.set('payment_method_types[0]', 'card');
  body.set('payment_method_options[card][request_three_d_secure]', 'automatic');
  body.set('billing_address_collection', 'auto');
  body.set('custom_text[submit][message]', 'CYBERFATE');

  if (params.priceData) {
    body.set('line_items[0][price_data][currency]', params.priceData.currency);
    body.set('line_items[0][price_data][unit_amount]', String(params.priceData.unit_amount));
    body.set('line_items[0][price_data][product_data][name]', params.priceData.product_data.name);
    if (params.priceData.product_data.description) {
      body.set('line_items[0][price_data][product_data][description]', params.priceData.product_data.description);
    }
  } else if (params.priceId) {
    body.set('line_items[0][price]', params.priceId);
  }

  body.set('line_items[0][quantity]', String(params.quantity ?? 1));

  if (params.customerId) {
    body.set('customer', params.customerId);
  } else if (params.customerEmail) {
    body.set('customer_email', params.customerEmail);
  }

  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  return stripeRequest<StripeCheckoutSession>('/checkout/sessions', {
    method: 'POST',
    body: body.toString(),
  });
}

// ── Customer ──

export interface StripeCustomer {
  id: string;
  object: string;
  email: string | null;
  name: string | null;
  created: number;
  metadata: Record<string, string>;
}

export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>,
): Promise<StripeDirectResponse<StripeCustomer>> {
  const body = new URLSearchParams();
  body.set('email', email);
  if (name) {
    body.set('name', name);
  }
  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      body.set(`metadata[${k}]`, v);
    }
  }

  return stripeRequest<StripeCustomer>('/customers', {
    method: 'POST',
    body: body.toString(),
  });
}

export async function listCustomers(
  email: string,
): Promise<StripeDirectResponse<StripeCustomerList>> {
  const encodedEmail = encodeURIComponent(email);
  return stripeRequest<StripeCustomerList>(
    `/customers?email=${encodedEmail}&limit=10`,
  );
}

// ── Customer Portal Session ──

export interface StripePortalSession {
  id: string;
  object: string;
  url: string;
  customer: string;
  return_url: string;
  created: number;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<StripeDirectResponse<StripePortalSession>> {
  const body = new URLSearchParams();
  body.set('customer', customerId);
  body.set('return_url', returnUrl);

  const MAX_RETRIES = 3;
  let lastResult: StripeDirectResponse<StripePortalSession> = { ok: false, status: 0, error: '未执行' };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 500));
    }

    lastResult = await stripeRequest<StripePortalSession>('/billing_portal/sessions', {
      method: 'POST',
      body: body.toString(),
    });

    if (lastResult.ok) return lastResult;

    // 4xx 客户端错误不重试
    if (lastResult.status >= 400 && lastResult.status < 500) break;
  }

  return lastResult;
}

export { stripeRequest };
