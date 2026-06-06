import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPSEEK_API_KEY ?? '';
  const baseUrl = process.env.AI_BASE_URL || 'https://api.modelverse.cn/v1';

  const results: Record<string, unknown> = { baseUrl };

  // 测试1: modelverse
  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-v4-pro', max_tokens: 10, enable_thinking: false, messages: [{ role: 'user', content: 'hi' }] }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await r.json();
    results.modelverse = { status: r.status, content: data.choices?.[0]?.message?.content ?? null, error: data.error ?? null };
  } catch (e: unknown) {
    results.modelverse = { threw: e instanceof Error ? e.message : String(e) };
  }

  // 测试2: 直接 IP
  try {
    const r = await fetch('https://106.75.185.110/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, Host: 'api.modelverse.cn' },
      body: JSON.stringify({ model: 'deepseek-v4-pro', max_tokens: 10, enable_thinking: false, messages: [{ role: 'user', content: 'hi' }] }),
      signal: AbortSignal.timeout(8000),
    });
    results.directIp = { status: r.status };
  } catch (e: unknown) {
    results.directIp = { threw: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results);
}
