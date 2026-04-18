import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // [安全修复] 统一小写比较，防止大小写绕过
  const sessionEmail = session.user.email.toLowerCase().trim();
  const normalizedAdmins = ADMIN_EMAILS.map(e => e.toLowerCase().trim());
  if (!normalizedAdmins.includes(sessionEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const body = await req.json();
    const { email, page = 1 } = body;

    if (!email) {
      return NextResponse.json({ error: '缺少邮箱' }, { status: 400 });
    }

    const PAGE_SIZE = 20;
    const skip = (Math.max(1, page) - 1) * PAGE_SIZE;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        // BUG-023: 加分页，防止大量数据 OOM
        orders: { orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip },
      },
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
    
  } catch (error: unknown) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: '查询失败，请稍后重试' },
      { status: 500 }
    );
  }
}
