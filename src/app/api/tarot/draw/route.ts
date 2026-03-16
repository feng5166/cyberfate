import { NextRequest, NextResponse } from 'next/server';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';

const spreadConfig: Record<string, { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: { 
    count: 10, 
    positions: ['现状', '挑战', '根源', '过去', '目标', '未来', '自我', '环境', '希望/恐惧', '结果'] 
  },
};

export async function POST(req: NextRequest) {
  const { spread, question } = await req.json();

  const config = spreadConfig[spread] || spreadConfig.single;
  const cards = drawRandomCards(config.count);

  // 添加图片 URL
  const cardsWithImages = cards.map((c, idx) => ({
    ...c,
    image_url: getCardImageUrl(c),
    position: config.positions?.[idx]
  }));

  // 构建 AI prompt
  let cardDesc = '';
  if (spread === 'single') {
    const card = cards[0];
    cardDesc = `抽到的牌：${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）
关键词：${card.keywords.join('、')}
基础牌意：${card.orientation === 'upright' ? card.upright : card.reversed}`;
  } else if (spread === 'three') {
    cardDesc = cards.map((card, idx) => 
      `${config.positions![idx]}：${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）- ${card.keywords.join('、')}`
    ).join('\n');
  } else {
    cardDesc = cards.map((card, idx) => 
      `${config.positions![idx]}：${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）`
    ).join('\n');
  }

  const prompt = `你是一位专业的塔罗占卜师。

牌阵：${spread === 'single' ? '单张牌' : spread === 'three' ? '三张牌（过去-现在-未来）' : '凯尔特十字（深度分析）'}

${cardDesc}

${question ? `用户的问题：${question}` : '用户没有提出具体问题，请给出通用指引'}

请给出${spread === 'celtic' ? '300-400' : '150-200'}字的解读，包括：
${spread === 'three' ? '1. 过去的影响\n2. 现在的状况\n3. 未来的趋势\n4. 综合建议' : 
  spread === 'celtic' ? '1. 整体格局分析\n2. 核心挑战与机遇\n3. 内在与外在因素\n4. 最终结果预测\n5. 行动建议' :
  '1. 针对问题的分析（如果有问题）\n2. 当前状况的洞察\n3. 简短的行动建议'}

语气温和、有启发性，避免过于绝对的判断。`;

  // 调用 AI
  let ai_reading = '';
  try {
    const aiResponse = await fetch(`${process.env.ANTHROPIC_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: spread === 'celtic' ? 800 : 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status, await aiResponse.text());
      ai_reading = cards.map(c => c.orientation === 'upright' ? c.upright : c.reversed).join('\n\n');
    } else {
      const aiData = await aiResponse.json();
      ai_reading = aiData.content?.[0]?.text || cards[0].upright;
    }
  } catch (err) {
    console.error('AI call failed:', err);
    ai_reading = cards.map(c => c.orientation === 'upright' ? c.upright : c.reversed).join('\n\n');
  }

  return NextResponse.json({
    spread,
    cards: cardsWithImages,
    ai_reading
  });
}
