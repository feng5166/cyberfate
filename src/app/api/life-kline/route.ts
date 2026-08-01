import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { computeLifeKline } from '@/lib/bazi';
import { isUserVip } from '@/lib/quota';
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
  /** 请求分维度曲线（VIP 能力；非 VIP 请求也不报错，只是剥除 dims） */
  withDims: z.boolean().optional(),
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
  if (session?.user?.id) {
    const rl = await checkRateLimit('life_kline', session.user.id, 30, 60);
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else {
    const rl = await checkRateLimit('life_kline_guest', ip, 20, 3600);
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

    // 分维度曲线是 VIP 权益：金额/权益一律服务端校验，不信任前端
    const wantDims = input.withDims === true && Boolean(session?.user?.id);
    const isVip = wantDims ? await isUserVip(session!.user!.id!) : false;
    if (!isVip) {
      for (const p of result.points) delete p.dims;
    }

    return Response.json({ success: true, data: result, vipDims: isVip });
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
