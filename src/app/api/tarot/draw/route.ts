import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateTarotReading, type TarotReadingResult } from '@/lib/ai/client';
import type { TarotReadingPromptInput } from '@/lib/ai/prompts';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';
import { getTodayBeijing } from '@/lib/timezone';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';

export const maxDuration = 120;

const SERVICE = 'api/tarot/draw';

type TarotSpread = 'single' | 'three' | 'celtic' | 'moonlight' | 'mirror' | 'relationship';

const spreadConfig: Record<TarotSpread, { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: {
    count: 10,
    positions: [
      '①现状',
      '②挑战',
      '③意识',
      '④根源',
      '⑤希望/恐惧',
      '⑥近期发展',
      '⑦可能结果',
      '⑧外部环境',
      '⑨心态信念',
      '⑩最终结局',
    ],
  },
  moonlight: {
    count: 3,
    positions: ['身心灵', '潜意识', '指引'],
  },
  mirror: {
    count: 5,
    positions: ['现状', '阻碍', '建议', '风险', 'Outcome'],
  },
  relationship: {
    count: 5,
    positions: ['你的感受', '对方感受', '关系基础', '当前障碍', '关系走向'],
  },
};

const DAILY_LIMITS: Record<TarotSpread, number> = {
  single: 1,
  three: 1,
  celtic: 0,
  moonlight: 1,
  mirror: 1,
  relationship: 1,
};

interface CachedTarotReading {
  cardMeanings: string[];
  reading: string;
  caution: string;
}

async function atomicCheckAndUseQuota(userId: string, spread: TarotSpread): Promise<boolean> {
  const today = getTodayBeijing();
  const limit = DAILY_LIMITS[spread];

  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });

  const result = spread === 'single'
    ? await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotSingleCount: { lt: limit } },
        data: { tarotSingleCount: { increment: 1 } },
      })
    : await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotThreeCount: { lt: limit } },
        data: { tarotThreeCount: { increment: 1 } },
      });

  return result.count > 0;
}

function resolveSpread(value: unknown): TarotSpread {
  if (
    value === 'single' ||
    value === 'three' ||
    value === 'celtic' ||
    value === 'moonlight' ||
    value === 'mirror' ||
    value === 'relationship'
  ) {
    return value;
  }
  return 'three';
}

function safeQuestion(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 200) : '';
}

function spreadLabel(spread: TarotSpread): string {
  if (spread === 'single') return '单张牌';
  if (spread === 'celtic') return '凯尔特十字';
  if (spread === 'moonlight') return '月光模式·柔和内省';
  if (spread === 'mirror') return '镜像模式·多角度透视';
  if (spread === 'relationship') return '关系牌阵·双方视角';
  return '经典三张牌（过去/现在/未来）';
}

function quotaLabel(spread: TarotSpread): string {
  if (spread === 'single') return '单张牌';
  if (spread === 'moonlight') return '月光模式';
  if (spread === 'mirror') return '镜像模式';
  if (spread === 'celtic') return '凯尔特十字';
  if (spread === 'relationship') return '关系牌阵';
  return '三张牌';
}

function isCachedTarotReading(value: unknown): value is CachedTarotReading {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.cardMeanings) &&
    typeof data.reading === 'string' &&
    typeof data.caution === 'string'
  );
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

