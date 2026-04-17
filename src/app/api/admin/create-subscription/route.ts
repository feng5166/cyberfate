import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addDays, addYears } from 'date-fns';
import { isValidPlanId } from '@/lib/pricing-config'; // Security Fix: SEC-021

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(session.user.email.toLowerCase().trim())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { email, plan = 'daily' } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    // Security Fix: SEC-021 — plan 枚举校验
    if (!isValidPlanId(plan)) {
      return NextResponse.json({ error: `无效的套餐类型: ${plan}` }, { status: 400 });
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
      case 'daily':
        expireAt = addDays(expireAt, 1);
        break;
      case 'yearly':
        expireAt = addYears(expireAt, 1);
        break;
      case 'lifetime':
        expireAt = addYears(expireAt, 100);
        break;
      default:
        // Security Fix: SEC-021 — 不可能到达（上面已校验），但保险起见
        return NextResponse.json({ error: `不支持的套餐: ${plan}` }, { status: 400 });
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
