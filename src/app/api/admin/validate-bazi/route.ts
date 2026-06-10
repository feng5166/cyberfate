import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import {
  calculateBazi,
  getCurrentDayun,
  getDayGanzhi,
  getDayunTimeline,
  getLunarDate,
  getYearGanzhi,
} from '@/lib/bazi';
import type { Gender } from '@/lib/bazi/types';

const HOUR_TO_SHICHEN: Record<number, string> = {
  [-1]: '不知道',
  0: '子时', 1: '丑时', 2: '寅时', 3: '卯时',
  4: '辰时', 5: '巳时', 6: '午时', 7: '未时',
  8: '申时', 9: '酉时', 10: '戌时', 11: '亥时',
};

const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.number().int().min(-1).max(11),
  gender: z.enum(['male', 'female']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: '权限不足，仅管理员可访问' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const shichen = HOUR_TO_SHICHEN[input.birthHour] || '不知道';
    const targetDate = input.targetDate ?? new Date().toISOString().split('T')[0];

    const baziResult = calculateBazi({
      gender: input.gender as Gender,
      birthDate: input.birthDate,
      birthHour: shichen as Parameters<typeof calculateBazi>[0]['birthHour'],
    });

    const dayGanzhi = getDayGanzhi(targetDate);
    const lunarDate = getLunarDate(input.birthDate);
    const targetLunarDate = getLunarDate(targetDate);
    const yearGanzhi = getYearGanzhi(input.birthDate);
    const todayYearGanzhi = getYearGanzhi(targetDate);
    const dayun = getCurrentDayun(input.birthDate, input.gender as Gender);
    const dayunTimeline = getDayunTimeline(input.birthDate, input.gender as Gender);

    return NextResponse.json({
      input: { birthDate: input.birthDate, birthHour: shichen, gender: input.gender, targetDate },
      chart: {
        year: baziResult.chart.year,
        month: baziResult.chart.month,
        day: baziResult.chart.day,
        hour: baziResult.chart.hour,
      },
      wuxing: baziResult.wuxing,
      dayMaster: baziResult.dayMaster,
      lunarBirthDate: lunarDate,
      yearGanzhi,
      currentDayun: dayun,
      dayunTimeline,
      targetDateInfo: {
        date: targetDate,
        dayGanzhi,
        lunarDate: targetLunarDate,
        liunianGanzhi: todayYearGanzhi,
      },
      _note: '此端点仅供命理专家人工校验使用，输出为原始中间计算结果',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '参数错误：' + error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('[admin/validate-bazi]', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
