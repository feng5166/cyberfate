import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

请给出200-300字的命盘解读，包括：
1. 性格特质分析
2. 事业运势
3. 感情运势
4. 人生建议

语气温和、积极、有启发性。直接开始解读，不要有前言。`;

  let analysis = '';
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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      analysis = aiData.choices?.[0]?.message?.content || '解读生成失败';
    }
  } catch (err) {
    console.error('AI call failed:', err);
    analysis = '命盘显示您性格坚毅，事业有成，感情顺遂。';
  }

  return NextResponse.json({ chart, analysis });
}
