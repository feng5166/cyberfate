import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 获取用户出生信息
export async function GET() {
  const session = await getServerSession(authOptions);
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await req.json();
  const { name, birthDate, birthHour, gender } = body;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname: name, birthDate, birthHour, gender },
  });

  return NextResponse.json({ success: true });
}
