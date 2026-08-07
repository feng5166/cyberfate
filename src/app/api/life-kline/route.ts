import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { computeLifeKline } from '@/lib/bazi';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/ip';
import { getBeijingDate } from '@/lib/timezone';

const SERVICE = 'api/life-kline';

const requestSchema = z.object({
  name: z.string().max(50).optional(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD').refine(
    (d) => { const y = parseInt(d.slice(0, 4), 10); return y >= 1900 && y <= 2030; },
    '出生年份须在 1900 至 2030 之间'
  ).refine(
    (d) => {
      const [y, m, day] = d.split('-').map(Number);
      const date = new Date(y, m - 1, day);
      return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day;
    },
    '日期不合法（如 2月30日）'
  ),
  isLunar: z.boolean().optional(),
  knowTime: z.boolean().optional(),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  lateZiShi: z.boolean().optional(),
});

/**
 * 人生K线：纯确定性排盘计算（无 AI 成本），登录/游客均可用。
 * AI 问答走 /api/bazi/chat（VIP 门禁在彼处）。
 */
export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const session = await getAuthSession(req);
  const ip = getClientIp(req);
  // failOpen: true —— 为什么这个端点零成本、Redis 挂了也该放行：
  // 1. 本端点的全部工作就是调 computeLifeKline（src/lib/bazi/lifeKline.ts，同步纯函数：
  //    calculateBazi + analyzeMingGe + 大运/流年打分），无 AI、无网络、无 DB 写。
  // 2. 本模块的 AI 问答走 /api/bazi/chat（VIP 门禁 + bazi_chat 限流仍 fail-closed），
  //    本端点不经手任何按量计费资源。
  // 3. 被刷的最坏后果只是 CPU；而 fail-closed 会让「人生K线」整个模块在 Redis 抖动时 503。
  if (session?.user?.id) {
    const rl = await checkRateLimit('life_kline', session.user.id, 30, 60, { failOpen: true });
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else {
    const rl = await checkRateLimit('life_kline_guest', ip, 20, 3600, { failOpen: true });
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    const currentYear = getBeijingDate().getFullYear();
    const result = computeLifeKline(
      {
        gender: input.gender,
        birthDate: input.birthDate,
        isLunar: input.isLunar,
        knowTime: input.knowTime,
        birthHourNum: input.birthHourNum,
        birthMinute: input.birthMinute,
        lateZiShi: input.lateZiShi,
      },
      { currentYear },
    );

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
