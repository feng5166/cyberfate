import { NextResponse } from 'next/server';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { buildTarotReadingPrompt, buildTarotReadingSystemPrompt } from '@/lib/ai/prompts';

export async function GET() {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  const baseUrl = AI_BASE_URL;
  const model = PRIMARY_MODEL;

  const info = { apiKey: apiKey ? apiKey.slice(0,8)+'...' : null, baseUrl, model };

  if (!apiKey) return NextResponse.json({ ...info, error: 'no key' });

  // 直接调 callDeepSeek 逻辑
  const input = {
    spread: 'three' as const,
    spreadName: '经典三张牌',
    question: '测试',
    cards: [
      { position: '过去', name: '愚者', orientation: 'upright' as const, keywords: ['自由'], traditionalMeaning: '新的开始' },
    ],
  };
  const systemPrompt = buildTarotReadingSystemPrompt({ spread: input.spread, spreadName: input.spreadName });
  const userPrompt = buildTarotReadingPrompt(input);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: 500, temperature: 0.3, enable_thinking: false, messages: [{ role: 'system', content: systemPrompt.slice(0,200) }, { role: 'user', content: userPrompt.slice(0,200) }] }),
    });
    clearTimeout(timer);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ ...info, status: resp.status, contentLen: content.length, contentPreview: content.slice(0,100), error: data.error ?? null });
  } catch (e: unknown) {
    return NextResponse.json({ ...info, threw: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
  }
}
