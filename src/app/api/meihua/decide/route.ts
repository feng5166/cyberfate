import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateMeihuaDecision, type MeihuaDecisionResult } from '@/lib/ai/client';
import type { MeihuaDecisionPromptInput } from '@/lib/ai/prompts';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';
import { applyChaos } from '@/lib/chaos-middleware';
import { checkMeihuaDecideQuota, refundQuota } from '@/lib/quota';

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

function splitMeta(decision: MeihuaDecisionResult & { _source?: string }) {
  const { overallAdvice, ...rest } = decision;
  return { meta: rest, narrative: overallAdvice };
}

interface DrawPayload {
  gua?: string;
  guaName?: string;
  changedGua?: string;
  changedGuaName?: string;
  movingLine?: number;
  analysis?: string;
  primary?: {
    upper?: { name?: string };
    lower?: { name?: string };
  };
  changed?: {
    upper?: { name?: string };
    lower?: { name?: string };
  };
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function safeLine(value: unknown, fallback = 3): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.round(value);
  return Math.min(6, Math.max(1, n));
}

function buildInput(question: string, draw: DrawPayload): MeihuaDecisionPromptInput {
  const upper = safeText(draw.primary?.upper?.name, '未知');
  const lower = safeText(draw.primary?.lower?.name, '未知');
  const changedUpper = safeText(draw.changed?.upper?.name, upper);
  const changedLower = safeText(draw.changed?.lower?.name, lower);

  return {
    question,
    guaName: safeText(draw.guaName, '未知卦象'),
    gua: safeText(draw.gua, ''),
    changedGuaName: safeText(draw.changedGuaName, safeText(draw.guaName, '未知卦象')),
    changedGua: safeText(draw.changedGua, safeText(draw.gua, '')),
    movingLine: safeLine(draw.movingLine, 3),
    upper,
    lower,
    changedUpper,
    changedLower,
    analysis: safeText(draw.analysis, '暂无基础解读。'),
  };
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  // Security Fix: SEC-012 — 添加登录检查
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!isDebugMode && !session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const userId = isDebugMode ? 'debug' : session!.user.id;
  const rl = await checkRateLimit('ai_meihua', userId, 10, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  // 配额：免费 1 次/天（FREE_DAILY_LIMIT），VIP 不限
  let quotaConsumed = false;
  if (!isDebugMode) {
    const quota = await checkMeihuaDecideQuota(session!.user.id);
    if (!quota.hasQuota) {
      return NextResponse.json({
        error: 'QUOTA_EXCEEDED',
        message: `今日梅花决策已达上限（${quota.limit} 次），请升级 VIP 解锁不限次数。`,
      }, { status: 403 });
    }
    quotaConsumed = !quota.isVip;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const question = safeText(body?.question).slice(0, 200);
    const draw = (body?.draw ?? {}) as DrawPayload;

    if (!question) {
      if (quotaConsumed) await refundQuota(session!.user.id, 'meihuaDecideCount');
      return NextResponse.json({ error: '问题不能为空' }, { status: 400 });
    }

    const input = buildInput(question, draw);
    const cacheKey = generateCacheKey('meihua_decide', {
      question: input.question,
      guaName: input.guaName,
      changedGuaName: input.changedGuaName,
      movingLine: input.movingLine,
    });

    const cached = await getCache(cacheKey);
    if (cached?.overallAdvice) {
      if (quotaConsumed) await refundQuota(session!.user.id, 'meihuaDecideCount');
      const cachedDecision = { ...(cached as MeihuaDecisionResult), _source: 'cache' as const };
      const { meta, narrative } = splitMeta(cachedDecision);
      return new Response(buildStream(meta, narrative), { headers: SSE_HEADERS });
    }

    const decision = await withCircuitBreaker('deepseek-meihua-v4pro', () =>
      withAiTimeout(() => generateMeihuaDecision(input), 50_000)
    );

    if (quotaConsumed && (decision as { _source?: string })._source === 'fallback') {
      await refundQuota(session!.user.id, 'meihuaDecideCount');
    }

    await setCache(cacheKey, decision, 12 * 60 * 60);

    const { meta, narrative } = splitMeta(decision);
    return new Response(buildStream(meta, narrative), { headers: SSE_HEADERS });
  } catch (error) {
    if (quotaConsumed) {
      try { await refundQuota(session!.user.id, 'meihuaDecideCount'); } catch {}
    }
    console.error('[Meihua Decide] error:', error);
    return NextResponse.json(
      { error: '决策建议生成失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
