import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateMeihuaDecision, type MeihuaDecisionResult } from '@/lib/ai/client';
import type { MeihuaDecisionPromptInput } from '@/lib/ai/prompts';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { applyChaos } from '@/lib/chaos-middleware';
import { checkMeihuaDecideQuota, refundQuota } from '@/lib/quota';
import { SSE_HEADERS, typewriterStream } from '@/lib/ai/sse';
import { isDebugRequest } from '@/lib/ai/debug';

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

  const isDebugMode = isDebugRequest(req);

  // Security Fix: SEC-012 — 添加登录检查
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!isDebugMode && !session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const userId = isDebugMode ? 'debug' : session!.user.id;
  // 限流必须在缓存查询之前：缓存命中虽然零 AI 成本，但仍要跑 typewriterStream（约 2.9s 占住函数），
  // 放到缓存之后等于同一份 body 可无限重放，单账号就能打满并发额度。
  // 它只是同区 Redis 一次往返，不是本轮想省掉的跨区 DB 往返
  const rl = await checkRateLimit('ai_meihua', userId, 10, 60);
  if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });

  let quotaConsumed = false;
  try {
    const body = await req.json().catch(() => ({}));
    const question = safeText(body?.question).slice(0, 200);
    const draw = (body?.draw ?? {}) as DrawPayload;

    if (!question) {
      return NextResponse.json({ error: '问题不能为空' }, { status: 400 });
    }

    const input = buildInput(question, draw);
    const cacheKey = generateCacheKey('meihua_decide', {
      question: input.question,
      guaName: input.guaName,
      changedGuaName: input.changedGuaName,
      movingLine: input.movingLine,
    });

    // 缓存优先：命中即零 AI 成本，故不扣配额（原顺序是先扣再退，白白多两次跨区 DB 往返）
    const cached = await getCache(cacheKey);
    if (cached?.overallAdvice) {
      const cachedDecision = { ...(cached as MeihuaDecisionResult), _source: 'cache' as const };
      const { meta, narrative } = splitMeta(cachedDecision);
      return new Response(typewriterStream(meta, narrative), { headers: SSE_HEADERS });
    }

    // 缓存未命中 → 真要花 AI 钱，此时才扣配额
    // 配额：免费 1 次/天（FREE_DAILY_LIMIT），VIP 不限。
    // JWT 里的 isSubscribed 只作提示传入，真实会员态由 quota 内部查 DB 认定
    if (!isDebugMode) {
      const quota = await checkMeihuaDecideQuota(session!.user.id, session!.user.isSubscribed);
      if (!quota.hasQuota) {
        return NextResponse.json({
          error: 'QUOTA_EXCEEDED',
          message: `今日梅花决策已达上限（${quota.limit} 次），请升级 VIP 解锁不限次数。`,
        }, { status: 403 });
      }
      quotaConsumed = !quota.isVip;
    }

    // 熔断已下沉到 client.ts 的 callDeepSeek（generateMeihuaDecision 内部吞异常，路由再包熔断形同虚设）
    // 超时预算必须大于内层：client.ts 给 meihua 的 deadline 预算是 55s，到点 abort 后
    // generateMeihuaDecision 会吞掉异常返回本地降级结果（仍是一份可用解读）。
    // 外层若比内层短（原 50s），race 永远由外层先赢 → 抛 AiTimeoutError → 500 JSON，
    // 而前端按 SSE 解析，用户等满 50s 只看到报错，内层已生成/兜底好的内容被丢弃。
    // 取 57s：留 2s 给内层落地 + 3s 给 SSE 输出（vercel.json 该路由 maxDuration 60s），
    // 外层只作「内层彻底卡死」的最后兜底
    const decision = await withAiTimeout(() => generateMeihuaDecision(input), 57_000);

    if (quotaConsumed && (decision as { _source?: string })._source === 'fallback') {
      await refundQuota(session!.user.id, 'meihuaDecideCount');
    }

    await setCache(cacheKey, decision, 12 * 60 * 60);

    const { meta, narrative } = splitMeta(decision);
    return new Response(typewriterStream(meta, narrative), { headers: SSE_HEADERS });
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
