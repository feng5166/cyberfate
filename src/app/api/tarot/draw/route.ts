import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateTarotReading } from '@/lib/ai/client';
import type { TarotReadingPromptInput } from '@/lib/ai/prompts';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';

const spreadConfig: Record<'single' | 'three' | 'celtic', { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: {
    count: 10,
    positions: ['现状', '挑战', '根源', '过去', '目标', '未来', '自我', '环境', '希望/恐惧', '结果'],
  },
};

const DAILY_LIMITS = {
  single: 3,
  three: 1,
  celtic: 0, // VIP only
};

interface CachedTarotReading {
  cardMeanings: string[];
  overallNarrative: string;
  detailedReading: string;
  advice: string;
  caution: string;
}

async function checkQuota(userId: string, spread: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];

  let quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!quota) {
    quota = await prisma.usageQuota.create({
      data: { userId, date: today },
    });
  }

  const limit = DAILY_LIMITS[spread as keyof typeof DAILY_LIMITS] ?? 0;
  const used = 0; // spread === 'single' ? quota.tarotSingleCount : spread === 'three' ? quota.tarotThreeCount : 0;

  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

async function useQuota(userId: string, spread: string) {
  const today = new Date().toISOString().split('T')[0];

  if (spread === 'single') {
    await prisma.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        /* tarotSingleCount: { increment: 1 } */
      },
      create: { userId, date: today /* , tarotSingleCount: 1 */ },
    });
  } else if (spread === 'three') {
    await prisma.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        /* tarotThreeCount: { increment: 1 } */
      },
      create: { userId, date: today /* , tarotThreeCount: 1 */ },
    });
  }
}

async function isVip(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expireAt: { gt: new Date() } },
  });
  return !!subscription;
}

function resolveSpread(value: unknown): 'single' | 'three' | 'celtic' {
  if (value === 'single' || value === 'three' || value === 'celtic') return value;
  return 'three';
}

function safeQuestion(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 200) : '';
}

function spreadLabel(spread: 'single' | 'three' | 'celtic'): string {
  if (spread === 'single') return '单张牌';
  if (spread === 'celtic') return '凯尔特十字';
  return '经典三张牌（过去/现在/未来）';
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

  // 检查配额（登录用户）
  if (session?.user?.id && spread !== 'celtic') {
    const vip = await isVip(session.user.id);
    if (!vip) {
      const { allowed } = await checkQuota(session.user.id, spread);
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message: `今日${spread === 'single' ? '单张牌' : '三张牌'}次数已用完`,
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }
  }

  const config = spreadConfig[spread];
  const cards = drawRandomCards(config.count);

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

  // 保存历史记录（登录用户）
  // 注释：Prisma schema 缺 tarotReading 表
  /*
  if (session?.user?.id) {
    await prisma.tarotReading.create({
      data: {
        userId: session.user.id,
        question,
        spread,
        cards: cardsWithImages,
        aiReading: readingPayload.detailedReading
      }
    });

    // 扣除配额
    const vip = await isVip(session.user.id);
    if (!vip && spread !== 'celtic') {
      await useQuota(session.user.id, spread);
    }
  }
  */
  void useQuota;

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
