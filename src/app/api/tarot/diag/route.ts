import { NextResponse } from 'next/server';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

export const maxDuration = 30;

export async function GET() {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  const baseUrl = AI_BASE_URL;
  const model = PRIMARY_MODEL;

  const start = Date.now();
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 50,
        temperature: 0.3,
        enable_thinking: false,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    const elapsed = Date.now() - start;
    const data = await resp.json();
    return NextResponse.json({
      ok: resp.status === 200,
      status: resp.status,
      elapsedMs: elapsed,
      content: data.choices?.[0]?.message?.content ?? null,
      error: data.error ?? null,
      baseUrl,
      model,
    });
  } catch (e: unknown) {
    return NextResponse.json({
      ok: false,
      elapsedMs: Date.now() - start,
      threw: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      baseUrl,
    });
  }
}
