import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { buildTarotStreamSystemPrompt, buildTarotStreamPrompt, type TarotReadingPromptInput } from '@/lib/ai/prompts';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { resolveProviders, type ResolvedProvider } from '@/lib/ai/provider';
import { attachClientAbort } from '@/lib/ai/streamProxy';

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
import { applyChaos } from '@/lib/chaos-middleware';
import { logger } from '@/lib/logger';
import { SSE_HEADERS, typewriterStream } from '@/lib/ai/sse';
import { isDebugRequest } from '@/lib/ai/debug';

export const maxDuration = 120;

const SERVICE = 'api/tarot/draw';

interface CachedTarotReading {
  cardMeanings: string[];
  reading: string;
  caution: string;
  /** V2 新增（可缺失，旧缓存兼容） */
  oneLineAnswer?: string;
  actions?: string[];
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

  const isDebugMode = isDebugRequest(req);

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

  const buildMeta = (
    cardMeanings: string[],
    caution: string,
    oneLineAnswer: string | undefined,
    actions: string[] | undefined,
    source: 'deepseek' | 'fallback' | 'cache',
    readError?: string,
  ) => ({
    spread,
    cards: cardsWithImages.map((card, index) => ({
      ...card,
      meaning: cardMeanings[index] || (card.orientation === 'upright' ? card.upright : card.reversed),
    })),
    caution,
    // V2（PRD-TAROT-V2 P0-B）：一句话答案置顶 + 行动清单（可缺失，前端降级）
    oneLineAnswer,
    actions,
    _source: source,
    _debug: isDebugMode ? true : undefined,
    _error: isDebugMode ? readError : undefined,
  });

  const persistReading = async (readingText: string) => {
    // 持久化（供 VIP「历史记录」使用）——仅登录用户、非兜底结果，失败不阻断
    if (!userId) return;
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
  };

  // —— 缓存命中：结构化字段已齐，打字机回放（无 LLM 成本，速度快体验一致）——
  const cached = await getCache(cacheKey);
  if (isCachedTarotReading(cached)) {
    const meta = buildMeta(cached.cardMeanings, cached.caution, cached.oneLineAnswer, cached.actions, 'cache');
    await persistReading(cached.reading);
    return new Response(typewriterStream(meta, cached.reading), { headers: SSE_HEADERS });
  }

  // —— 真流式（V2）：token 边生成边推，标记分段（【一句话答案】→【解读】→【逐牌点睛】→【行动建议】→【提醒】）——
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

  const fallbackReadingText = () =>
    '当前 AI 服务暂时不可用，以下为基础牌义参考，建议稍后重新占卜。\n\n' +
    cardsWithImages
      .map((c) => `${c.name_zh}（${c.orientation === 'upright' ? '正位' : '逆位'}）：${c.orientation === 'upright' ? c.upright : c.reversed}`)
      .join('\n\n');

  const streamFallback = async (reason: string) => {
    logger.warn(SERVICE, 'AI unavailable, using card-based fallback', { reason });
    await refundIfCharged();
    const meta = buildMeta(
      cardsWithImages.map((c) => (c.orientation === 'upright' ? c.upright : c.reversed)),
      'AI 服务暂时不可用，以上为基础牌义参考。',
      undefined,
      undefined,
      'fallback',
      isDebugMode ? reason : undefined,
    );
    return new Response(typewriterStream(meta, fallbackReadingText()), { headers: SSE_HEADERS });
  };

