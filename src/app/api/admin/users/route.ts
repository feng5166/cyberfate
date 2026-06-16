import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';
import type { Prisma } from '@prisma/client';

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSizeRaw = parseInt(searchParams.get('pageSize') || '20', 10) || 20;
    const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
    const search = (searchParams.get('search') || '').trim();
    const vipFilter = (searchParams.get('vipFilter') || 'all') as 'all' | 'vip' | 'free';
    const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest' | 'active';

    const now = new Date();
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (vipFilter === 'vip') {
      where.subscriptions = { some: { status: 'active', expireAt: { gt: now } } };
    } else if (vipFilter === 'free') {
      where.NOT = { subscriptions: { some: { status: 'active', expireAt: { gt: now } } } };
    }

    let orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'active') {
      orderBy = { orders: { _count: 'desc' } };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const items = users.map((u) => {
      const latest = u.subscriptions[0];
      const isVip = !!latest && latest.status === 'active' && latest.expireAt > now;
      return {
        id: u.id,
        email: u.email,
        nickname: u.nickname,
        createdAt: u.createdAt,
        isVip,
        latestSubscription: latest
          ? {
              plan: latest.plan,
              status: latest.status,
              expireAt: latest.expireAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      users: items,
      total,
      page,
      pageSize,
    });
  } catch (error: unknown) {
    console.error('Admin list users error:', error);
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 });
  }
}
