import { NextRequest, NextResponse, after } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { withCircuitBreaker, CircuitOpenError } from '@/lib/ai/circuitBreaker';
import {
  TAROT_STRUCT_MARKER,
  buildTarotStreamSystemPrompt,
  buildTarotStreamUserPrompt,
  type TarotReadingPromptInput,
} from '@/lib/ai/prompts';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { resolveProviders, type ResolvedProvider } from '@/lib/ai/provider';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { recordAiOutcome } from '@/lib/ai/observe';

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

// 真流式的响应头：在通用 SSE_HEADERS 基础上补 no-transform + X-Accel-Buffering，
// 阻止中间代理把整条流缓冲成一次性响应——否则「真流式」在生产上会退化回假流式。
const STREAM_HEADERS = {
  ...SSE_HEADERS,
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
} as const;

/** 首帧 meta 的通用提示（此时 AI 正文还没开始，用一句安全的通用提醒占位） */
const BASE_CAUTION = '塔罗解读用于自我觉察参考，重要决定请结合现实条件独立判断。';

/** 正文低于该长度视为模型没产出有效解读（与八字流式一致），走兜底 + 退款 */
const MIN_READING_CHARS = 100;

// 上游首字节(TTFB)超时：网关挂起时 15s 没等到响应头就换 provider。
// 不能把这个时限直接做成 fetch 的 signal 超时——那会在首字节之后继续计时，把健康的长流一起杀掉。
// 与 bazi/stream 同一套口径
const UPSTREAM_TTFB_MS = 15_000;
// 读流阶段空闲 watchdog：连上后 20s 收不到任何字节视为上游卡死，abort 走 settle 兜底。
// 否则用户干等到 Vercel 在 maxDuration 处击杀函数——配额已扣、退款分支永远走不到
const UPSTREAM_IDLE_MS = 20_000;

/** 熔断器键：与改造前 client.ts 里 callDeepSeek(feature='tarot') 用的 `ai:tarot` 保持同一个，状态不割裂 */
const AI_CIRCUIT = 'ai:tarot';

/**
 * 把「读流阶段」的失败补记给熔断器。
 * 本路由只把开流阶段包进 withCircuitBreaker；连上之后才卡死/正文过短这类失败拿不到上报机会，
 * 用一次必定 reject 的调用记一笔失败计数即可（不改 circuitBreaker.ts 的对外 API）。
 * 熔断器自身抛的错（含 CircuitOpenError）一律吞掉——记账失败不该影响用户已拿到的兜底文案。
 */
async function reportCircuitFailure(): Promise<void> {
  try {
    await withCircuitBreaker(AI_CIRCUIT, () => Promise.reject(new Error('tarot stream fallback')));
  } catch { /* 仅用于记账 */ }
}

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

/** 牌库自带的传统牌义（首帧就下发，用户 0 等待先有内容；也是 AI 失败时的兜底牌义） */
function baseMeaningsOf(cards: DerivedCard[]): string[] {
  return cards.map((c) => (c.orientation === 'upright' ? c.upright : c.reversed));
}

/** AI 完全不可用时的完整结果（文案与改造前保持一致，前端 fallback 提示不变） */
function buildFallbackReading(cards: DerivedCard[]): CachedTarotReading {
  const cardMeanings = baseMeaningsOf(cards);
  return {
    cardMeanings,
    reading:
      '当前 AI 服务暂时不可用，以下为基础牌义参考，建议稍后重新占卜。\n\n' +
      cards
        .map((c, i) => `${c.name_zh}（${c.orientation === 'upright' ? '正位' : '逆位'}）：${cardMeanings[i]}`)
        .join('\n\n'),
    caution: 'AI 服务暂时不可用，以上为基础牌义参考。',
  };
}

