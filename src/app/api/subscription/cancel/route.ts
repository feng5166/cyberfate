import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedback, reactivate } = await req.json();

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        expireAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({ error: '没有有效订阅' }, { status: 404 });
    }

    if (reactivate) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          autoRenew: true,
          cancelAtPeriodEnd: false,
          cancelFeedback: null,
        }
      });
      return NextResponse.json({
        ok: true,
        message: '订阅已恢复自动续订'
      });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelAtPeriodEnd: true,
        cancelFeedback: feedback || null,
        cancelledAt: new Date(),
      }
    });

    return NextResponse.json({
      ok: true,
      will_expire_at: subscription.expireAt.toISOString(),
      message: '订阅将在当前周期结束后取消'
    });
    
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || '取消订阅失败' },
      { status: 500 }
    );
  }
}
