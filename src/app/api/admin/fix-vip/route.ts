import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addMonths, addYears } from 'date-fns';

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

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

    const { email, correctPlan } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    // 查找用户及其订阅
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        subscriptions: { orderBy: { createdAt: 'desc' } },
        orders: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取最近一次订阅
    const latestSub = user.subscriptions[0];
    
    if (!latestSub) {
      return NextResponse.json({ error: '无订阅记录' }, { status: 404 });
    }

    // 如果指定了 correctPlan，使用它；否则用现有的 plan
    const targetPlan = correctPlan || latestSub.plan;

    // 根据订阅类型计算正确到期时间
    const now = new Date();
    let correctExpiry = new Date(now);
    
    switch (targetPlan) {
      case 'monthly':
        correctExpiry = addMonths(correctExpiry, 1);
        break;
      case 'quarterly':
        correctExpiry = addMonths(correctExpiry, 3);
        break;
      case 'yearly':
        correctExpiry = addYears(correctExpiry, 1);
        break;
    }

    // 更新订阅 plan 和到期时间
    const updated = await prisma.subscription.update({
      where: { id: latestSub.id },
      data: { 
        plan: targetPlan,
        expireAt: correctExpiry 
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        oldPlan: latestSub.plan,
        newPlan: updated.plan,
        oldExpiry: latestSub.expireAt,
        newExpiry: updated.expireAt
      }
    });
    
  } catch (error: any) {
    console.error('Fix VIP error:', error);
    return NextResponse.json(
      { error: error.message || '修正失败' },
      { status: 500 }
    );
  }
}
