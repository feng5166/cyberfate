import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isUserVip } from '@/lib/quota';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }

    const userId = session.user.id;
    const isVip = await isUserVip(userId);

    const limit = isVip ? 50 : 3;

    const [records, count] = await Promise.all([
      prisma.dailyFortuneQaHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          question: true,
          answer: true,
          createdAt: true,
        },
      }),
      prisma.dailyFortuneQaHistory.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({ records, count, isVip });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
