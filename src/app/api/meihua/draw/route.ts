import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';


// 八卦
const bagua = [
  { name: '乾', symbol: '☰', meaning: '天' },
  { name: '兑', symbol: '☱', meaning: '泽' },
  { name: '离', symbol: '☲', meaning: '火' },
  { name: '震', symbol: '☳', meaning: '雷' },
  { name: '巽', symbol: '☴', meaning: '风' },
  { name: '坎', symbol: '☵', meaning: '水' },
  { name: '艮', symbol: '☶', meaning: '山' },
  { name: '坤', symbol: '☷', meaning: '地' },
];

function getGua(method: string, numbers?: any) {
  let upper, lower;
  
  if (method === 'time') {
    const now = new Date();
    upper = (now.getHours() + now.getMinutes()) % 8;
    lower = (now.getMinutes() + now.getSeconds()) % 8;
  } else {
    upper = (parseInt(numbers.num1) || 1) % 8;
    lower = (parseInt(numbers.num2) || 1) % 8;
  }
  
  const upperGua = bagua[upper];
  const lowerGua = bagua[lower];
  const guaName = `${upperGua.meaning}${lowerGua.meaning}`;
  
  return {
    gua: `${upperGua.symbol}\n${lowerGua.symbol}`,
    guaName,
    upper: upperGua.name,
    lower: lowerGua.name
  };
}

export async function POST(req: NextRequest) {
  const { method, numbers } = await req.json();
  
  const guaInfo = getGua(method, numbers);
  
  // 缓存 key
  const cacheKey = generateCacheKey('meihua', { 
    upper: guaInfo.upper, 
    lower: guaInfo.lower
  });
  
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...guaInfo, analysis: cached.analysis, _source: 'cache' });
  }

  const prompt = `你是"赛博命理师"的梅花易数占卜功能。

卦象：${guaInfo.guaName}（${guaInfo.upper}上${guaInfo.lower}下）

【输出规则】
- 严格按照以下结构输出，每段控制在指定字数内
- 语气温和、有启发性
- 直接开始解读，不要有前言

【输出结构】（总计 150 字）
**卦象含义**（50字）
解释此卦的象征意义、五行属性、阴阳关系。

**吉凶判断**（40字）
判断吉凶、趋势走向，2-3 条要点。

**行动建议**（60字）
给出具体可行的行动指导，3-4 条建议。`;

  let analysis = '';
  let aiSource: string = 'fallback';
  try {
    const aiResponse = await fetch('https://api.modelverse.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        max_tokens: 400,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      analysis = aiData.choices?.[0]?.message?.content || '解读生成失败';
      aiSource = 'deepseek';
      await setCache(cacheKey, { analysis });
    }
  } catch (err) {
    analysis = '此卦吉凶参半，需谨慎行事。';
  }

  return NextResponse.json({ ...guaInfo, analysis, _source: aiSource });
}
