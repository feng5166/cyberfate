import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateBazi, WUXING_KEYS, analyzeMingGe, getCurrentDayun, getDayunTimeline } from '@/lib/bazi';
import { checkBaziQuota, refundQuota } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import type { FiveDimensions, MingGeInfo, PillarRecord, WuxingCount } from '@/lib/bazi/types';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';

const SERVICE = 'api/bazi';

// 时辰映射：数字 -> 时辰名称（不含 -1，单独处理）
const HOUR_TO_SHICHEN: Record<number, string> = {
  0: '子时',
  1: '丑时',
  2: '寅时',
  3: '卯时',
  4: '辰时',
  5: '巳时',
  6: '午时',
  7: '未时',
  8: '申时',
  9: '酉时',
  10: '戌时',
  11: '亥时',
};

// 请求体验证
const requestSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
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
  birthHour: z.number().int().min(-1).max(11),
  birthPlace: z.string().optional(),
  // 新增高精度字段（全部可选, 向后兼容）
  isLunar: z.boolean().optional(),
  knowTime: z.boolean().optional(),
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  lateZiShi: z.boolean().optional(),
  forceRefresh: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  // 检查登录状态和配额（游客可以试用）
  const session = await getServerSession(authOptions);
  let baziQuotaConsumed = false;

  // B-6: Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (session?.user?.id) {
    const rl = await checkRateLimit('ai_bazi', session.user.id, 10, 60);
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else {
    const rl = await checkRateLimit('ai_bazi_guest', ip, 3, 3600);
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  // B-4 + BUG-012 + H2: 原子 checkBaziQuota（avoid peek-then-deduct race）
  if (session?.user?.id) {
    const quota = await checkBaziQuota(session.user.id);

    if (!quota.hasQuota) {
      return Response.json({
        error: 'QUOTA_EXCEEDED',
        message: '今日免费解读次数已用完，请升级 VIP'
      }, { status: 403 });
    }
    baziQuotaConsumed = !quota.isVip;
  }

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    if (input.name !== undefined) {
      input.name = sanitizeUserInput(input.name, 50);
    }

    const shichen = input.birthHour >= 0 ? (HOUR_TO_SHICHEN[input.birthHour] || undefined) : undefined;

    // 高精度优先: knowTime + birthHourNum 提供时, 走 calculator 精确分支
    const hasPrecise = input.knowTime !== false && typeof input.birthHourNum === 'number';
    const noTime = input.birthHour === -1 || (!hasPrecise && !shichen);

    const calcInput: any = {
      name: input.name,
      gender: input.gender === 'unknown' ? 'male' : (input.gender || 'male'),
      birthDate: input.birthDate,
    };

    if (input.isLunar === true) calcInput.isLunar = true;

    if (noTime) {
      calcInput.knowTime = false;
      // birthHour 不传，calculator 里 if(birthHour) 为 false，时柱为 null
    } else if (hasPrecise) {
      calcInput.knowTime = true;
      calcInput.birthHourNum = input.birthHourNum;
      calcInput.birthMinute = typeof input.birthMinute === 'number' ? input.birthMinute : 0;
      if (input.lateZiShi === true) calcInput.lateZiShi = true;
    } else {
      calcInput.birthHour = shichen;
    }

    // 1. 计算八字
    const baziResult = calculateBazi(calcInput);

    // 获取当前大运（精确节气数日法；提供精确时分时一并传入，起运更准）
    const gender = input.gender === 'unknown' ? 'male' : (input.gender || 'male');
    const dayunHour = hasPrecise ? input.birthHourNum : undefined;
    const dayunMinute = hasPrecise ? input.birthMinute : undefined;
    const currentDayun = getCurrentDayun(input.birthDate, gender as 'male' | 'female', dayunHour, dayunMinute);
    const dayunTimeline = getDayunTimeline(input.birthDate, gender as 'male' | 'female', dayunHour, dayunMinute);
    const currentDayunItem = dayunTimeline.find(item => item.isCurrent);
    const nextDayunItem = currentDayunItem ? dayunTimeline.find(item => item.index === currentDayunItem.index + 1) : undefined;

    // 大运结束年/下一步起始年直接取库的精确公历年份段
    const dayunEndYear = currentDayunItem?.yearEnd;
    const nextDayunStartYear = nextDayunItem?.yearStart;

    const baziResultWithDayun = Object.assign(baziResult, {
      dayun: {
        current: currentDayun ? `${currentDayun.gan}${currentDayun.zhi}` : undefined,
      }
    });

    const dayunExtra = {
      ageStart: currentDayunItem?.ageStart,
      ageEnd: currentDayunItem?.ageEnd,
      startYear: currentDayunItem?.yearStart,
      endYear: dayunEndYear,
      nextGanZhi: nextDayunItem ? `${nextDayunItem.gan}${nextDayunItem.zhi}` : undefined,
      nextStartYear: nextDayunStartYear,
    };

    // 处理时柱（可能为 null）：无时辰时用占位值维持结构，但通过 hasHour=false 告知前端不要展示
    const hasHour = baziResult.chart.hour != null;
    const hourPillar = baziResult.chart.hour ?? {
      gan: '甲',
      zhi: '子',
      ganWuxing: '木',
      zhiWuxing: '水',
    };

    const pillars: PillarRecord = {
      year: {
        gan: baziResult.chart.year.gan,
        zhi: baziResult.chart.year.zhi,
        ganWuxing: baziResult.chart.year.ganWuxing,
        zhiWuxing: baziResult.chart.year.zhiWuxing,
      },
      month: {
        gan: baziResult.chart.month.gan,
        zhi: baziResult.chart.month.zhi,
        ganWuxing: baziResult.chart.month.ganWuxing,
        zhiWuxing: baziResult.chart.month.zhiWuxing,
      },
      day: {
        gan: baziResult.chart.day.gan,
        zhi: baziResult.chart.day.zhi,
        ganWuxing: baziResult.chart.day.ganWuxing,
        zhiWuxing: baziResult.chart.day.zhiWuxing,
      },
      hour: {
        gan: hourPillar.gan,
        zhi: hourPillar.zhi,
        ganWuxing: hourPillar.ganWuxing,
        zhiWuxing: hourPillar.zhiWuxing,
      },
    };

    const fiveDimensions = calculateFiveDimensions(pillars, baziResult.wuxing);

    const mingGeResult = analyzeMingGe(baziResult.chart);
    const mingGe: MingGeInfo = {
      geju: mingGeResult.geju,
      rizhuStrength: mingGeResult.rizhuStrength,
      yongShen: mingGeResult.yongShen,
      jiShen: mingGeResult.jiShen,
    };

    // 生成 cacheKey（与 /api/bazi/stream 共用，对应 generateBaziAnalysis 内部规则）
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({
        birthDate: input.birthDate,
        birthHour: input.birthHour,
        gender: input.gender ?? 'unknown',
      }))
      .digest('hex')
      .slice(0, 16);
    // v5: 主报告改为注入确定性工具链事实（格局/用神/神煞/刑冲/大运），与旧缓存不兼容，故升版
    const cacheKey = `v5:bazi:${hash}`;

    return Response.json({
      pillars,
      hasHour,
      wuxing: baziResult.wuxing,
      aiAnalysis: '',
      fiveDimensions,
      traits: [],
      mingGe,
      birthPlace: input.birthPlace,
      zodiac: baziResult.zodiac,
      cacheKey,
      baziResult: baziResultWithDayun,
      dayunExtra,
    });
  } catch (error) {
    if (baziQuotaConsumed && session?.user?.id) {
      try { await refundQuota(session.user.id, 'baziAiCount'); } catch {}
    }
    logger.error(SERVICE, 'Bazi API error', error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: '输入数据格式错误：' + error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    return Response.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

function calculateFiveDimensions(pillars: PillarRecord, wuxing: WuxingCount): FiveDimensions {
  const total = Object.values(wuxing).reduce((sum, value) => sum + value, 0) || 1;
  const average = total / 5 || 1;
  const clampScore = (value: number) => Math.max(15, Math.min(95, Math.round(value)));
  const ratio = (key: keyof WuxingCount) => (wuxing[key] - average) / average;
  const deviation = Math.sqrt(
    Object.values(wuxing).reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / 5
  );
  const dayElement = pillars.day.ganWuxing;
  const dayKey = WUXING_KEYS[dayElement];
  const dayBoost = ratio(dayKey) * 8;

  return {
    career: clampScore(65 + ratio('wood') * 12 + ratio('metal') * 8 + dayBoost),
    wealth: clampScore(60 + ratio('earth') * 12 + ratio('metal') * 6 - ratio('fire') * 4),
    relationship: clampScore(62 + ratio('water') * 10 + ratio('fire') * 8 + ratio('wood') * 4),
    health: clampScore(85 - deviation * 12),
    studies: clampScore(64 + ratio('water') * 10 + ratio('wood') * 6 + dayBoost * 0.5),
  };
}
