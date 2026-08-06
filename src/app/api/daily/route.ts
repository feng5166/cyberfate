import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { calculateBazi, getCurrentDayun, getDayGanzhi, getLunarDate, getYearGanzhi } from '@/lib/bazi';
import { generateDailyFortune } from '@/lib/ai';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { logger } from '@/lib/logger';
import { checkDailyQuota, refundQuota } from '@/lib/quota';
import { getTodayBeijing } from '@/lib/timezone';

const SERVICE = 'api/daily';

// 12地支 -> 意象插画 URL
const DIZHI_IMAGES: Record<string, string> = {
  '子': '/images/daily/zi.jpg',
  '丑': '/images/daily/chou.jpg',
  '寅': '/images/daily/yin.jpg',
  '卯': '/images/daily/mao.jpg',
  '辰': '/images/daily/chen.jpg',
  '巳': '/images/daily/si.jpg',
  '午': '/images/daily/wu.jpg',
  '未': '/images/daily/wei.jpg',
  '申': '/images/daily/shen.jpg',
  '酉': '/images/daily/you.jpg',
  '戌': '/images/daily/xu.jpg',
  '亥': '/images/daily/hai.jpg',
};

// 时辰映射：数字 -> 时辰名称
const HOUR_TO_SHICHEN: Record<number, string> = {
  [-1]: '不知道',
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
  gender: z.enum(['male', 'female']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD').optional(),
  birthHour: z.number().int().min(-1).max(11),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '目标日期格式应为 YYYY-MM-DD').optional(),
});

function normalizeRatings(ratings: any, overall: number) {
  return {
    career: ratings?.career ?? 3,
    wealth: ratings?.wealth ?? 3,
    love: ratings?.love ?? 3,
    health: ratings?.health ?? 3,
    studies: ratings?.studies ?? 3,
    social: ratings?.social ?? 3,
  };
}

