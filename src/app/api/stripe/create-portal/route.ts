import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listCustomers, createPortalSession } from '@/lib/stripe-direct';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 优先使用 webhook/checkout 持久化的 customer id，避免同一邮箱有多个
    // Stripe Customer 时按列表顺序选到错误的账单门户。
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeCustomerId: true },
    });

    let customerId = user?.stripeCustomerId ?? null;
    if (!customerId) {
      const customersRes = await listCustomers(session.user.email);

      if (!customersRes.ok) {
        return NextResponse.json(
          { error: customersRes.error ?? 'Stripe 未配置' },
          { status: customersRes.status || 500 },
        );
      }

      customerId = customersRes.data?.data[0]?.id ?? null;
      if (!customerId) {
        return NextResponse.json(
          { error: '未找到订阅记录，请先购买套餐' },
          { status: 404 },
        );
      }

      // 仅在字段仍为空时回写，避免并发请求覆盖已确认的 customer。
      if (user) {
        await prisma.user.updateMany({
          where: { id: user.id, stripeCustomerId: null },
          data: { stripeCustomerId: customerId },
        });
      }
    }

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
  } catch (error: unknown) {
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
