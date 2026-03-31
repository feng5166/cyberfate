import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';

// 十二宫位
const palaces = [
  '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '奴仆宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
];

// 主星（简化版）
const mainStars = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'
];

// 简化的排盘算法
function generateChart(birthDate: string, birthHour: string, gender: string) {
  // 实际应该用专业的紫微斗数算法
  // 这里用简化版模拟
  return palaces.map((palace, idx) => {
    const starCount = Math.floor(Math.random() * 3) + 1;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push(mainStars[Math.floor(Math.random() * mainStars.length)]);
    }
    return { name: palace, stars };
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { name, gender, birthDate, birthHour } = await req.json();

  // 缓存 key
  const cacheKey = generateCacheKey('ziwei', { birthDate, birthHour, gender });
  
  // 检查缓存
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, _source: 'cache' });
  }

  // 生成命盘
  const chart = generateChart(birthDate, birthHour, gender);
  
  // 找到命宫主星
  const mingGong = chart[0];
  const mainStar = mingGong.stars[0] || '紫微';

  // AI 解读
  const prompt = `你是"赛博命理师"的紫微斗数解读功能。

用户信息：
- 姓名：${name || '缘主'}
- 性别：${gender === 'male' ? '男' : '女'}
- 出生日期：${birthDate}
- 命宫主星：${mainStar}

【输出规则】
- 严格按照以下结构输出，每段控制在指定字数内
- 语气温和、积极、有启发性
- 直接开始解读，不要有前言或套话

【输出结构】（总计 220 字）
**性格特质**（60字）
根据命宫主星分析性格特点，3 条要点，简练客观。

**事业运势**（60字）
分析事业发展方向、运势起伏、适合领域。

**感情运势**（60字）
分析感情运势、婚姻特点、与伴侣相处建议。

**人生建议**（40字）
综合建议，2-3 条，切实可行。`;

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
        max_tokens: 600,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      analysis = aiData.choices?.[0]?.message?.content || '解读生成失败';
      aiSource = 'deepseek';
    }
  } catch (err) {
    console.error('AI call failed:', err);
    analysis = '命盘显示您性格坚毅，事业有成，感情顺遂。';
    aiSource = 'fallback';
  }

  // 写入缓存
  const result = { chart, analysis };
  await setCache(cacheKey, result);

  return NextResponse.json({ ...result, _source: aiSource });
}
