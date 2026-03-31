import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 计算八字
function calculateBazi(birthDate: string, birthHour: string) {
  // 简化版：这里应该用专业的八字计算库
  // 暂时返回模拟数据
  const year = birthDate.split('-')[0];
  return `${year}年 某月 某日 某时`; // 实际应该计算天干地支
}

// 计算匹配度
function calculateScore(maleBazi: string, femaleBazi: string) {
  // 简化版：实际应该根据五行、生肖等计算
  const score = Math.floor(Math.random() * 30) + 70; // 70-100分
  
  let hearts = '';
  let level = '';
  
  if (score >= 90) {
    hearts = '❤️❤️❤️❤️❤️';
    level = '天作之合';
  } else if (score >= 80) {
    hearts = '❤️❤️❤️❤️☆';
    level = '良缘佳配';
  } else if (score >= 70) {
    hearts = '❤️❤️❤️☆☆';
    level = '相处融洽';
  } else {
    hearts = '❤️❤️☆☆☆';
    level = '需要磨合';
  }
  
  return { score, hearts, level };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { maleName, maleBirthDate, maleBirthHour, femaleName, femaleBirthDate, femaleBirthHour } = await req.json();

  // 计算双方八字
  const maleBazi = calculateBazi(maleBirthDate, maleBirthHour);
  const femaleBazi = calculateBazi(femaleBirthDate, femaleBirthHour);

  // 计算匹配度
  const { score, hearts, level } = calculateScore(maleBazi, femaleBazi);

  // AI 分析
  const prompt = `你是"赛博命理师"的八字合婚分析功能。

男方信息：
- 姓名：${maleName || '男方'}
- 出生日期：${maleBirthDate}
- 八字：${maleBazi}

女方信息：
- 姓名：${femaleName || '女方'}
- 出生日期：${femaleBirthDate}
- 八字：${femaleBazi}

匹配度评分：${score}分（${level}）

请给出200-300字的合婚分析，包括：
1. 性格匹配分析
2. 感情运势分析
3. 相处建议

语气温和、积极、有建设性。直接开始分析，不要有前言。`;

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
      analysis = aiData.choices?.[0]?.message?.content || '分析生成失败';
      aiSource = 'deepseek';
    }
  } catch (err) {
    console.error('AI call failed:', err);
    analysis = '根据双方八字，你们的匹配度较好，建议多沟通、互相理解。';
    aiSource = 'fallback';
  }

  return NextResponse.json({
    score,
    hearts,
    level,
    maleBazi,
    femaleBazi,
    analysis,
    _source: aiSource,
  });
}
