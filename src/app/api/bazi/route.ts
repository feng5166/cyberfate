import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { getAuthSession } from '@/lib/auth-session';
import { calculateBazi, calculateBaziFromPillars, WUXING_KEYS, analyzeMingGe, getCurrentDayun, getDayunTimeline, analyzeShensha, shenshaNature, analyzeLiunian, analyzeLiuyueRange } from '@/lib/bazi';
import type { ShenshaDisplay } from '@/lib/bazi/types';
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

const GAN = z.enum(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
const ZHI = z.enum(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);

// 八字直输：四柱干支（时柱可选）
const pillarsSchema = z.object({
  yearGan: GAN, yearZhi: ZHI,
  monthGan: GAN, monthZhi: ZHI,
  dayGan: GAN, dayZhi: ZHI,
  hourGan: GAN.optional(), hourZhi: ZHI.optional(),
});

// 请求体验证
const requestSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  // 日期模式 birthDate 必填；八字模式 pillars 必填（二选一，POST 内校验）
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
  ).optional(),
  pillars: pillarsSchema.optional(),
  birthHour: z.number().int().min(-1).max(11).optional(),
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

  // 本端点仅做「排盘」（确定性计算，无 AI 成本）。
  // AI 解读的登录/游客/配额门禁统一在 /api/bazi/stream 的实际生成处执行，
  // 避免与 stream 双重计费，也堵住「重新分析」直接打 stream 绕过配额的漏洞。
  const session = await getAuthSession(req);

  // 轻量防刷（与 stream 的计费限流用不同 key，避免互相占用名额）
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (session?.user?.id) {
    const rl = await checkRateLimit('bazi_chart', session.user.id, 30, 60);
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else {
    const rl = await checkRateLimit('bazi_chart_guest', ip, 20, 3600);
    if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    if (input.name !== undefined) {
      input.name = sanitizeUserInput(input.name, 50);
    }

    // 四柱排盘不依赖性别；仅「大运」依赖阴阳性别定顺逆（阳男阴女顺行/阴男阳女逆行）。
    // 性别未知时仍可排盘，但下面跳过大运计算——否则会给女命出一版方向相反的错误终身大运。
    const genderKnown = input.gender === 'male' || input.gender === 'female';
    const gender: 'male' | 'female' = input.gender === 'female' ? 'female' : 'male';
    const isBaziMode = !!input.pillars;

    let baziResult: ReturnType<typeof calculateBazi>;
    let dayunTimeline: ReturnType<typeof getDayunTimeline> = [];
    let dayunExtra: Record<string, unknown> = {};
    let keyMaterial: Record<string, unknown>;

    if (isBaziMode) {
      // —— 八字直输模式：直接由四柱排盘，无出生日期 ——
      const p = input.pillars!;
      baziResult = calculateBaziFromPillars(p);
      // 终身大运/起运需「出生那一刻到节气的距离」，八字模式无从推算，故不提供
      // （dayunTimeline 留空数组，前端据此隐藏「终身大运表」模块）。
      Object.assign(baziResult, { dayun: { current: undefined } });
      keyMaterial = {
        mode: 'bazi',
        gender,
        y: `${p.yearGan}${p.yearZhi}`,
        m: `${p.monthGan}${p.monthZhi}`,
        d: `${p.dayGan}${p.dayZhi}`,
        h: p.hourGan && p.hourZhi ? `${p.hourGan}${p.hourZhi}` : 'none',
      };
    } else {
      // —— 日期模式（原逻辑）——
      if (!input.birthDate) {
        return Response.json({ error: '请提供出生日期或八字' }, { status: 400 });
      }
      const birthHour = typeof input.birthHour === 'number' ? input.birthHour : -1;
      const shichen = birthHour >= 0 ? (HOUR_TO_SHICHEN[birthHour] || undefined) : undefined;

      // 高精度优先: knowTime + birthHourNum 提供时, 走 calculator 精确分支
      const hasPrecise = input.knowTime !== false && typeof input.birthHourNum === 'number';
      const noTime = birthHour === -1 || (!hasPrecise && !shichen);

      const calcInput: any = { name: input.name, gender, birthDate: input.birthDate };
      if (input.isLunar === true) calcInput.isLunar = true;
      if (noTime) {
        calcInput.knowTime = false;
      } else if (hasPrecise) {
        calcInput.knowTime = true;
        calcInput.birthHourNum = input.birthHourNum;
        calcInput.birthMinute = typeof input.birthMinute === 'number' ? input.birthMinute : 0;
        if (input.lateZiShi === true) calcInput.lateZiShi = true;
      } else {
        calcInput.birthHour = shichen;
      }

      baziResult = calculateBazi(calcInput);

      // 大运顺逆依赖阴阳性别：性别未知时不计算（留空数组，前端据此隐藏「终身大运表」），
      // 不出错误方向的大运。已知性别才走精确节气数日法。
      if (genderKnown) {
        const dayunHour = hasPrecise ? input.birthHourNum : undefined;
        const dayunMinute = hasPrecise ? input.birthMinute : undefined;
        const currentDayun = getCurrentDayun(input.birthDate, gender, dayunHour, dayunMinute);
        dayunTimeline = getDayunTimeline(input.birthDate, gender, dayunHour, dayunMinute);
        const currentDayunItem = dayunTimeline.find(item => item.isCurrent);
        const nextDayunItem = currentDayunItem ? dayunTimeline.find(item => item.index === currentDayunItem.index + 1) : undefined;

        Object.assign(baziResult, {
          dayun: { current: currentDayun ? `${currentDayun.gan}${currentDayun.zhi}` : undefined },
        });

        dayunExtra = {
          ageStart: currentDayunItem?.ageStart,
          ageEnd: currentDayunItem?.ageEnd,
          startYear: currentDayunItem?.yearStart,
          endYear: currentDayunItem?.yearEnd,
          nextGanZhi: nextDayunItem ? `${nextDayunItem.gan}${nextDayunItem.zhi}` : undefined,
          nextStartYear: nextDayunItem?.yearStart,
        };
      } else {
        Object.assign(baziResult, { dayun: { current: undefined } });
      }

      keyMaterial = {
        birthDate: input.birthDate,
        gender,
        isLunar: input.isLunar === true,
        timeMode: noTime ? 'none' : (hasPrecise ? 'precise' : 'coarse'),
        hourNum: hasPrecise ? input.birthHourNum : undefined,
        minute: hasPrecise ? (typeof input.birthMinute === 'number' ? input.birthMinute : 0) : undefined,
        lateZiShi: hasPrecise ? input.lateZiShi === true : undefined,
        shichen: (!noTime && !hasPrecise) ? shichen : undefined,
      };
    }

    const baziResultWithDayun = baziResult;

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

    // —— 首屏结构化命盘模块（确定性，一次性算出）：神煞 / 流年 / 流月 / 终身大运表 ——
    // 流年/流月按北京时间当前公历年计算，确保始终是当年（命盘永久缓存时此两项需按年刷新，见 PRD 评审）
    const curYear = new Date(Date.now() + 8 * 60 * 60 * 1000).getUTCFullYear();
    const shensha: ShenshaDisplay[] = analyzeShensha(baziResult.chart).map((s) => ({
      name: s.name,
      pillars: s.pillars,
      branch: s.branch,
      nature: shenshaNature(s.name),
    }));
    const liunian = analyzeLiunian(baziResult.chart, curYear);
    const liuyue = analyzeLiuyueRange(baziResult.chart, curYear, 1, 12);

    // 生成 cacheKey（与 /api/bazi/stream 共用）。keyMaterial 已在上方按
    // 日期/八字两种模式分别构造，涵盖全部影响排盘的字段，避免串档共享 AI 解读。
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(keyMaterial))
      .digest('hex')
      .slice(0, 16);
    // v6: cacheKey 纳入精确时分/农历/晚子时，修复串档（v5 仅含粗时辰+生辰+性别）
    const cacheKey = `v6:bazi:${hash}`;

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
      // 首屏结构化命盘模块
      shensha,
      liunian,
      liuyue,
      dayunTimeline,
    });
  } catch (error) {
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

// 注意：以下五维分数是「启发式娱乐化展示」，系数为经验拟合（如事业↔木/金），
// 非严格命理推演。对外文案不应宣称为「命理评分」。真正的命理判断以 mingGe（格局/旺衰/用神）为准。
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
