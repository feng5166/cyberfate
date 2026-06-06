import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.modelverse.cn/v1';

  if (!key) {
    return NextResponse.json({ error: 'no key' });
  }

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.AI_PRIMARY_MODEL || 'deepseek-v4-pro',
        max_tokens: 20,
        enable_thinking: false,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();
    return NextResponse.json({
      status: resp.status,
      ok: resp.ok,
      content: data.choices?.[0]?.message?.content ?? null,
      error: data.error ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json({ threw: e instanceof Error ? e.message : String(e) });
  }
}
