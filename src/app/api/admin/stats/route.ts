import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

// 计算 UTC+8 时区的"今日 0 点"和"本月 1 日 0 点"对应的 UTC 时间
function shanghaiStartOfTodayUtc(): Date {
  const now = new Date();
  const SH_OFFSET_MS = 8 * 60 * 60 * 1000;
  // 把当前时间换算成 UTC+8 视角下的"年月日"
  const shNow = new Date(now.getTime() + SH_OFFSET_MS);
  const y = shNow.getUTCFullYear();
  const m = shNow.getUTCMonth();
  const d = shNow.getUTCDate();
  // 这一天 UTC+8 0 点 == UTC 前一天 16 点
  return new Date(Date.UTC(y, m, d) - SH_OFFSET_MS);
}

function shanghaiStartOfMonthUtc(): Date {
  const now = new Date();
  const SH_OFFSET_MS = 8 * 60 * 60 * 1000;
  const shNow = new Date(now.getTime() + SH_OFFSET_MS);
  const y = shNow.getUTCFullYear();
  const m = shNow.getUTCMonth();
  return new Date(Date.UTC(y, m, 1) - SH_OFFSET_MS);
}

export async function GET() {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const now = new Date();
    const todayStart = shanghaiStartOfTodayUtc();
    const monthStart = shanghaiStartOfMonthUtc();

    const [totalUsers, vipUsers, newUsersToday, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: { status: 'active', expireAt: { gt: now } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          paidAt: { gte: monthStart },
        },
      }),
    ]);

    const monthRevenueCents = revenueAgg._sum.amount ?? 0;

    return NextResponse.json({
      totalUsers,
      vipUsers,
      newUsersToday,
      monthRevenue: Number((monthRevenueCents / 100).toFixed(2)),
    });
  } catch (error: unknown) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: '统计失败，请稍后重试' }, { status: 500 });
  }
}
