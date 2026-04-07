import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateMeihuaDecision } from '@/lib/ai/client';
import type { MeihuaDecisionPromptInput } from '@/lib/ai/prompts';

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

    const cached = await getCache(cacheKey);
    if (cached?.overallAdvice) {
      return NextResponse.json({ ...cached, _source: 'cache' });
    }

    const decision = await generateMeihuaDecision(input);
    await setCache(cacheKey, decision, 12 * 60 * 60);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('[Meihua Decide] error:', error);
    return NextResponse.json(
      { error: '决策建议生成失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
