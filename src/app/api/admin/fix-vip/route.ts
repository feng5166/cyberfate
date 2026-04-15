import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
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

    // 根据订阅类型计算正确到期时间
    const now = new Date();
    let correctExpiry = new Date(now);
    
    switch (latestSub.plan) {
      case 'monthly':
        correctExpiry.setMonth(correctExpiry.getMonth() + 1);
        break;
      case 'quarterly':
        correctExpiry.setMonth(correctExpiry.getMonth() + 3);
        break;
      case 'yearly':
        correctExpiry.setFullYear(correctExpiry.getFullYear() + 1);
        break;
    }

    // 更新订阅到期时间
    const updated = await prisma.subscription.update({
      where: { id: latestSub.id },
      data: { expireAt: correctExpiry }
    });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        plan: latestSub.plan,
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