/**
 * 各牌阵输出 token 预算。
 * 注意流式路径一次生成里要同时装下「正文 + 结构化尾块」：celtic 正文 1200-1500 字
 * （prompts.ts getTarotPromptProfile）+ 10 张牌各 80-120 字的 cardMeanings + caution ≈ 2900 字符，
 * 所以从改造前的 5000 只下调到 4000 留余量——再往下压会把尾块 JSON 截断，
 * cardMeanings 解析不出来只能整体退回基础牌义，反而更亏。
 */
function tarotMaxTokens(spread: TarotSpread): number {
  if (spread === 'celtic') return 4000;
  if (spread === 'relationship') return 4500;
  if (spread === 'mirror') return 4000;
  return 3500;
}

// —— 结构化尾块的归一化：与 client.ts 的 normalizeTarotReading 口径保持一致 ——

function normalizeCardMeanings(raw: unknown, count: number, spread: TarotSpread, base: string[]): string[] {
  const limit = spread === 'mirror' ? 150 : 120;
  const cleaned = (Array.isArray(raw) ? raw : [])
    .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim().slice(0, limit) : ''))
    .filter(Boolean)
    .slice(0, count);
  // 数量对不上说明模型没按牌序作答，整体退回基础牌义，避免张冠李戴
  return cleaned.length === count ? cleaned : base.slice(0, count);
}

function normalizeCaution(raw: unknown, spread: TarotSpread, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const limit = spread === 'single' || spread === 'three' ? 80 : 100;
  return raw.replace(/\s+/g, ' ').trim().slice(0, limit) || fallback;
}

