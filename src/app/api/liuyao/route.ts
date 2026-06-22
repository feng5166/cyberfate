import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateLiuYaoReading } from '@/lib/ai/client';
import type { LiuYaoPromptInput } from '@/lib/ai/prompts';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { applyChaos } from '@/lib/chaos-middleware';
import { log } from '@/lib/logger';
import { checkLiuyaoQuota, refundQuota } from '@/lib/quota';
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

function buildStream(meta: LiuYaoMeta, narrative: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta })}\n\n`));

      // Chunk narrative for typewriter effect
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

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!isDebugMode && !session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  if (!isDebugMode) {
    const rl = await checkRateLimit('ai_liuyao', session!.user!.id, 10, 60);
    if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  // 配额：免费 1 次/天（FREE_DAILY_LIMIT），VIP 不限
  let quotaConsumed = false;
  if (!isDebugMode) {
    const quota = await checkLiuyaoQuota(session!.user!.id);
    if (!quota.hasQuota) {
      return NextResponse.json({
        error: 'QUOTA_EXCEEDED',
        message: `今日六爻解读已达上限（${quota.limit} 次），请升级 VIP 解锁不限次数。`,
      }, { status: 403 });
    }
    quotaConsumed = !quota.isVip;
  }

  const body = await req.json().catch(() => ({}));
  const validation = validateRequest(body);

  if (!validation.valid) {
    if (quotaConsumed) await refundQuota(session!.user!.id, 'liuyaoCount');
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

  const cached = isDebugMode ? null : await getCache(cacheKey);
  if (cached && typeof cached === 'object') {
    const c = cached as Record<string, unknown>;
    if (Array.isArray(c.lineInterpretations) && typeof c.overallNarrative === 'string') {
      if (quotaConsumed) await refundQuota(session!.user!.id, 'liuyaoCount');
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

      return new Response(buildStream(meta, c.overallNarrative as string), { headers: SSE_HEADERS });
    }
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

  let reading: Awaited<ReturnType<typeof generateLiuYaoReading>>;
  try {
    reading = await withCircuitBreaker('deepseek-liuyao-v4pro', () =>
      generateLiuYaoReading(promptInput)
    );
    log({ service: 'liuyao', level: 'info', message: 'AI reading success', meta: { source: reading._source } });
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[liuyao] AI reading failed, using fallback. error:', errMsg);
    // 直接调用不经过断路器的 fallback
    reading = await generateLiuYaoReading(promptInput);
  }

  // fallback 不消耗配额
  if (quotaConsumed && reading._source === 'fallback') {
    await refundQuota(session!.user!.id, 'liuyaoCount');
  }

  const enrichedLines = linesData.map((l, i) => ({
    ...l,
    interpretation: reading.lineInterpretations[i] || '',
  }));

  await setCache(cacheKey, {
    lineInterpretations: reading.lineInterpretations,
    overallNarrative: reading.overallNarrative,
    summary: reading.summary,
    positives: reading.positives,
    cautions: reading.cautions,
    actions: reading.actions,
  }, 12 * 60 * 60);

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

  return new Response(buildStream(meta, reading.overallNarrative), { headers: SSE_HEADERS });
}
