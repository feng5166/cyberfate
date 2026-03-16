import { NextRequest, NextResponse } from 'next/server';
import { drawRandomCards } from '@/data/tarot';

export async function POST(req: NextRequest) {
  const { spread, question } = await req.json();

  const cards = drawRandomCards(spread === 'single' ? 1 : 3);
  const card = cards[0];

  // 构建 AI prompt
  const prompt = `你是一位专业的塔罗占卜师。

抽到的牌：${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）
关键词：${card.keywords.join('、')}
基础牌意：${card.orientation === 'upright' ? card.upright : card.reversed}

${question ? `用户的问题：${question}` : '用户没有提出具体问题'}

请给出150-200字的解读，包括：
1. 针对问题的分析（如果有问题）
2. 当前状况的洞察
3. 简短的行动建议

语气温和、有启发性，避免过于绝对的判断。`;

  // 调用 AI
  const aiResponse = await fetch(`${process.env.ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const aiData = await aiResponse.json();
  const ai_reading = aiData.content[0].text;

  return NextResponse.json({
    spread,
    cards,
    ai_reading
  });
}