/** 从标记后的原文里抠出 JSON 对象（模型偶尔会包 markdown 围栏或多说一句） */
function parseStructBlock(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * 剥掉正文末尾「疑似标记前缀」的残片：标记可能被 upstream 切在最后一个 delta 里且没写完，
 * 直接下发会让用户看到半截 `===TAROT`。只在 ≥3 个字符时才判定，避免误伤正常结尾。
 */
function stripTrailingMarkerPrefix(text: string): string {
  const max = Math.min(TAROT_STRUCT_MARKER.length - 1, text.length);
  for (let n = max; n >= 3; n--) {
    if (TAROT_STRUCT_MARKER.startsWith(text.slice(text.length - n))) return text.slice(0, text.length - n);
  }
  return text;
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

  const cards = cardsWithImages;
  const baseMeanings = baseMeaningsOf(cards);

  const cacheKey = generateCacheKey('tarot_v3', {
    spread,
    cardSignatures: cards.map((card) => `${card.id}-${card.orientation}`).join(','),
    question,
  });

  /** 帧协议里的 meta：牌面 + 该轮已知的牌义/提示。终帧再发一次覆盖首帧（移动端取最后一个 meta） */
  const buildMeta = (cardMeanings: string[], caution: string, source: string, error?: string) => ({
    spread,
    cards: cards.map((card, index) => ({
      ...card,
      meaning: cardMeanings[index] || baseMeanings[index],
    })),
    caution,
    _source: source,
    _debug: isDebugMode ? true : undefined,
    _error: isDebugMode ? error : undefined,
  });

  /** 持久化（供 VIP「历史记录」使用）——仅登录用户、非兜底结果，失败不阻断返回 */
  const persistReading = async (readingText: string) => {
    if (!userId) return;
    try {
      await prisma.tarotReading.create({
        data: {
          userId,
          question: question || null,
          spread,
          cards,
          aiReading: readingText,
        },
      });
    } catch (e) {
      logger.warn(SERVICE, 'persist tarot reading failed', { reason: e instanceof Error ? e.message : String(e) });
    }
  };

  // —— 缓存命中：结果已完整，沿用打字机回放（无生成等待，本来就秒开）——
  const cached = await getCache(cacheKey);
  if (isCachedTarotReading(cached)) {
    await persistReading(cached.reading);
    return new Response(
      typewriterStream(buildMeta(cached.cardMeanings, cached.caution, 'cache'), cached.reading),
      { headers: STREAM_HEADERS },
    );
  }

  // —— 未命中：上游 stream:true 直连，正文边生成边下发（TTFB 从「全量生成时长」降到秒级）——
  const promptInput: TarotReadingPromptInput = {
    spread,
    spreadName: spreadLabel(spread),
    question,
    cards: cards.map((card, index) => ({
      position: card.position || `第${index + 1}张`,
      name: card.name_zh,
      orientation: card.orientation,
      keywords: card.keywords,
      traditionalMeaning: card.orientation === 'upright' ? card.upright : card.reversed,
    })),
  };

  const proxy = attachClientAbort(req);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const sse = (payload: object | string) =>
    encoder.encode(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`);

  // 每个 provider 一条独立 AbortController：既转发客户端断连(proxy.signal)，
  // 又能被 TTFB 超时 / 空闲 watchdog 单独 abort（proxy.signal 是整个请求共用的，不能拿它当计时器）。
  // 写法对齐 bazi/stream
  const openUpstream = async (p: ResolvedProvider) => {
    const ac = new AbortController();
    const onClientAbort = () => ac.abort();
    if (proxy.signal.aborted) ac.abort();
    else proxy.signal.addEventListener('abort', onClientAbort, { once: true });

    // 拿到响应头即 clearTimeout：读流阶段交给空闲 watchdog 看护，健康长流不会被误杀
    const ttfbTimer = setTimeout(() => ac.abort(), UPSTREAM_TTFB_MS);
    const detach = () => {
      clearTimeout(ttfbTimer);
      proxy.signal.removeEventListener('abort', onClientAbort);
    };

    try {
      const res = await fetch(`${p.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: ac.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${p.apiKey}`,
        },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          max_tokens: tarotMaxTokens(spread),
          temperature: 0.6, // 与 client.ts TEMPERATURE_CONFIG.tarot 一致
          stream: true,
          enable_thinking: false,
          messages: [
            { role: 'system', content: buildTarotStreamSystemPrompt({ spread, spreadName: spreadLabel(spread) }) },
            { role: 'user', content: buildTarotStreamUserPrompt(promptInput) },
          ],
        }),
      });
      clearTimeout(ttfbTimer);
      return { res, abort: () => ac.abort(), detach };
    } catch (err) {
      detach();
      throw err;
    }
  };

  // —— 收尾工作（写缓存/落库/观测）——
  // 必须挂在 after() 上：Serverless 在响应结束后即可冻结实例，关流之后才启动的游离 Promise 可能永远跑不完
  // （缓存写不进去 ⇒ 12h 缓存事实上不可达、每次都重打模型；VIP 历史记录缺失）。
  // after() 在 Vercel 上映射到 waitUntil，且回调只在响应关闭后执行——那时 finalizers 已登记齐全（都在关流前 push）。
  // 注：退款不走这里，它在关流前就 await（见下方 finally），钱/配额相关的事不赌后台任务。
  const finalizers: Array<() => Promise<void>> = [];
  // 客户端断连时响应会先于 start() 结束而关闭，after() 的回调可能被提前唤醒——
  // 那一刻 finalizers 还没登记齐，必须等 start() 收完尾（再兜一层超时，绝不把 waitUntil 挂死）
  let markStreamDone: () => void = () => {};
  const streamDone = new Promise<void>((resolve) => { markStreamDone = resolve; });
  let finalizersRan = false;
  const runFinalizers = async () => {
    if (finalizersRan) return;
    finalizersRan = true;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 15_000);
      void streamDone.then(() => { clearTimeout(t); resolve(); });
    });
    for (const fn of finalizers) {
      try { await fn(); } catch (e) {
        logger.warn(SERVICE, 'finalizer failed', { reason: e instanceof Error ? e.message : String(e) });
      }
    }
  };
  // 拿不到 waitUntil 的运行时里 after() 会同步抛错：退回「关流后内联执行」，至少不比改造前差
  let finalizeInline = false;
  try {
    after(runFinalizers);
  } catch (e) {
    finalizeInline = true;
    logger.warn(SERVICE, 'after() unavailable, run finalizers inline', { reason: e instanceof Error ? e.message : String(e) });
  }

  let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      /** 入队一帧：客户端已断开时静默丢弃（控制器已关闭，enqueue 会抛错打断收尾逻辑） */
      const push = (payload: object | string) => {
        if (req.signal.aborted) return;
        try { controller.enqueue(sse(payload)); } catch { /* 客户端已断开，控制器已关闭 */ }
      };

      // ① 首帧：牌面 + 牌库基础牌义，同步入队 ⇒ 用户 0 等待就有内容可读
      push({ meta: buildMeta(baseMeanings, BASE_CAUTION, 'streaming') });

      // 正文/结构化尾块的切流状态机
      // head: 判定模型是否违规直出 JSON；body: 正文透传；struct: 标记后的 JSON；json: 整体 JSON 兜底
      let phase: 'head' | 'body' | 'struct' | 'json' = 'head';
      let pending = '';   // 尚未下发的正文尾巴（防标记被 delta 切成两半）
      let bodyText = '';  // 已下发的正文全文
      let structRaw = ''; // 标记之后（或 json 兜底时的全部）原文
      const hold = TAROT_STRUCT_MARKER.length - 1;

      const emit = (text: string) => {
        if (!text) return;
        bodyText += text;
        push({ content: text });
      };

      /**
       * 用一帧 replace 语义的 content 覆盖已下发的正文（协议扩展：`{ content, replace: true }`）。
       * 追加帧无法「收回」已经流出去的残缺正文/裸 JSON，前端会把它和后来的兜底文案拼在一起展示。
       */
      const replaceBody = (text: string) => {
        bodyText = text;
        push({ content: text, replace: true });
      };

      const feed = (delta: string, flushing = false) => {
        if (phase === 'struct' || phase === 'json') {
          structRaw += delta;
          return;
        }
        pending += delta;

        if (phase === 'head') {
          const stripped = pending.replace(/^\s*```[a-zA-Z]*\s*/, '').replace(/^\s+/, '');
          if (!flushing && stripped.length < 8) return; // 样本不足以判定，等下一个 delta
          if (stripped.startsWith('{')) {
            // 模型无视格式要求整体输出 JSON：全缓冲、不下发，流尾解析出 reading 再补发，
            // 避免把裸 JSON 流到用户脸上
            phase = 'json';
            structRaw = stripped;
            pending = '';
            return;
          }
          phase = 'body';
          pending = stripped;
        }

        const idx = pending.indexOf(TAROT_STRUCT_MARKER);
        if (idx >= 0) {
          emit(pending.slice(0, idx));
          structRaw = pending.slice(idx + TAROT_STRUCT_MARKER.length);
          pending = '';
          phase = 'struct';
          return;
        }
        if (flushing) {
          emit(stripTrailingMarkerPrefix(pending));
          pending = '';
          return;
        }
        if (pending.length > hold) {
          emit(pending.slice(0, pending.length - hold));
          pending = pending.slice(pending.length - hold);
        }
      };

      let needRefund = false;   // AI 没出真解读 → 退还刚扣的配额（在下方 finally 里关流前 await）
      let upstreamOpened = false; // 开流成功过：此后的失败熔断器没机会记账，兜底时补报一笔

      const emitFallback = (reason: string) => {
        const fb = buildFallbackReading(cards);
        needRefund = true;
        // 回退率观测/告警：改造前由 client.ts 的 observed('tarot', …) 承担，流式路径要自己补上
        finalizers.push(() => recordAiOutcome('tarot', 'fallback'));
        if (upstreamOpened) finalizers.push(reportCircuitFailure);
        // replace:true —— 兜底文案是要「替换」已下发的残缺正文，不是接在它后面
        replaceBody(fb.reading);
        push({ meta: buildMeta(fb.cardMeanings, fb.caution, 'fallback', reason) });
      };

      /**
       * 收口：正常读完 / 中途出错 / 卡死超时三条路径共用。
       * - 已有足量正文 → 按成功处理（用户不该因为最后一截断流而丢掉已生成的解读）
       * - 正文不足 → 兜底基础牌义 + 退款
       * clean=false（出错/超时）时正文可能被截断，只落库不写缓存——truncated 结果不该被别人复用 12h。
       * 客户端已断开时：帧一律不发（push 内部拦截）、也不退款（退款会给「中途断开刷次数」留口子），
       * 但落库/写缓存照做——这两件事在改造前是断连之前就 await 完的，不能跟着退款一起被跳过。
       */
      let settled = false;
      const settle = (reason: string, clean: boolean) => {
        if (settled) return;
        settled = true;
        const aborted = req.signal.aborted;

        feed('', true); // 冲掉尾部缓冲
        let struct = parseStructBlock(structRaw);
        let allowCache = clean;

        if (phase === 'json') {
          // 整体 JSON 兜底：head 相位就识别出来了，正文一个字都没下发，把 reading 一次性补发
          const recovered = typeof struct?.reading === 'string' ? struct.reading.replace(/\\n/g, '\n').trim() : '';
          if (recovered) emit(recovered);
        } else if (/\{[\s\S]*"reading"\s*:/.test(bodyText)) {
          // 模型先说一句前言再吐 JSON：head 相位只看首字符判不出来，裸 JSON 已经当正文流给用户了。
          // 这里收口时兜住（改造前 client.ts 走 json_object + /\{[\s\S]*\}/ 提取，前言天然被容忍）：
          const parsedBody = parseStructBlock(bodyText);
          const recovered = typeof parsedBody?.reading === 'string' ? parsedBody.reading.replace(/\\n/g, '\n').trim() : '';
          const prefix = bodyText.slice(0, bodyText.indexOf('{')).trim();
          // 前缀够长 = 模型把结构块直接附在正文后（漏了标记）：留正文丢 JSON；
          // 否则整段都是 JSON：用抠出来的 reading 顶上
          const fixed = prefix.length >= MIN_READING_CHARS ? prefix : recovered;
          if (parsedBody) struct = parsedBody;
          allowCache = false; // 违规输出不进 12h 缓存，免得一份裸 JSON 被别人复用半天
          if (fixed) replaceBody(fixed);
          else bodyText = ''; // reading 都抠不出来 → 清空正文交给下面的长度判定走兜底（兜底帧本身就是 replace 语义）
        }

        const reading = bodyText.trim();
        if (reading.length < MIN_READING_CHARS) {
          if (!aborted) emitFallback(reason); // 断连时不发帧也不退款
          return;
        }

        const cardMeanings = normalizeCardMeanings(struct?.cardMeanings, cards.length, spread, baseMeanings);
        const caution = normalizeCaution(struct?.caution, spread, BASE_CAUTION);
        // ② 终帧：完整结构化结果覆盖首帧（移动端整段缓冲时取最后一个 meta 即为完整数据）
        push({ meta: buildMeta(cardMeanings, caution, 'deepseek') });
        if (allowCache) finalizers.push(() => setCache(cacheKey, { cardMeanings, reading, caution }, 12 * 60 * 60));
        finalizers.push(() => persistReading(reading));
        finalizers.push(() => recordAiOutcome('tarot', 'deepseek'));
      };

      // 上游卡死的兜底闸：到点主动断上游，让 settle 走「已有正文就当成功、否则兜底」，
      // 避免被 Vercel 在 maxDuration 处硬杀——那样客户端拿不到终帧也拿不到 [DONE]
      const deadline = setTimeout(() => { void proxy.cancel(upstreamReader); }, 105_000);

      // 空闲 watchdog：收到上游字节就续命；超时主动 abort 当前上游 → read() 抛 AbortError →
      // 下面的 catch 走 settle(…, false)（够长按成功，否则兜底 + 退款），不新造分支
      let abortUpstream: (() => void) | null = null;
      let detachUpstream: (() => void) | null = null;
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      const armIdleWatchdog = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          logger.error(SERVICE, `upstream idle > ${UPSTREAM_IDLE_MS}ms, aborting`);
          abortUpstream?.();
        }, UPSTREAM_IDLE_MS);
      };

      try {
        // 按后台开关解析出 [主 provider, 兜底 provider]（已过滤没配 key 的）
        const providers = await resolveProviders();
        let upstream: Response | null = null;
        let failReason = 'upstream_error';

        if (!providers.length) {
          failReason = 'no_api_key'; // 没配 key 是配置问题，不算上游故障，不进熔断计数
        } else if (proxy.signal.aborted) {
          failReason = 'client_aborted'; // 用户先跑了，别让这笔算到上游头上污染熔断计数
        } else {
          // 开流阶段包进熔断器：上游整体挂掉时后续请求快速短路成兜底（CircuitOpenError），
          // 失败也计入 `ai:tarot`——改造前这层保护由 client.ts 的 callDeepSeek 提供，直连上游后必须自己接回来
          try {
            const opened = await withCircuitBreaker(AI_CIRCUIT, async () => {
              for (const p of providers) {
                if (proxy.signal.aborted) break;
                try {
                  const o = await openUpstream(p);
                  if (o.res.ok && o.res.body) return o;
                  // 非 2xx：释放连接与监听后再试下一个 provider（TTFB 超时会以 AbortError 走 catch）
                  o.abort();
                  o.detach();
                  logger.error(SERVICE, `upstream non-ok ${o.res.status} (provider=${p.id})`);
                } catch (err) {
                  logger.error(SERVICE, `upstream fetch failed (provider=${p.id})`, err instanceof Error ? err : undefined);
                }
              }
              throw new Error('all providers failed'); // 抛给熔断器记一笔失败
            });
            upstream = opened.res;
            abortUpstream = opened.abort;
            detachUpstream = opened.detach; // 读完/出错后再移除客户端断连监听（读流期间必须留着）
            upstreamOpened = true;
          } catch (err) {
            if (err instanceof CircuitOpenError) failReason = 'circuit_open';
            logger.error(SERVICE, `no upstream available (${failReason})`, err instanceof Error ? err : undefined);
          }
        }

        if (!upstream) {
          settled = true; // 上游一个都没开起来，直接兜底收口
          if (!req.signal.aborted) emitFallback(failReason);
        } else {
          upstreamReader = upstream.body!.getReader();
          let buffer = '';
          armIdleWatchdog();
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;
            armIdleWatchdog(); // 上游还在吐字节（思考阶段也算活着）
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const ln of lines) {
              const t = ln.trim();
              if (!t.startsWith('data:')) continue;
              const d = t.slice(5).trim();
              if (d === '[DONE]') continue;
              try {
                const delta: unknown = JSON.parse(d)?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta) feed(delta);
              } catch { /* 单行 JSON 不完整则跳过 */ }
            }
          }
          settle('empty_or_too_short', true);
        }
      } catch (err) {
        logger.error(SERVICE, 'stream failed', err instanceof Error ? err : undefined);
        try { settle(err instanceof Error ? err.message : String(err), false); } catch { /* 客户端已断开 */ }
      } finally {
        clearTimeout(deadline);
        if (idleTimer) clearTimeout(idleTimer);
        detachUpstream?.();
        // ③ 退款先于关流 await：配额就是钱，不赌「响应结束后的后台任务一定跑得到」。
        // 只在兜底路径触发（正常路径 needRefund=false，零额外开销），且此时兜底文案已下发，
        // 用户只是晚几十毫秒收到 [DONE]
        if (needRefund) await refundIfCharged();
        try {
          controller.enqueue(sse('[DONE]'));
          controller.close();
        } catch { /* 客户端已断开，控制器已关闭 */ }
        proxy.release();
      }

      // ④ 其余收尾（写缓存/落库/观测）交给 after()：响应关闭后由 waitUntil 保障执行，一帧都不为它们等待。
      // 这里先放行等待中的 after 回调（finalizers 此刻已登记齐），仅在 after() 不可用的运行时才内联跑
      markStreamDone();
      if (finalizeInline) await runFinalizers();
    },
    async cancel() {
      await proxy.cancel(upstreamReader);
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}
