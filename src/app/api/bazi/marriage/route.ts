import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';

import { authOptions } from '@/lib/auth';
import { calculateBazi as realCalculateBazi } from '@/lib/bazi';

// 计算八字并格式化为简洁字符串
function calculateBazi(birthDate: string, birthHour: string) {
  // 映射时辰
  const hourMap: Record<string, any> = {
    '子时': '子时', '丑时': '丑时', '寅时': '寅时', '卯时': '卯时',
    '辰时': '辰时', '巳时': '巳时', '午时': '午时', '未时': '未时',
    '申时': '申时', '酉时': '酉时', '戌时': '戌时', '亥时': '亥时',
    '不知道': '午时', // 默认午时
  };

  const shichen = hourMap[birthHour] || '午时';

  const result = realCalculateBazi({
    name: '',
    gender: 'male',
    birthDate,
    birthHour: shichen,
  });

  const { year, month, day, hour } = result.chart;
  const hourStr = hour ? `${hour.gan}${hour.zhi}` : '未知';
  return `${year.gan}${year.zhi}年 ${month.gan}${month.zhi}月 ${day.gan}${day.zhi}日 ${hourStr}时`;
}

// 计算匹配度
// ⚠️ TODO: 当前为简化版随机评分（70-100分），待实现基于五行互补/生肖相合/日干关系的真实算法
function calculateScore(_maleBazi: string, _femaleBazi: string) {
  const score = Math.floor(Math.random() * 30) + 70; // 70-100分（简化版）
  
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

  // 缓存 key
  const cacheKey = generateCacheKey('marriage', { 
    male: maleBazi, 
    female: femaleBazi 
  });
  
  // 检查缓存
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json({
      score,
      hearts,
      level,
      maleBazi,
      femaleBazi,
      analysis: cached.analysis,
      disclaimer: '⚠️ 仅供参考，匹配度评分基于简化算法，不代表真实命运。人生幸福取决于彼此的理解与经营。',
      _source: 'cache',
    });
  }

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
      await setCache(cacheKey, { analysis });
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
    disclaimer: '⚠️ 仅供参考，匹配度评分基于简化算法，不代表真实命运。人生幸福取决于彼此的理解与经营。',
    _source: aiSource,
  });
}
