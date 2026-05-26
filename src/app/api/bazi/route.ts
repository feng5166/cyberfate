import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sanitizeUserInput } from '@/lib/utils/sanitize';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateBazi, WUXING_KEYS, analyzeMingGe, getCurrentDayun } from '@/lib/bazi';
import { generateBaziAnalysis } from '@/lib/ai';
import { peekBaziQuota, deductBaziQuota, isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import type { BaziAnalysis, FiveDimensions, MingGeInfo, PillarRecord, WuxingCount } from '@/lib/bazi/types';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
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
  birthHour: z.number().int().min(0).max(11),
  birthPlace: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  try {
    // 检查登录状态和配额（游客可以试用）
    const session = await getServerSession(authOptions);

    // B-6: Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (session?.user?.id) {
      const rl = await checkRateLimit('ai_bazi', session.user.id, 10, 60);
      if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    } else {
      const rl = await checkRateLimit('ai_bazi_guest', ip, 3, 3600);
      if (!rl.allowed) return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    // B-4 + BUG-012: 查一次 isVip，传给 peekBaziQuota 避免重复查库
    let cachedIsVip = false;
    if (session?.user?.id) {
      cachedIsVip = await isUserVip(session.user.id);
      const { hasQuota } = await peekBaziQuota(session.user.id, cachedIsVip);

      if (!hasQuota) {
        return Response.json({
          error: 'QUOTA_EXCEEDED',
          message: '今日免费解读次数已用完，请升级 VIP'
        }, { status: 403 });
      }
    }
    
    const body = await req.json();
    const input = requestSchema.parse(body);
    if (input.name !== undefined) {
      input.name = sanitizeUserInput(input.name, 50);
    }

    const shichen = HOUR_TO_SHICHEN[input.birthHour] || '午时';

    // 1. 计算八字
    const baziResult = calculateBazi({
      name: input.name,
      gender: input.gender === 'unknown' ? 'male' : (input.gender || 'male'),
      birthDate: input.birthDate,
      birthHour: shichen as '子时' | '丑时' | '寅时' | '卯时' | '辰时' | '巳时' | '午时' | '未时' | '申时' | '酉时' | '戌时' | '亥时' | '不知道',
    });

    // 获取当前大运
    const gender = input.gender === 'unknown' ? 'male' : (input.gender || 'male');
    const currentDayun = getCurrentDayun(input.birthDate, gender as 'male' | 'female');
    const baziResultWithDayun = Object.assign(baziResult, {
      dayun: {
        current: currentDayun ? `${currentDayun.gan}${currentDayun.zhi}` : undefined,
      }
    });

    // 2. AI 解读（可能失败，优雅降级）
    let analysisObj: BaziAnalysis;
    try {
      analysisObj = await withCircuitBreaker('deepseek-bazi', () =>
        withAiTimeout(
          () => generateBaziAnalysis(baziResultWithDayun, input.name, {
            birthDate: input.birthDate,
            birthHour: input.birthHour,
            gender: input.gender ?? 'unknown',
          }),
          25_000,
          () => ({ ...generateFallbackAnalysis(baziResult), _source: 'fallback' as const })
        )
      );
    } catch (aiError) {
      logger.error(SERVICE, 'AI analysis failed', aiError instanceof Error ? aiError : undefined);
      analysisObj = generateFallbackAnalysis(baziResult);
    }
    
    // 将分析对象转换为可读文本
    const aiAnalysis = formatAnalysis(analysisObj);
    const _aiSource = (analysisObj as any)._source ?? 'unknown';

    // BUG-012: 仅在非 fallback 时扣减配额（B-4: 用已缓存的 isVip）
    if (session?.user?.id && _aiSource !== 'fallback' && !cachedIsVip) {
      await deductBaziQuota(session.user.id);
    }
    
    // 处理时柱（可能为 null）
    // Provide a valid placeholder pillar when hour data is unavailable.
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

    return Response.json({
      pillars,
      wuxing: baziResult.wuxing,
      aiAnalysis,
      fiveDimensions,
      traits: (analysisObj as any).traits || [],
      mingGe,
      birthPlace: input.birthPlace,
      _source: _aiSource,
      zodiac: baziResult.zodiac,
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

// 将分析对象格式化为可读文本
function formatAnalysis(analysis: BaziAnalysis): string {
  return `【日主分析】
${analysis.dayMasterAnalysis}

【性格特点】
${analysis.personality}

【事业运势】
${analysis.career}

【财运分析】
${analysis.wealth}

【感情运势】
${analysis.relationship}

【健康提示】
${analysis.health}${analysis.dayunAnalysis ? `\n\n【大运流年】\n${analysis.dayunAnalysis}` : ''}`;
}

// 降级分析（当 AI 不可用时）
function generateFallbackAnalysis(bazi: ReturnType<typeof calculateBazi>): BaziAnalysis {
  const { wuxing, dayMaster } = bazi;
  
  const wuxingNames: Record<string, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  };
  
  // 找出最旺和最弱的五行
  const entries = Object.entries(wuxing) as [keyof typeof wuxing, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = wuxingNames[sorted[0][0]];
  const weakest = sorted[sorted.length - 1][1] === 0 
    ? wuxingNames[sorted[sorted.length - 1][0]]
    : null;
  
  return {
    dayMasterAnalysis: `日主为「${dayMaster}」，五行中${strongest}最旺${weakest ? `，${weakest}较弱或缺失` : ''}。八字整体${sorted[0][1] - sorted[sorted.length - 1][1] <= 2 ? '较为平衡' : '有所偏向'}。`,
    personality: '您性格中有多元的特质，善于适应不同环境，具有一定的灵活性和韧性。',
    career: '事业方面有发展潜力，建议把握机遇，稳步前进，注重积累和提升。',
    wealth: '财运方面需要稳健理财，避免冲动消费，适当投资可带来回报。',
    relationship: '感情方面宜真诚相待，注重沟通和理解，感情运势稳定。',
    health: '注意劳逸结合，保持良好作息，适当运动有助于身心健康。',
  };
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
