import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const SERVICE = 'api/life-kline/backtest-vote';

const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female']),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  year: z.number().int().min(1900).max(2130),
  age: z.number().int().min(1).max(100),
  score: z.number().int().min(0).max(100),
  level: z.enum(['极盛', '上佳', '平稳', '承压', '低谷']),
  kind: z.enum(['peak', 'trough']),
  vote: z.enum(['yes', 'no']),
});

/**
 * 人生K线回测投票（P0-A）：仅登录用户落库，游客端只打埋点不调本接口。
 * 同一用户同一命盘同一年份可改票（upsert）。
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ success: false, error: '未登录' }, { status: 401 });

  const rl = await checkRateLimit('kline_backtest_vote', userId, 20, 60);
  if (!rl.allowed) return Response.json({ success: false, error: '请求过于频繁' }, { status: 429 });

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const birthHash = createHash('sha256')
      .update(`${input.birthDate}|${input.gender}|${input.birthHourNum ?? 'x'}`)
      .digest('hex')
      .slice(0, 32);

    await prisma.klineBacktestVote.upsert({
      where: { userId_birthHash_year: { userId, birthHash, year: input.year } },
      create: {
        userId,
        birthHash,
        year: input.year,
        age: input.age,
        score: input.score,
        level: input.level,
        kind: input.kind,
        vote: input.vote,
      },
      update: { vote: input.vote, score: input.score, level: input.level, kind: input.kind },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: '参数错误' }, { status: 400 });
    }
    logger.error(SERVICE, 'vote failed', error instanceof Error ? error : undefined);
    return Response.json({ success: false, error: '提交失败，请稍后再试' }, { status: 500 });
  }
}
