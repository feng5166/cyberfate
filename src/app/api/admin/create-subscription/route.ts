import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addMonths, addYears } from 'date-fns';

const ADMIN_EMAILS = [process.env.ADMIN_EMAIL || 'admin@cyberfate.app'];

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { email, plan = 'monthly' } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 计算到期时间
    const now = new Date();
    let expireAt = new Date(now);
    
    switch (plan) {
      case 'monthly':
        expireAt = addMonths(expireAt, 1);
        break;
      case 'quarterly':
        expireAt = addMonths(expireAt, 3);
        break;
      case 'yearly':
        expireAt = addYears(expireAt, 1);
        break;
    }

    // 创建订阅记录
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: 'active',
        startAt: now,
        expireAt,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startAt: subscription.startAt,
        expireAt: subscription.expireAt,
      },
    });
    
  } catch (error: unknown) {
    console.error('Create subscription error:', error);
    const message = error instanceof Error ? error.message : '创建失败';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
