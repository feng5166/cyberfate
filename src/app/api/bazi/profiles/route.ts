import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/utils/sanitize';

const MAX_PROFILES = 5;

const createSchema = z.object({
  label: z.string().min(1, '请填写显示名称').max(10, '显示名称最多10字'),
  name: z.string().min(1, '请填写姓名').max(10, '姓名最多10字'),
  gender: z.enum(['male', 'female']),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.string().regex(/^(-1|0|1|2|3|4|5|6|7|8|9|10|11)$/, '时辰不合法'),
  birthPlace: z.string().max(100).optional(),
  isLunar: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const profiles = await prisma.baziProfile.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ data: profiles });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join('，') },
      { status: 400 }
    );
  }

  const count = await prisma.baziProfile.count({
    where: { userId: session.user.id },
  });
  if (count >= MAX_PROFILES) {
    return NextResponse.json(
      { error: `免费版最多保存${MAX_PROFILES}个命盘，升级 VIP 无限制` },
      { status: 403 }
    );
  }

  const data = parsed.data;
  const cleanLabel = sanitizeUserInput(data.label, 10);
  const cleanName = sanitizeUserInput(data.name, 10);

  if (data.isPrimary) {
    await prisma.baziProfile.updateMany({
      where: { userId: session.user.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const profile = await prisma.baziProfile.create({
    data: {
      userId: session.user.id,
      label: cleanLabel,
      name: cleanName,
      gender: data.gender,
      birthDate: data.birthDate,
      birthHour: data.birthHour,
      birthPlace: data.birthPlace,
      isLunar: data.isLunar ?? false,
      isPrimary: data.isPrimary ?? false,
    },
  });

  return NextResponse.json({ data: profile });
}