export async function POST(req: NextRequest) {
  // Security Fix: SEC-012 — AI 端点需要登录
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const rl = await checkRateLimit('ai_daily', session.user.id, 20, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  // 配额：免费 1 次/天（FREE_DAILY_LIMIT），VIP 不限。
  // 会员态直接用 JWT 里的 isSubscribed（5 分钟 DB TTL），省一次跨区 DB 往返；
  // 「刚付费未刷新」的边缘由 quota 内部在额度耗尽时复核 isVip 兜底
  const quota = await checkDailyQuota(session.user.id, session.user.isSubscribed);
  if (!quota.hasQuota) {
    return NextResponse.json({
      error: 'QUOTA_EXCEEDED',
      message: `今日运势查询已达上限（${quota.limit} 次），请升级 VIP 解锁不限次数。`,
    }, { status: 403 });
  }
  const quotaConsumed = !quota.isVip;

  try {
    const body = await req.json();
    const input = requestSchema.parse(body);

    // BUG-019: 新用户未设置生日时返回 400 + 引导文案
    if (!input.birthDate) {
      if (quotaConsumed) await refundQuota(session.user.id, 'dailyCount');
      return Response.json(
        {
          error: '请先设置出生日期',
          code: 'MISSING_BIRTH_DATE',
          message: '每日运势需要您的出生信息。请在表单中填写出生日期和时辰后再试。',
        },
        { status: 400 }
      );
    }

    // 转换时辰
    const shichen = HOUR_TO_SHICHEN[input.birthHour] || '午时';

    // 目标日期默认为今天（用北京时间 UTC+8）
    const targetDate = input.targetDate || getTodayBeijing();
    
    // 1. 计算用户八字，获取日主
    const baziResult = calculateBazi({
      gender: input.gender,
      birthDate: input.birthDate,
      birthHour: shichen as '子时' | '丑时' | '寅时' | '卯时' | '辰时' | '巳时' | '午时' | '未时' | '申时' | '酉时' | '戌时' | '亥时' | '不知道',
    });
    
    // 2. 获取目标日期的干支
    const dayGanzhi = getDayGanzhi(targetDate);
    const lunarDate = getLunarDate(targetDate);
    const dayunResult = getCurrentDayun(input.birthDate, input.gender);
    const dayun = `${dayunResult.gan}${dayunResult.zhi}`;
    const liunian = getYearGanzhi(targetDate);
    
    // 3. 生成运势（可能失败，优雅降级）
    let fortune;
    try {
      // 熔断已下沉到 client.ts 的 callDeepSeek（generateDailyFortune 内部吞异常不 throw，此处再包一层熔断永远看到成功、形同虚设）
      fortune = await withAiTimeout(
        () => generateDailyFortune(baziResult.dayMaster, targetDate, dayGanzhi, dayun, liunian),
        55_000,
        () => ({ ...generateFallbackFortune(baziResult.dayMaster, dayGanzhi, targetDate), _source: 'fallback' as const })
      );
    } catch (aiError) {
      logger.error(SERVICE, 'AI fortune generation failed', aiError instanceof Error ? aiError : undefined);
      fortune = generateFallbackFortune(baziResult.dayMaster, dayGanzhi, targetDate);
    }

    // fallback 不消耗配额
    if (quotaConsumed && (fortune as any)._source === 'fallback') {
      await refundQuota(session.user.id, 'dailyCount');
    }

    const normalizedRatings = normalizeRatings(fortune.ratings, fortune.overall);
    const dayZhi = dayGanzhi[1];
    const imageUrl = DIZHI_IMAGES[dayZhi] || null;
    const overallLabel =
      (fortune as any).overallLabel ||
      (fortune.overall >= 4 ? '高' : fortune.overall >= 3 ? '平' : '低');

    return Response.json({
      date: targetDate,
      lunarDate,
      dayGanzhi,
      overall: fortune.overall,
      overallLabel,
      ratings: normalizedRatings,
      ratingComments: (fortune as any).ratingComments || {
        career: '日主平和，事业稳定推进',
        wealth: '财星临平，守财为上',
        love: '食伤平和，感情无波',
        health: '日主得令，身体康健',
        studies: '印星平稳，学业无阻',
        social: '比劫帮身，人缘平顺',
      },
      suitable: fortune.suitable,
      avoid: fortune.avoid,
      lucky: fortune.lucky,
      luckyHour: (fortune as any).luckyHour || '午时（11-13时）',
      verse: (fortune as any).verse || null,
      imageUrl,
      advice: fortune.advice,
      briefing: (fortune as any).briefing || null,
      headline: (fortune as any).headline || null,
      _source: (fortune as any)._source ?? 'unknown',
    });
  } catch (error) {
    if (quotaConsumed) {
      try { await refundQuota(session.user.id, 'dailyCount'); } catch {}
    }
    logger.error(SERVICE, 'Daily API error', error instanceof Error ? error : undefined);

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

// 基于字符串生成固定的伪随机数（0-1）
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 10000) / 10000;
}

// 降级运势生成（当 AI 不可用时）
function generateFallbackFortune(dayMaster: string, dayGanzhi: string, targetDate: string) {
  const seed = `${dayMaster}-${dayGanzhi}-${targetDate}`;
  
  const wuxingMap: Record<string, string> = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  };
  
  const masterWuxing = dayMaster.slice(-1);
  const dayGan = dayGanzhi[0];
  const dayWuxing = wuxingMap[dayGan] || '土';
  
  const shengMap: Record<string, string> = {
    '金': '水', '水': '木', '木': '火', '火': '土', '土': '金',
  };
  const keMap: Record<string, string> = {
    '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
  };
  
  let overall = 3;
  let advice = '今日运势平稳，宜保持平常心。';
  
  if (shengMap[masterWuxing] === dayWuxing) {
    overall = 3;
    advice = '今日精力有所消耗，注意劳逸结合，适合做一些轻松的事情。';
  } else if (shengMap[dayWuxing] === masterWuxing) {
    overall = 4;
    advice = '今日贵人运佳，适合寻求帮助和合作，事半功倍。';
  } else if (keMap[masterWuxing] === dayWuxing) {
    overall = 4;
    advice = '今日财运不错，适合谈判、签约等财务相关事项。';
  } else if (keMap[dayWuxing] === masterWuxing) {
    overall = 2;
    advice = '今日压力较大，建议保持低调，避免与人争执。';
  } else {
    overall = 3;
    advice = '今日运势平稳，适合按部就班处理日常事务。';
  }
  
  const suitablePool = ['工作', '学习', '运动', '社交', '阅读', '创作', '购物', '旅行', '投资', '谈判'];
  const avoidPool = ['争吵', '冒险', '熬夜', '饮酒', '赌博', '冲动消费', '重大决策', '签约'];

  // 使用固定种子选择，固定输出 5 条
  const suitable = [...suitablePool]
    .sort((a, b) => seededRandom(seed + 'suitable', suitablePool.indexOf(a)) - seededRandom(seed + 'suitable', suitablePool.indexOf(b)))
    .slice(0, 5);

  const avoid = [...avoidPool]
    .sort((a, b) => seededRandom(seed + 'avoid', avoidPool.indexOf(a)) - seededRandom(seed + 'avoid', avoidPool.indexOf(b)))
    .slice(0, 5);
  
  const colors = ['红色', '黄色', '蓝色', '绿色', '紫色', '白色', '金色'];
  const directions = ['东方', '南方', '西方', '北方', '东南', '东北', '西南', '西北'];

  const briefing =
    overall >= 4
      ? '今日气场顺遂，宜借势而为，把握贵人助力'
      : overall === 3
      ? '今日运势平稳，宜按部就班，守正以待时机'
      : '今日略有阻滞，宜低调收敛，避免正面冲突';

  return {
    overall,
    overallLabel: overall >= 4 ? '高' : overall >= 3 ? '平' : '低',
    headline: overall >= 4 ? '乘势而为' : overall >= 3 ? '守正待机' : '韬光养晦',
    briefing,
    ratings: {
      career: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 1) * 2) - 1)),
      wealth: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 2) * 2) - 1)),
      love: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 3) * 2) - 1)),
      health: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 4) * 2))),
      studies: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 6) * 2) - 1)),
      social: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 10) * 2) - 1)),
    },
    suitable,
    avoid,
    lucky: {
      color: colors[Math.floor(seededRandom(seed, 5) * colors.length)],
      numbers: [
        Math.floor(seededRandom(seed, 7) * 9) + 1,
        Math.floor(seededRandom(seed, 8) * 9) + 1
      ],
      direction: directions[Math.floor(seededRandom(seed, 9) * directions.length)],
    },
    luckyHour: '午时（11-13时）',
    verse: '行到水穷处\n坐看云起时',
    advice,
  };
}
