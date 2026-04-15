import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      include: { payments: { orderBy: { createdAt: 'desc' } } }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取最近一次订阅
    const latestPayment = user.payments[0];
    
    if (!latestPayment) {
      return NextResponse.json({ error: '无订阅记录' }, { status: 404 });
    }

    // 根据订阅类型计算正确到期时间
    const now = new Date();
    let correctExpiry = new Date(now);
    
    switch (latestPayment.plan) {
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

    // 更新用户到期时间
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { premiumExpiry: correctExpiry }
    });

    return NextResponse.json({
      success: true,
      user: {
        email: updated.email,
        plan: latestPayment.plan,
        oldExpiry: user.premiumExpiry,
        newExpiry: updated.premiumExpiry
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
