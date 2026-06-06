import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const raw = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api-sg.umodelverse.ai/v1';
  const model = process.env.AI_PRIMARY_MODEL || 'deepseek-v4-pro';

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
    nodeEnv: process.env.NODE_ENV,
    envKeys: Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('AI_') || k.includes('PRIMARY')),
  });
}
