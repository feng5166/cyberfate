import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listCustomers, createPortalSession } from '@/lib/stripe-direct';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const customersRes = await listCustomers(session.user.email);

    if (!customersRes.ok) {
      return NextResponse.json(
        { error: customersRes.error ?? 'Stripe 未配置' },
        { status: customersRes.status || 500 }
      );
    }

    if (!customersRes.data || customersRes.data.data.length === 0) {
      return NextResponse.json(
        { error: '未找到订阅记录，请先购买套餐' },
        { status: 404 }
      );
    }

    const customerId = customersRes.data.data[0].id;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.cyberfate.me';

    const portalRes = await createPortalSession(
      customerId,
      `${baseUrl}/profile`,
    );

    if (!portalRes.ok || !portalRes.data) {
      return NextResponse.json(
        { error: portalRes.error ?? '创建管理门户失败' },
        { status: portalRes.status || 500 }
      );
    }

    return NextResponse.json({ portal_url: portalRes.data.url });
  } catch (error: any) {
    console.error('[Stripe create-portal] Error:', error);
    return NextResponse.json(
      { 
        error: '创建管理门户失败',
        details: '请检查 Stripe 配置是否正确',
      },
      { status: 500 }
    );
  }
}
