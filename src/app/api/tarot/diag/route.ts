import { NextResponse } from 'next/server';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { buildTarotReadingPrompt, buildTarotReadingSystemPrompt } from '@/lib/ai/prompts';

export async function GET() {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  const baseUrl = AI_BASE_URL;
  const model = PRIMARY_MODEL;

  const input = {
    spread: 'three' as const,
    spreadName: '经典三张牌',
    question: '测试',
    cards: [
      { position: '过去', name: '愚者', orientation: 'upright' as const, keywords: ['自由'], traditionalMeaning: '新的开始' },
      { position: '现在', name: '魔术师', orientation: 'upright' as const, keywords: ['意志'], traditionalMeaning: '主动创造' },
      { position: '未来', name: '女祭司', orientation: 'upright' as const, keywords: ['直觉'], traditionalMeaning: '内在智慧' },
    ],
  };

  const systemPrompt = buildTarotReadingSystemPrompt({ spread: input.spread, spreadName: input.spreadName });
  const userPrompt = buildTarotReadingPrompt(input);

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: 1000, temperature: 0.3, enable_thinking: false, messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]}),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return NextResponse.json({
      status: resp.status,
      contentLen: content.length,
      contentPreview: content.slice(0, 200),
      hasCardMeanings: !!parsed?.cardMeanings,
      hasReading: !!parsed?.reading,
      parsedKeys: parsed ? Object.keys(parsed) : null,
    });
  } catch (e: unknown) {
    return NextResponse.json({ threw: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
  }
}
