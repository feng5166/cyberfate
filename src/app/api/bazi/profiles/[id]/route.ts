import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/utils/sanitize';

const patchSchema = z
  .object({
    label: z.string().min(1).max(10).optional(),
    name: z.string().min(1).max(10).optional(),
    gender: z.enum(['male', 'female']).optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')
      .optional(),
    birthHour: z
      .string()
      .regex(/^(-1|0|1|2|3|4|5|6|7|8|9|10|11)$/, '时辰不合法')
      .optional(),
    birthPlace: z.string().max(100).nullable().optional(),
    isLunar: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
    baziResult: z.unknown().optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: '档案 id 缺失' }, { status: 400 });
  }

  const existing = await prisma.baziProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: '档案不存在' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join('，') },
      { status: 400 }
    );
  }

  const patch = parsed.data;
  const data: Record<string, unknown> = {};
  if (patch.label !== undefined) data.label = sanitizeUserInput(patch.label, 10);
  if (patch.name !== undefined) data.name = sanitizeUserInput(patch.name, 10);
  if (patch.gender !== undefined) data.gender = patch.gender;
  if (patch.birthDate !== undefined) data.birthDate = patch.birthDate;
  if (patch.birthHour !== undefined) data.birthHour = patch.birthHour;
  if (patch.birthPlace !== undefined) data.birthPlace = patch.birthPlace;
  if (patch.isLunar !== undefined) data.isLunar = patch.isLunar;
  if (patch.isPrimary !== undefined) data.isPrimary = patch.isPrimary;
  if (patch.baziResult !== undefined) data.baziResult = patch.baziResult as object | null;

  if (patch.isPrimary === true) {
    await prisma.baziProfile.updateMany({
      where: { userId: session.user.id, isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  const profile = await prisma.baziProfile.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: profile });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: '档案 id 缺失' }, { status: 400 });
  }

  const existing = await prisma.baziProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: '档案不存在' }, { status: 404 });
  }

  if (existing.isPrimary) {
    return NextResponse.json(
      { error: '主档案不可删除' },
      { status: 403 }
    );
  }

  await prisma.baziProfile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
