import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/cache/redis';

// GET: 获取用户出生信息
export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nickname: true, birthDate: true, birthHour: true, gender: true },
  });

  return NextResponse.json({ data: user });
}

// POST: 保存用户出生信息
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await req.json();
  const { name, birthDate, birthHour, gender } = body;

  if (birthDate !== undefined && birthDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: '日期格式不正确，应为 YYYY-MM-DD' }, { status: 400 });
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { birthDate: true, birthHour: true, nickname: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname: name, birthDate, birthHour, gender },
  });

  // BUG-028: 生日变更时清除旧的 AI 缓存
  if (oldUser?.birthDate && oldUser.birthDate !== birthDate) {
    try {
      const oldNameSlug = oldUser.nickname?.trim() || '_anonymous';
      const oldCacheKey = `bazi:${oldUser.birthDate}:${oldUser.birthHour ?? -1}:${oldNameSlug}`;
      await (redis as any).del(oldCacheKey);
    } catch {
      // 缓存清除失败不阻塞主流程
    }
  }

  return NextResponse.json({ success: true });
}
