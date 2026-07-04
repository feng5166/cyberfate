import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateTarotReading, type TarotReadingResult } from '@/lib/ai/client';
import type { TarotReadingPromptInput } from '@/lib/ai/prompts';

import { getAuthSession } from '@/lib/auth-session';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';
import { refundQuota } from '@/lib/quota';
import { drawRandomCards, getCardImageUrl, getCardById } from '@/data/tarot';
import { getClientIp } from '@/lib/ip';
import {
  SPREAD_CONFIG, resolveSpread, spreadLabel, quotaLabel,
  chargeTarotQuota, tarotQuotaField, type TarotSpread,
} from '@/lib/tarot';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { SSE_HEADERS, typewriterStream } from '@/lib/ai/sse';

export const maxDuration = 120;

const SERVICE = 'api/tarot/draw';

interface CachedTarotReading {
  cardMeanings: string[];
  reading: string;
  caution: string;
}

type DerivedCard = {
  id: number | string;
  name_zh: string;
  name_en: string;
  keywords: string[];
  upright: string;
  reversed: string;
  suit?: string;
  orientation: 'upright' | 'reversed';
  image_url: string;
  position?: string;
};

function safeQuestion(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 200) : '';
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

/**
 * 构造本次解读用的牌：
 * - 若客户端传来 preDrawnCards 且每张都能按 id 命中可信牌库 → 采用（牌义/关键词一律取服务端可信数据，
 *   只沿用客户端的正逆位；杜绝伪造牌义与 prompt 注入）。
 * - 否则服务端重新抽（篡改或未提供时的兜底）。
 */
