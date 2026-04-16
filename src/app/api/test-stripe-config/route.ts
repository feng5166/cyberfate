import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { testStripeConnection } from '@/lib/stripe-direct';

function getDiagnostics() {
  const key = process.env.STRIPE_SECRET_KEY;
  const exists = !!key;
  const length = key?.length ?? 0;
  const prefix = key
    ? key.startsWith('sk_live_')
      ? 'sk_live_'
      : key.startsWith('sk_test_')
        ? 'sk_test_'
        : `unknown (${key.substring(0, 3)}...)`
    : 'N/A';

  let stripeInstanceCreated = false;
  try {
    const stripe = getStripe();
    stripeInstanceCreated = !!stripe;
  } catch {
    stripeInstanceCreated = false;
  }

  return {
    keyExists: exists,
    keyLength: length,
    keyPrefix: prefix,
    stripeInstanceCreated,
  };
}

export async function GET() {
  const diagnostics = getDiagnostics();

  let directApiTest;
  try {
    directApiTest = await testStripeConnection();
  } catch (e: any) {
    directApiTest = { ok: false, message: `直接 API 调用异常: ${e.message}` };
  }

  try {
    const stripe = getStripe();

    if (!stripe) {
      return NextResponse.json({
        ok: false,
        error: 'STRIPE_SECRET_KEY 未配置或为空',
        hint: '请在 Vercel 环境变量中设置 STRIPE_SECRET_KEY',
        diagnostics: { ...diagnostics, directApiTest },
      });
    }

    try {
      const customers = await stripe.customers.list({ limit: 1 });
      return NextResponse.json({
        ok: true,
        message: 'Stripe 配置正常',
        mode: diagnostics.keyPrefix === 'sk_live_' ? 'live' : 'test',
        customerCount: customers.data.length,
        diagnostics: { ...diagnostics, directApiTest },
      });
    } catch (stripeError: any) {
      return NextResponse.json({
        ok: false,
        error: 'Stripe API Key 无效或权限不足',
        type: stripeError.type ?? 'unknown',
        code: stripeError.code ?? 'unknown',
        statusCode: stripeError.statusCode ?? null,
        details: stripeError.message,
        hint: '请检查 STRIPE_SECRET_KEY 是否正确',
        diagnostics: { ...diagnostics, directApiTest },
      }, { status: stripeError.statusCode || 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: '配置检查失败',
      details: error.message,
      diagnostics: { ...diagnostics, directApiTest },
    }, { status: 500 });
  }
}
