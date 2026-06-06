import { NextResponse } from 'next/server';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { buildTarotReadingPrompt, buildTarotReadingSystemPrompt } from '@/lib/ai/prompts';

export const maxDuration = 30;

export async function GET() {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  const baseUrl = AI_BASE_URL;
  const model = PRIMARY_MODEL;

  const input = {
    spread: 'three' as const,
    spreadName: '经典三张牌',
    question: '测试',
    cards: [
      { position: '过去', name: '女祭司', orientation: 'upright' as const, keywords: ['直觉'], traditionalMeaning: '内在智慧' },
      { position: '现在', name: '节制', orientation: 'upright' as const, keywords: ['平衡'], traditionalMeaning: '平衡和谐' },
      { position: '未来', name: '隐士', orientation: 'reversed' as const, keywords: ['内省'], traditionalMeaning: '孤立迷失' },
    ],
  };

  const systemPrompt = buildTarotReadingSystemPrompt({ spread: input.spread, spreadName: input.spreadName });
  const userPrompt = buildTarotReadingPrompt(input);
  const maxTokens = 3500;

  // 完全复制 callDeepSeek 的逻辑，但暴露错误
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110000);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.3, enable_thinking: false, messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]}),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ step: 'fetch_not_ok', status: response.status, body: err.slice(0, 300) });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const reasoningContent = data.choices?.[0]?.message?.reasoning_content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ step: 'no_json', contentLen: content.length, contentPreview: content.slice(0, 200), reasoningLen: reasoningContent.length });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return NextResponse.json({ step: 'json_parse_error', error: String(e), jsonPreview: jsonMatch[0].slice(0, 200) });
    }

    const p = parsed as Record<string, unknown>;
    return NextResponse.json({
      step: 'success',
      hasCardMeanings: Array.isArray(p.cardMeanings),
      cardMeaningsLen: Array.isArray(p.cardMeanings) ? p.cardMeanings.length : 0,
      hasReading: typeof p.reading === 'string',
      readingLen: typeof p.reading === 'string' ? p.reading.length : 0,
      hasCaution: typeof p.caution === 'string',
      keys: Object.keys(p),
    });
  } catch (e: unknown) {
    return NextResponse.json({ step: 'catch', error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
  }
}
