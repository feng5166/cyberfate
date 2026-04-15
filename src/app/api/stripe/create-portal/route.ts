import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe 未配置' }, { status: 500 });
    }

    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: '未找到订阅记录，请先购买套餐' },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/profile`,
    });

    return NextResponse.json({ portal_url: portalSession.url });
  } catch (error: any) {
    console.error('[Stripe create-portal] Error:', error);
    return NextResponse.json(
      { 
        error: '创建管理门户失败',
        details: error.message || String(error),
        hint: '请检查 Stripe 配置是否正确'
      },
      { status: 500 }
    );
  }
}
