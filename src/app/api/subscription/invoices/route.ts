import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户所有订单（按时间倒序）
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // 映射 plan 名称
    const planNames = {
      monthly: '基础版（月卡）',
      quarterly: '专业版（季卡）',
      yearly: '尊享版（年卡）'
    };

    const invoices = orders.map(order => ({
      id: order.id,
      date: order.createdAt.toISOString().split('T')[0],
      description: planNames[order.plan] || order.plan,
      amount: order.amount / 100, // 分转元
      currency: 'CNY',
      status: order.status === 'paid' ? 'paid' : order.status === 'failed' ? 'failed' : 'pending'
    }));

    return NextResponse.json({ invoices });
    
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || '获取账单历史失败' },
      { status: 500 }
    );
  }
}
