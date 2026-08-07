import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { computeLiuyueKline } from '@/lib/bazi';
import { isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { getBeijingDate } from '@/lib/timezone';

const SERVICE = 'api/life-kline/months';

const requestSchema = z.object({
  gender: z.enum(['male', 'female']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isLunar: z.boolean().optional(),
  knowTime: z.boolean().optional(),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  lateZiShi: z.boolean().optional(),
  year: z.number().int().min(1900).max(2130),
});

/**
 * 流月下钻（P1-B）：某一年的 12 根月K线。VIP 专属，服务端校验。
 */
export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ success: false, error: '未登录' }, { status: 401 });

  const vip = await isUserVip(userId);
  if (!vip) return Response.json({ success: false, error: '流月下钻为 VIP 专属功能' }, { status: 403 });

  const rl = await checkRateLimit('life_kline_months', userId, 60, 60);
  if (!rl.allowed) return Response.json({ success: false, error: '请求过于频繁，请稍后再试' }, { status: 429 });

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const currentYear = getBeijingDate().getFullYear();
    const result = computeLiuyueKline(
      {
        gender: input.gender,
        birthDate: input.birthDate,
        isLunar: input.isLunar,
        knowTime: input.knowTime,
        birthHourNum: input.birthHourNum,
        birthMinute: input.birthMinute,
        lateZiShi: input.lateZiShi,
      },
      input.year,
      { currentYear },
    );

    if (!result) {
      return Response.json({ success: false, error: '该年份不在K线跨度内' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: error.issues[0]?.message ?? '参数错误' },
        { status: 400 },
      );
    }
    logger.error(SERVICE, 'compute failed', error instanceof Error ? error : undefined);
    return Response.json({ success: false, error: '计算失败，请稍后再试' }, { status: 500 });
  }
}
