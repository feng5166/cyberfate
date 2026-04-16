import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

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

  try {
    const stripe = getStripe();

    if (!stripe) {
      return NextResponse.json({
        ok: false,
        error: 'STRIPE_SECRET_KEY 未配置或为空',
        hint: '请在 Vercel 环境变量中设置 STRIPE_SECRET_KEY',
        diagnostics,
      });
    }

    try {
      const balance = await stripe.balance.retrieve();
      return NextResponse.json({
        ok: true,
        message: 'Stripe 配置正常',
        mode: diagnostics.keyPrefix === 'sk_live_' ? 'live' : 'test',
        currency: balance.available[0]?.currency || 'hkd',
        diagnostics,
      });
    } catch (stripeError: any) {
      return NextResponse.json({
        ok: false,
        error: 'Stripe API Key 无效或权限不足',
        details: stripeError.message,
        hint: '请检查 STRIPE_SECRET_KEY 是否正确',
        diagnostics,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: '配置检查失败',
      details: error.message,
      diagnostics,
    }, { status: 500 });
  }
}
