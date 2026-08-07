import { NextRequest, NextResponse, after } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateLiuYaoReading } from '@/lib/ai/client';
import type { LiuYaoPromptInput } from '@/lib/ai/prompts';
import { applyChaos } from '@/lib/chaos-middleware';
import { log } from '@/lib/logger';
import { checkLiuyaoQuota, refundQuota } from '@/lib/quota';
import { SSE_HEADERS, typewriterStream } from '@/lib/ai/sse';
import { isDebugRequest } from '@/lib/ai/debug';
import {
  identifyTrigrams,
  getHexagramName,
  getLineTexts,
  getLineTitle,
  HEXAGRAM_JUDGMENTS,
} from '@/lib/liuyao/data';

interface LiuYaoRequestBody {
  question?: string;
  hexagrams: {
    upper: string;
    lower: string;
    lines: number[];
    movingLines?: number[];
  };
  method: 'manual' | 'coin' | 'time' | 'number';
  divinationTime: string;
}

interface LiuYaoLineResult {
  index: number;
  type: 'yin' | 'yang';
  title: string;
  originalText: string;
  interpretation: string;
}

interface LiuYaoMeta {
  hexagramName: string;
  upperTrigram: string;
  lowerTrigram: string;
  upperSymbol: string;
  lowerSymbol: string;
  lines: LiuYaoLineResult[];
  judgment: string;
  actionAdvice: {
    summary: string;
    positives: string[];
    cautions: string[];
    actions: string[];
  };
  _source?: string;
  _error?: string;
}