function buildCards(preDrawnCards: unknown, spread: TarotSpread): DerivedCard[] | null {
  const config = SPREAD_CONFIG[spread];

  if (Array.isArray(preDrawnCards) && preDrawnCards.length === config.count) {
    const mapped: (DerivedCard | null)[] = preDrawnCards.map((raw, idx) => {
      const trusted = getCardById((raw as { id?: number | string })?.id);
      if (!trusted) return null;
      const orientation = (raw as { orientation?: string })?.orientation === 'reversed' ? 'reversed' : 'upright';
      return {
        id: trusted.id,
        name_zh: trusted.name_zh,
        name_en: trusted.name_en,
        keywords: trusted.keywords,
        upright: trusted.upright,
        reversed: trusted.reversed,
        suit: trusted.suit,
        orientation,
        image_url: getCardImageUrl(trusted),
        position: config.positions?.[idx],
      };
    });
    if (mapped.every((c): c is DerivedCard => c !== null)) return mapped as DerivedCard[];
  }

  const cards = drawRandomCards(config.count);
  if (cards.length !== config.count) return null;
  return cards.map((card, idx) => ({
    id: card.id,
    name_zh: card.name_zh,
    name_en: card.name_en,
    keywords: card.keywords,
    upright: card.upright,
    reversed: card.reversed,
    suit: card.suit,
    orientation: card.orientation,
    image_url: getCardImageUrl(card),
    position: config.positions?.[idx],
  }));
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  const session = await getAuthSession(req);
  const userId = session?.user?.id;
  const body = await req.json().catch(() => ({}));
  const spread = resolveSpread(body?.spread);
  const question = safeQuestion(body?.question);
  const preDrawnCards = body?.preDrawnCards;

  const ip = getClientIp(req);

  // —— 限流 / 游客每日额度：本端点是唯一真源（抽牌端点不再消耗）——
  if (!isDebugMode) {
    if (userId) {
      const rl = await checkRateLimit('ai_tarot', userId, 10, 60);
      if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' }, { status: 429 });
    } else {
      const rl = await checkRateLimit('ai_tarot_guest', ip, 1, 86400);
      if (!rl.allowed) return NextResponse.json({ error: 'GUEST_LIMIT_REACHED', message: '游客每天可免费占卜 1 次，登录后解锁更多次数' }, { status: 429 });
    }
  }

  // 凯尔特十字：VIP 专属
  if (!isDebugMode && spread === 'celtic') {
    if (!userId) return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    const vip = await isVip(userId);
    if (!vip) return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
  }

  // 登录非 VIP：在「真正生成」处原子扣费（不管有没有 preDrawnCards）——堵住直接打本端点绕过配额
  let chargedField: 'tarotSingleCount' | 'tarotThreeCount' | null = null;
  if (!isDebugMode && userId && spread !== 'celtic') {
    const vip = await isVip(userId);
    if (!vip) {
      const ok = await chargeTarotQuota(userId, spread);
      if (!ok) {
        return NextResponse.json(
          { error: 'QUOTA_EXCEEDED', message: `今日${quotaLabel(spread)}次数已用完`, remaining: 0 },
          { status: 429 }
        );
      }
      chargedField = tarotQuotaField(spread);
    }
  }

  const refundIfCharged = async () => {
    if (chargedField && userId) {
      try { await refundQuota(userId, chargedField); } catch { /* 退款失败不阻断 */ }
    }
  };

  const cardsWithImages = buildCards(preDrawnCards, spread);
  if (!cardsWithImages) {
    await refundIfCharged();
    return NextResponse.json({ error: '抽牌失败，请重试' }, { status: 500 });
  }

  const cacheKey = generateCacheKey('tarot_v3', {
    spread,
    cardSignatures: cardsWithImages.map((card) => `${card.id}-${card.orientation}`).join(','),
    question,
  });

  // 解析出最终解读（缓存命中 / AI / 兜底）
  let cardMeanings: string[];
  let readingText: string;
  let caution: string;
  let source: 'deepseek' | 'fallback' | 'cache';
  let readError: string | undefined;

  const cached = await getCache(cacheKey);
  if (isCachedTarotReading(cached)) {
    cardMeanings = cached.cardMeanings;
    readingText = cached.reading;
    caution = cached.caution;
    source = 'cache';
  } else {
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

    let reading: TarotReadingResult & { _source: 'deepseek' | 'fallback'; _error?: string };
    try {
      reading = await withAiTimeout(() => generateTarotReading(promptInput), 110_000);
    } catch (aiErr) {
      logger.warn(SERVICE, 'AI unavailable, using card-based fallback', { reason: aiErr instanceof Error ? aiErr.message : String(aiErr) });
      reading = {
        cardMeanings: cardsWithImages.map((c) => (c.orientation === 'upright' ? c.upright : c.reversed)),
        reading:
          '当前 AI 服务暂时不可用，以下为基础牌义参考，建议稍后重新占卜。\n\n' +
          cardsWithImages
            .map((c) => `${c.name_zh}（${c.orientation === 'upright' ? '正位' : '逆位'}）：${c.orientation === 'upright' ? c.upright : c.reversed}`)
            .join('\n\n'),
        caution: 'AI 服务暂时不可用，以上为基础牌义参考。',
        _source: 'fallback',
      };
    }

    cardMeanings = reading.cardMeanings;
    readingText = reading.reading;
    caution = reading.caution;
    source = reading._source;
    readError = reading._error;

    if (source === 'fallback') {
      // AI 没出真解读 → 退还刚扣的配额（与八字/每日/六爻一致）
      await refundIfCharged();
    } else {
      await setCache(cacheKey, { cardMeanings, reading: readingText, caution }, 12 * 60 * 60);
    }
  }

  // 持久化（供 VIP「历史记录」使用）——仅登录用户、非兜底结果，失败不阻断返回
  if (userId && source !== 'fallback') {
    try {
      await prisma.tarotReading.create({
        data: {
          userId,
          question: question || null,
          spread,
          cards: cardsWithImages,
          aiReading: readingText,
        },
      });
    } catch (e) {
      logger.warn(SERVICE, 'persist tarot reading failed', { reason: e instanceof Error ? e.message : String(e) });
    }
  }

  const meta = {
    spread,
    cards: cardsWithImages.map((card, index) => ({
      ...card,
      meaning: cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
    })),
    caution,
    _source: source,
    _debug: isDebugMode ? true : undefined,
    _error: isDebugMode ? readError : undefined,
  };

  return new Response(typewriterStream(meta, readingText), { headers: SSE_HEADERS });
}
