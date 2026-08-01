import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const SERVICE = 'api/life-kline/remind';

const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female']),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  targetYear: z.number().int().min(2026).max(2130),
  dayunGanZhi: z.string().min(2).max(2),
});

/**
 * 换大运提醒意向（P2-B）：仅登录用户，落库意向；通知通道 V2.1 上线后按 targetYear 触达。
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ success: false, error: '未登录' }, { status: 401 });

  const rl = await checkRateLimit('kline_remind', userId, 10, 60);
  if (!rl.allowed) return Response.json({ success: false, error: '请求过于频繁' }, { status: 429 });

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const birthHash = createHash('sha256')
      .update(`${input.birthDate}|${input.gender}|${input.birthHourNum ?? 'x'}`)
      .digest('hex')
      .slice(0, 32);

    await prisma.klineRemindIntent.upsert({
      where: { userId_birthHash_targetYear: { userId, birthHash, targetYear: input.targetYear } },
      create: { userId, birthHash, targetYear: input.targetYear, dayunGanZhi: input.dayunGanZhi },
      update: { dayunGanZhi: input.dayunGanZhi },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: '参数错误' }, { status: 400 });
    }
    logger.error(SERVICE, 'remind failed', error instanceof Error ? error : undefined);
    return Response.json({ success: false, error: '提交失败，请稍后再试' }, { status: 500 });
  }
}