function validateRequest(body: unknown): { valid: true; data: LiuYaoRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '请求体不能为空' };
  }

  const b = body as Record<string, unknown>;

  if (!b.hexagrams || typeof b.hexagrams !== 'object') {
    return { valid: false, error: '缺少卦象数据' };
  }

  const hex = b.hexagrams as Record<string, unknown>;

  if (!Array.isArray(hex.lines) || hex.lines.length !== 6) {
    return { valid: false, error: '需要6根爻的数据' };
  }

  const lines = hex.lines as number[];
  if (lines.some((l) => l !== 0 && l !== 1)) {
    return { valid: false, error: '爻数据只能为0(阴)或1(阳)' };
  }

  const method = b.method;
  if (method !== 'manual' && method !== 'coin' && method !== 'time' && method !== 'number') {
    return { valid: false, error: '无效的起卦方式' };
  }

  let movingLines: number[] = [];
  if (Array.isArray(hex.movingLines)) {
    movingLines = (hex.movingLines as number[]).filter(
      (v) => typeof v === 'number' && v >= 0 && v <= 5
    );
  }

  return {
    valid: true,
    data: {
      question: typeof b.question === 'string' ? b.question.trim().slice(0, 200) : '',
      hexagrams: {
        upper: typeof hex.upper === 'string' ? hex.upper : '',
        lower: typeof hex.lower === 'string' ? hex.lower : '',
        lines,
        movingLines,
      },
      method: method as LiuYaoRequestBody['method'],
      divinationTime: typeof b.divinationTime === 'string' ? b.divinationTime : new Date().toISOString(),
    },
  };
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const isDebugMode = isDebugRequest(req);

  const { getAuthSession } = await import('@/lib/auth-session');
  const session = await getAuthSession(req);
  if (!isDebugMode && !session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  // 限流必须在缓存查询之前：缓存命中虽然零 AI 成本，但仍要跑 typewriterStream（约 2.9s 占住函数），
  // 放到缓存之后等于同一份 body 可无限重放，单账号就能打满并发额度。
  // 它只是同区 Redis 一次往返，不是本轮想省掉的跨区 DB 往返
  if (!isDebugMode) {
    const rl = await checkRateLimit('ai_liuyao', session!.user!.id, 10, 60);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const validation = validateRequest(body);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { data } = validation;
  const { lines, movingLines = [] } = data.hexagrams;

  const { upperKey, lowerKey, upper, lower } = identifyTrigrams(lines);

  const hexagramName = getHexagramName(upperKey, lowerKey);
  const judgment = HEXAGRAM_JUDGMENTS[hexagramName] || '卦辞待补充。';
  const lineTexts = getLineTexts(hexagramName, lines);

  const linesData: LiuYaoLineResult[] = lines.map((line, index) => ({
    index,
    type: (line === 1 ? 'yang' : 'yin') as 'yin' | 'yang',
    title: getLineTitle(index, line === 1 ? 'yang' : 'yin'),
    originalText: lineTexts[index],
    interpretation: '',
  }));

  const movingSuffix = movingLines.length > 0 ? `_m${movingLines.sort().join('')}` : '';
  const cacheKey = generateCacheKey('liuyao_v2', {
    lines: lines.join(''),
    question: data.question || '',
    method: data.method,
    moving: movingSuffix,
  });

  // 缓存优先：命中即零 AI 成本，故不扣配额（原顺序是先扣再退，白白多两次跨区 DB 往返）
  const cached = isDebugMode ? null : await getCache(cacheKey);
  if (cached && typeof cached === 'object') {
    const c = cached as Record<string, unknown>;
    if (Array.isArray(c.lineInterpretations) && typeof c.overallNarrative === 'string') {
      const cachedLines = linesData.map((l, i) => ({
        ...l,
        interpretation: (c.lineInterpretations as string[])[i] || '',
      }));

      const meta: LiuYaoMeta = {
        hexagramName,
        upperTrigram: `${upper.name}（${upper.nature}）`,
        lowerTrigram: `${lower.name}（${lower.nature}）`,
        upperSymbol: upper.symbol,
        lowerSymbol: lower.symbol,
        lines: cachedLines,
        judgment,
        actionAdvice: {
          summary: (c.summary as string) || '',
          positives: (c.positives as string[]) || [],
          cautions: (c.cautions as string[]) || [],
          actions: (c.actions as string[]) || [],
        },
        _source: 'cache',
      };

      return new Response(typewriterStream(meta, c.overallNarrative as string), { headers: SSE_HEADERS });
    }
  }

  // 缓存未命中 → 真要花 AI 钱，此时才扣配额
  let quotaConsumed = false;
  if (!isDebugMode) {
    // 配额：免费 1 次/天（FREE_DAILY_LIMIT），VIP 不限。
    // JWT 里的 isSubscribed 只作提示传入，真实会员态由 quota 内部查 DB 认定
    const quota = await checkLiuyaoQuota(session!.user!.id, session!.user!.isSubscribed);
    if (!quota.hasQuota) {
      return NextResponse.json({
        error: 'QUOTA_EXCEEDED',
        message: `今日六爻解读已达上限（${quota.limit} 次），请升级 VIP 解锁不限次数。`,
      }, { status: 403 });
    }
    quotaConsumed = !quota.isVip;
  }

  const movingLineDescriptions = movingLines.length > 0
    ? movingLines.map((idx) => `第${idx + 1}爻（${linesData[idx]?.title || ''}）为动爻`).join('；')
    : '无动爻（纯静卦）';

  const promptInput: LiuYaoPromptInput = {
    question: data.question || '',
    hexagramName,
    upperTrigram: `${upper.name}（${upper.nature}）`,
    lowerTrigram: `${lower.name}（${lower.nature}）`,
    lines: linesData.map((l) => ({
      index: l.index,
      type: l.type,
      title: l.title,
      originalText: l.originalText,
    })),
    judgment,
    divinationTime: data.divinationTime,
    movingLines: movingLineDescriptions,
    method: data.method,
  };

  // 熔断已下沉到 client.ts 的 callDeepSeek；此处保留路由层防御 try/catch：AI 意外抛错时直接重试一次兜底，不让请求 500
  let reading: Awaited<ReturnType<typeof generateLiuYaoReading>>;
  try {
    reading = await generateLiuYaoReading(promptInput);
    log({ service: 'liuyao', level: 'info', message: 'AI reading success', meta: { source: reading._source } });
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[liuyao] AI reading failed, using fallback. error:', errMsg);
    try {
      reading = await generateLiuYaoReading(promptInput);
    } catch (retryErr) {
      // 二次也抛（generateLiuYaoReading 内部已吞异常，走到这里说明是非预期错误）：
      // 此时配额已扣、用户什么都拿不到，必须先退还再把错误交给上层，否则白丢一次免费额度
      if (quotaConsumed) {
        await refundQuota(session!.user!.id, 'liuyaoCount').catch(() => {});
      }
      throw retryErr;
    }
  }

  // fallback 不消耗配额
  if (quotaConsumed && reading._source === 'fallback') {
    await refundQuota(session!.user!.id, 'liuyaoCount');
  }

  const enrichedLines = linesData.map((l, i) => ({
    ...l,
    interpretation: reading.lineInterpretations[i] || '',
  }));

  // 只缓存真·AI 结果：降级文案是本地模板（buildFallbackLiuYaoReading，纯本地零成本可随时重算），
  // 一旦被写进 12h 缓存，上游抖动那几分钟产生的一条模板会在之后 12 小时内反复回给所有同 key 用户，
  // 他们付了配额却只能拿到模板、且刷新无效。不写缓存 = 上游恢复后下一个人立刻拿到真解读。
  if (reading._source !== 'fallback') {
    // 载荷在这里就固化（不要留到回调里现取 reading 的字段）：延后执行意味着
    // 中间任何一次对 reading 的改动都会被写进缓存，快照掉这条隐患
    const cachePayload = {
      lineInterpretations: reading.lineInterpretations,
      overallNarrative: reading.overallNarrative,
      summary: reading.summary,
      positives: reading.positives,
      cautions: reading.cautions,
      actions: reading.actions,
    };
    const writeCache = () => setCache(cacheKey, cachePayload, 12 * 60 * 60);

    // 写缓存搬出用户等待路径：这一步紧接在 20~60s 的 AI 等待之后，而 undici 默认
    // keepAliveTimeout 只有 4s —— 等 AI 期间那条 Redis 连接必然已被回收，这次 setex
    // 要重付一次 TCP+TLS 握手（生产实测 hkg1→Upstash 约 268ms），过去整整计入用户
    // 拿到首字节的时间。after() 在 Vercel 上映射到 waitUntil：响应关闭后仍保证执行，
    // 缓存照写，只是用户不再为它等待。
    try {
      after(writeCache);
    } catch (err) {
      // 拿不到 waitUntil 的运行时（单测宿主 / 非 Next 环境）after() 会同步抛错：
      // 退回原来的内联 await，行为不比改造前差（与 tarot/draw 的降级写法一致）
      log({
        service: 'liuyao',
        level: 'warn',
        message: 'after() unavailable, write cache inline',
        meta: { reason: err instanceof Error ? err.message : String(err) },
      });
      await writeCache();
    }
  }

  const meta: LiuYaoMeta = {
    hexagramName,
    upperTrigram: `${upper.name}（${upper.nature}）`,
    lowerTrigram: `${lower.name}（${lower.nature}）`,
    upperSymbol: upper.symbol,
    lowerSymbol: lower.symbol,
    lines: enrichedLines,
    judgment,
    actionAdvice: {
      summary: reading.summary,
      positives: reading.positives,
      cautions: reading.cautions,
      actions: reading.actions,
    },
    _source: reading._source,
    _error: (reading as { _error?: string })._error,
  };

  return new Response(typewriterStream(meta, reading.overallNarrative), { headers: SSE_HEADERS });
}
