import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  try {
    const stripe = getStripe();
    
    if (!stripe) {
      return NextResponse.json({
        ok: false,
        error: 'STRIPE_SECRET_KEY 未配置或为空',
        hint: '请在 Vercel 环境变量中设置 STRIPE_SECRET_KEY'
      });
    }

    // 尝试调用一个简单的 Stripe API 来验证 Key 是否有效
    try {
      const balance = await stripe.balance.retrieve();
      return NextResponse.json({
        ok: true,
        message: 'Stripe 配置正常',
        mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
        currency: balance.available[0]?.currency || 'hkd'
      });
    } catch (stripeError: any) {
      return NextResponse.json({
        ok: false,
        error: 'Stripe API Key 无效或权限不足',
        details: stripeError.message,
        hint: '请检查 STRIPE_SECRET_KEY 是否正确'
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: '配置检查失败',
      details: error.message
    }, { status: 500 });
  }
}
