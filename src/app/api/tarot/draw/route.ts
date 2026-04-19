import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateTarotReading } from '@/lib/ai/client';
import type { TarotReadingPromptInput } from '@/lib/ai/prompts';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { applyChaos } from '@/lib/chaos-middleware';

type TarotSpread = 'single' | 'three' | 'celtic' | 'moonlight' | 'mirror';

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
};

const DAILY_LIMITS: Record<TarotSpread, number> = {
  single: 3,
  three: 1,
  celtic: 0, // VIP only
  moonlight: 1,
  mirror: 1,
};

interface CachedTarotReading {
  cardMeanings: string[];
  overallNarrative: string;
  detailedReading: string;
  advice: string;
  caution: string;
}

async function atomicCheckAndUseQuota(userId: string, spread: TarotSpread): Promise<boolean> {
  const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
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

async function isVip(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expireAt: { gt: new Date() } },
  });
  return !!subscription;
}

function resolveSpread(value: unknown): TarotSpread {
  if (value === 'single' || value === 'three' || value === 'celtic' || value === 'moonlight' || value === 'mirror') {
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
  return '经典三张牌（过去/现在/未来）';
}

function quotaLabel(spread: TarotSpread): string {
  if (spread === 'single') return '单张牌';
  if (spread === 'moonlight') return '月光模式';
  if (spread === 'mirror') return '镜像模式';
  if (spread === 'celtic') return '凯尔特十字';
  return '三张牌';
}

function isCachedTarotReading(value: unknown): value is CachedTarotReading {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.cardMeanings) &&
    typeof data.overallNarrative === 'string' &&
    typeof data.detailedReading === 'string' &&
    typeof data.advice === 'string' &&
    typeof data.caution === 'string'
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const spread = resolveSpread(body?.spread);
  const question = safeQuestion(body?.question);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (session?.user?.id) {
    const rl = await checkRateLimit('ai_tarot', session.user.id, 10, 60);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  } else {
    const rl = await checkRateLimit('ai_tarot_guest', ip, 3, 3600);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  // 凯尔特十字需要 VIP
  if (spread === 'celtic') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    const vip = await isVip(session.user.id);
    if (!vip) {
      return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
    }
  }

  // 检查配额（登录用户，原子递增防竞态）
  if (session?.user?.id && spread !== 'celtic') {
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
  const cards = drawRandomCards(config.count);

  if (cards.length !== config.count) {
    return NextResponse.json({ error: '抽牌失败，请重试' }, { status: 500 });
  }

  const cardsWithImages = cards.map((card, idx) => ({
    ...card,
    image_url: getCardImageUrl(card),
    position: config.positions?.[idx],
  }));

  const cacheKey = generateCacheKey('tarot_v3', {
    spread,
    cardSignatures: cardsWithImages.map((card) => `${card.id}-${card.orientation}`).join(','),
    question,
  });

  const cached = await getCache(cacheKey);
  if (isCachedTarotReading(cached)) {
    return NextResponse.json({
      spread,
      cards: cardsWithImages.map((card, index) => ({
        ...card,
        meaning: cached.cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
      })),
      overallNarrative: cached.overallNarrative,
      detailedReading: cached.detailedReading,
      advice: cached.advice,
      caution: cached.caution,
      _source: 'cache',
    });
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

  const reading = await generateTarotReading(promptInput);
  const readingPayload: CachedTarotReading = {
    cardMeanings: reading.cardMeanings,
    overallNarrative: reading.overallNarrative,
    detailedReading: reading.detailedReading,
    advice: reading.advice,
    caution: reading.caution,
  };

  await setCache(cacheKey, readingPayload, 12 * 60 * 60);

  return NextResponse.json({
    spread,
    cards: cardsWithImages.map((card, index) => ({
      ...card,
      meaning: readingPayload.cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
    })),
    overallNarrative: readingPayload.overallNarrative,
    detailedReading: readingPayload.detailedReading,
    advice: readingPayload.advice,
    caution: readingPayload.caution,
    _source: reading._source,
  });
}
