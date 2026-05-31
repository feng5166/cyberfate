import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const userId = session.user.id;
  const vip = await isVip(userId);

  // 免费用户最多 3 条，Pro 用户默认 20 条
  const searchParams = req.nextUrl.searchParams;
  const requestedLimit = parseInt(searchParams.get('limit') || '', 10);
  const maxLimit = vip ? 100 : 3;
  const limit = Math.min(requestedLimit > 0 ? requestedLimit : (vip ? 20 : 3), maxLimit);

  const records = await prisma.dailyDetailHistory.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
    select: {
      id: true,
      date: true,
      summary: true,
      fullContent: true,
      generatedAt: true,
    },
  });

  return NextResponse.json({ records, isVip: vip });
}
