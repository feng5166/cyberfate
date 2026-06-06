import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/cache/redis';

export const maxDuration = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const resetCircuit = url.searchParams.get('reset_circuit');

  const raw = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api-sg.umodelverse.ai/v1';
  const model = process.env.AI_PRIMARY_MODEL || 'deepseek-v4-pro';

  // 重置断路器
  let resetResult: string | null = null;
  if (resetCircuit) {
    const redis = getRedis();
    if (redis) {
      const keys = [
        'circuit:deepseek-liuyao-v4pro',
        'circuit:deepseek-tarot-v4pro',
        'circuit:deepseek-bazi-v4pro',
        'circuit:deepseek-daily-v4pro',
        'circuit:deepseek-meihua-v4pro',
      ];
      for (const k of keys) {
        await redis.del(k);
      }
      resetResult = `reset ${keys.length} circuit keys`;
    } else {
      resetResult = 'redis not available';
    }
  }

  // 查断路器状态
  let circuitStates: Record<string, unknown> = {};
  const redis = getRedis();
  if (redis) {
    const keys = ['deepseek-liuyao-v4pro', 'deepseek-tarot-v4pro', 'deepseek-bazi-v4pro'];
    for (const k of keys) {
      const state = await redis.get(`circuit:${k}`);
      circuitStates[k] = state;
    }
  }

  // 实际调用测试
  let callResult: string;
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${raw}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 20,
        messages: [{ role: 'user', content: 'reply: ok' }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
      callResult = `ok:${data.choices?.[0]?.message?.content?.slice(0, 30)}`;
    } else {
      const err = await resp.text();
      callResult = `http_${resp.status}:${err.slice(0, 100)}`;
    }
  } catch (e) {
    callResult = `error:${String(e).slice(0, 100)}`;
  }

  return NextResponse.json({
    hasRaw: !!raw,
    rawLen: raw?.length ?? 0,
    rawPreview: raw ? raw.slice(0, 8) + '...' : null,
    baseUrl,
    model,
    callResult,
    circuitStates,
    resetResult,
    nodeEnv: process.env.NODE_ENV,
    envKeys: Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('AI_') || k.includes('PRIMARY')),
  });
}