  const proxy = attachClientAbort(req);
  const maxTokens = spread === 'celtic' ? 8000 : spread === 'mirror' || spread === 'relationship' ? 6000 : 5000;
  const openUpstream = (p: ResolvedProvider) =>
    fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: proxy.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
        enable_thinking: false,
        messages: [
          { role: 'system', content: buildTarotStreamSystemPrompt({ spread, spreadName: spreadLabel(spread) }) },
          { role: 'user', content: buildTarotStreamPrompt(promptInput) },
        ],
      }),
    });

  const providers = await resolveProviders();
  let upstream: Response | null = null;
  let lastErr = '';
  for (const p of providers) {
    try {
      const res = await openUpstream(p);
      if (res.ok && res.body) { upstream = res; break; }
      lastErr = `provider ${p.baseUrl} status ${res.status}`;
    } catch (err) {
      if (proxy.signal.aborted) break;
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }

  if (!upstream) {
    proxy.release();
    return streamFallback(lastErr || 'no provider available');
  }

  const upstreamRes = upstream;
  const encoder = new TextEncoder();
  const reader = upstreamRes.body!.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      // 首帧 meta：牌面即时可渲染；逐牌点睛/答案/建议随流到达后由 final 帧补齐
      send({
        meta: buildMeta(
          cardsWithImages.map((c) => (c.orientation === 'upright' ? c.upright : c.reversed)),
          '',
          undefined,
          undefined,
          'deepseek',
        ),
      });

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const linesArr = buffer.split('\n');
          buffer = linesArr.pop() || '';
          for (const ln of linesArr) {
            const t = ln.trim();
            if (!t || !t.startsWith('data:')) continue;
            const d = t.slice(5).trim();
            if (d === '[DONE]') continue;
            try {
              const json = JSON.parse(d);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                fullText += delta;
                send({ content: delta });
              }
            } catch { /* 单行 JSON 不完整则跳过 */ }
          }
        }

        if (!proxy.signal.aborted && fullText.trim().length >= 100) {
          const parsed = parseTarotMarkedText(fullText, cardsWithImages.length, cardsWithImages);
          send({ final: parsed });
          try {
            await setCache(cacheKey, {
              cardMeanings: parsed.cardMeanings,
              reading: parsed.reading,
              caution: parsed.caution,
              oneLineAnswer: parsed.oneLineAnswer,
              actions: parsed.actions,
            }, 12 * 60 * 60);
          } catch { /* 缓存失败不阻断 */ }
          await persistReading(parsed.reading);
        } else if (!proxy.signal.aborted) {
          // 内容过短判失败：退配额，前端提示重试
          await refundIfCharged();
          send({ content: '\n\n（本次生成异常，已退还今日次数，请点击「重新解读」再试。）' });
        }
      } catch (err) {
        logger.warn(SERVICE, 'stream read failed', { reason: err instanceof Error ? err.message : String(err) });
        await refundIfCharged();
        try { send({ content: '\n\n（生成中断，已退还今日次数，请点击「重新解读」再试。）' }); } catch { /* controller 可能已关 */ }
      } finally {
        try { controller.enqueue(encoder.encode('data: [DONE]\n\n')); } catch { /* ignore */ }
        proxy.release();
        try { controller.close(); } catch { /* ignore */ }
      }
    },
    async cancel() {
      await proxy.cancel(reader);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

/** 解析标记分段的流式全文 → 结构化字段（缓存与 final 帧共用） */
function parseTarotMarkedText(
  full: string,
  cardCount: number,
  cards: Array<{ upright: string; reversed: string; orientation: 'upright' | 'reversed' }>,
): { oneLineAnswer?: string; reading: string; cardMeanings: string[]; actions?: string[]; caution: string } {
  const section = (name: string): string => {
    const re = new RegExp(`【${name}】\\s*([\\s\\S]*?)(?=\\n*【(?:一句话答案|解读|逐牌点睛|行动建议|提醒)】|$)`);
    return re.exec(full)?.[1]?.trim() ?? '';
  };

  const oneLineAnswerRaw = section('一句话答案').replace(/\s+/g, ' ').trim();
  const oneLineAnswer = oneLineAnswerRaw ? oneLineAnswerRaw.slice(0, 60) : undefined;

  const reading = section('解读') || full.replace(/【[^】]{1,8}】/g, '').trim();

  const dianjing = section('逐牌点睛');
  let cardMeanings = dianjing
    ? dianjing.split('\n').map((l) => l.replace(/^\s*\d+[.、]\s*/, '').trim()).filter(Boolean).slice(0, cardCount)
    : [];
  if (cardMeanings.length !== cardCount) {
    cardMeanings = cards.map((c) => (c.orientation === 'upright' ? c.upright : c.reversed));
  }

  const actionsArr = section('行动建议')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•\d.、]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  const actions = actionsArr.length ? actionsArr : undefined;

  const caution = section('提醒').replace(/\s+/g, ' ').trim().slice(0, 100)
    || '塔罗解读仅供参考，重大决策请结合现实信息判断。';

  return { oneLineAnswer, reading, cardMeanings, actions, caution };
}
