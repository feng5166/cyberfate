import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        subscriptions: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      orders: user.orders.map(o => ({
        id: o.id,
        plan: o.plan,
        amount: o.amount,
        status: o.status,
        payMethod: o.payMethod,
        createdAt: o.createdAt,
        paidAt: o.paidAt
      })),
      subscriptions: user.subscriptions.map(s => ({
        id: s.id,
        plan: s.plan,
        status: s.status,
        startAt: s.startAt,
        expireAt: s.expireAt,
        createdAt: s.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