function buildStream(meta: unknown, narrative: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta })}\n\n`));

      const chunkSize = 4;
      for (let i = 0; i < narrative.length; i += chunkSize) {
        const piece = narrative.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: piece })}\n\n`));
        await new Promise((r) => setTimeout(r, 18));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const spread = resolveSpread(body?.spread);
  const question = safeQuestion(body?.question);
  const preDrawnCards = Array.isArray(body?.preDrawnCards) ? body.preDrawnCards : null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!isDebugMode && session?.user?.id) {
    const rl = await checkRateLimit('ai_tarot', session.user.id, 10, 60);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else if (!isDebugMode) {
    const rl = await checkRateLimit('ai_tarot_guest', ip, 1, 86400);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  if (!isDebugMode && spread === 'celtic') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    const vip = await isVip(session.user.id);
    if (!vip) {
      return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
    }
  }

  if (!isDebugMode && !preDrawnCards && session?.user?.id && spread !== 'celtic') {
    const vip = await isVip(session.user.id);
    if (!vip) {
      const allowed = await atomicCheckAndUseQuota(session.user.id, spread);
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message: `今日${quotaLabel(spread)}次数已用完`,
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }
  }

  const config = spreadConfig[spread];

  let cardsWithImages: Array<ReturnType<typeof drawRandomCards>[number] & { image_url: string; position?: string }>;

  if (preDrawnCards && preDrawnCards.length === config.count) {
    cardsWithImages = preDrawnCards.map((card: typeof preDrawnCards[number], idx: number) => ({
      ...card,
      image_url: card.image_url || getCardImageUrl(card),
      position: card.position || config.positions?.[idx],
    }));
  } else {
    const cards = drawRandomCards(config.count);

    if (cards.length !== config.count) {
      return NextResponse.json({ error: '抽牌失败，请重试' }, { status: 500 });
    }

    cardsWithImages = cards.map((card, idx) => ({
      ...card,
      image_url: getCardImageUrl(card),
      position: config.positions?.[idx],
    }));
  }

  const cacheKey = generateCacheKey('tarot_v3', {
    spread,
    cardSignatures: cardsWithImages.map((card) => `${card.id}-${card.orientation}`).join(','),
    question,
  });

  const cached = await getCache(cacheKey);
  if (isCachedTarotReading(cached)) {
    const meta = {
      spread,
      cards: cardsWithImages.map((card, index) => ({
        ...card,
        meaning: cached.cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
      })),
      caution: cached.caution,
      _source: 'cache',
      _debug: isDebugMode ? true : undefined,
    };
    return new Response(buildStream(meta, cached.reading), { headers: SSE_HEADERS });
  }

  const promptInput: TarotReadingPromptInput = {
    spread,
    spreadName: spreadLabel(spread),
    question,
    cards: cardsWithImages.map((card, index) => ({
      position: card.position || `第${index + 1}张`,
      name: card.name_zh,
      orientation: card.orientation,
      keywords: card.keywords,
      traditionalMeaning: card.orientation === 'upright' ? card.upright : card.reversed,
    })),
  };

  let reading: TarotReadingResult & { _source: 'deepseek' | 'fallback' };
  try {
    reading = await withCircuitBreaker('deepseek-tarot-v4pro', () =>
      withAiTimeout(() => generateTarotReading(promptInput), 110_000)
    );
  } catch (aiErr) {
    logger.warn(SERVICE, 'AI unavailable, using card-based fallback', { reason: aiErr instanceof Error ? aiErr.message : String(aiErr) });
    reading = {
      cardMeanings: cardsWithImages.map((card) =>
        card.orientation === 'upright' ? card.upright : card.reversed
      ),
      reading:
        '当前 AI 服务暂时不可用，以下为基础牌义参考，建议稍后重新占卜。\n\n' +
        cardsWithImages
          .map(
            (card) =>
              `${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）：${card.orientation === 'upright' ? card.upright : card.reversed}`
          )
          .join('\n\n'),
      caution: 'AI 服务暂时不可用，以上为基础牌义参考。',
      _source: 'fallback',
    };
  }

  if (reading._source !== 'fallback') {
    await setCache(cacheKey, {
      cardMeanings: reading.cardMeanings,
      reading: reading.reading,
      caution: reading.caution,
    }, 12 * 60 * 60);
  }

  const readingWithError = reading as typeof reading & { _error?: string };
  const meta = {
    spread,
    cards: cardsWithImages.map((card, index) => ({
      ...card,
      meaning: reading.cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
    })),
    caution: reading.caution,
    _source: reading._source,
    _debug: isDebugMode ? true : undefined,
    _error: isDebugMode ? readingWithError._error : undefined,
  };

  return new Response(buildStream(meta, reading.reading), { headers: SSE_HEADERS });
}
