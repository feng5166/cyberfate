import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { isUserVip } from '@/lib/quota';

const MAX_PROFILES = 5;
const MAX_PROFILES_VIP = 20; // PRD-BAZI-V2 P1-B：修复「VIP 无限」假承诺，真实上限 20

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

  let profiles = await prisma.baziProfile.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  // 自动初始化：已登录用户无档案时，从账户基本信息创建主档案
  if (profiles.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true, birthDate: true, birthHour: true, gender: true },
    });

    const validGender = user?.gender === 'male' || user?.gender === 'female' ? user.gender : null;
    const validBirthDate = user?.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(user.birthDate) ? user.birthDate : null;
    const validBirthHour = user?.birthHour !== undefined && user.birthHour !== null
      ? String(user.birthHour)
      : '-1';

    if (validBirthDate && validGender) {
      const label = sanitizeUserInput(user?.nickname || '我', 10);
      const name = sanitizeUserInput(user?.nickname || '我', 10);
      const created = await prisma.baziProfile.create({
        data: {
          userId: session.user.id,
          label,
          name,
          gender: validGender,
          birthDate: validBirthDate,
          birthHour: validBirthHour,
          isPrimary: true,
        },
      });
      profiles = [created];
    }
  }

  // 自动修正脏数据：label 应与 name 保持一致（旧版本 label/name 分开填导致不一致）
  const dirtyProfiles = profiles.filter((p) => p.name && p.label !== p.name);
  if (dirtyProfiles.length > 0) {
    await Promise.all(
      dirtyProfiles.map((p) =>
        prisma.baziProfile.update({
          where: { id: p.id },
          data: { label: p.name },
        })
      )
    );
    profiles = profiles.map((p) =>
      dirtyProfiles.find((d) => d.id === p.id) ? { ...p, label: p.name } : p
    );
  }

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
  const vip = await isUserVip(session.user.id);
  const cap = vip ? MAX_PROFILES_VIP : MAX_PROFILES;
  if (count >= cap) {
    return NextResponse.json(
      { error: vip ? `最多可保存${MAX_PROFILES_VIP}个命盘` : `免费版最多保存${MAX_PROFILES}个命盘，升级 VIP 可存 ${MAX_PROFILES_VIP} 个` },
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
