import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/cache/redis';

// 天干地支
const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function getLunar(date: string) {
  // 简化版：实际应该用农历转换库
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `农历${month}月${day}日`;
}

function getGanzhi(date: string) {
  // 简化版：实际应该用专业算法
  const d = new Date(date);
  const yearIdx = (d.getFullYear() - 1984) % 10;
  const monthIdx = d.getMonth() % 10;
  const dayIdx = d.getDate() % 10;
  
  return `${tianGan[yearIdx]}${diZhi[yearIdx % 12]}年 ${tianGan[monthIdx]}${diZhi[monthIdx % 12]}月 ${tianGan[dayIdx]}${diZhi[dayIdx % 12]}日`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const session = await getServerSession(authOptions);
  
  const solar = date;
  const lunar = getLunar(date);
  const ganzhi = getGanzhi(date);
  
  // 缓存 key（基于日期）
  const cacheKey = `huangli:${date}`;
  
  // 检查缓存
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return NextResponse.json({
        solar,
        lunar,
        ganzhi,
        ...(cached as any),
        _source: 'cache',
      });
    }
  } catch (err) {
    console.warn('[Cache Read Error]', err);
  }
  
  // 缓存未命中，调用 AI 生成宜忌和建议
  let yi: string[] = [];
  let ji: string[] = [];
  let advice = '';
  let aiSource = 'fallback';
  
  try {
    const prompt = `你是"赛博命理师"的 AI 黄历功能。

今日信息：
- 公历：${solar}
- 农历：${lunar}
- 干支：${ganzhi}

【输出规则】
严格按照 JSON 格式输出，不要有任何其他内容。

【输出结构】
{
  "yi": ["宜事项1", "宜事项2", "宜事项3", "宜事项4", "宜事项5"],
  "ji": ["忌事项1", "忌事项2", "忌事项3", "忌事项4", "忌事项5"],
  "advice": "今日建议（50字以内，简练积极）"
}

宜忌事项范围：祭祀、祈福、出行、签约、开业、搬家、结婚、动土、装修、交易、诉讼、开仓、远行、安葬、破土、拆卸、栽种、针灸、伐木、狩猎、修造、纳财、嫁娶、立券、求医、赴任、移徙、上梁、竖柱、会友、求财、入学、冠笄、入宅、开市、安床、安门、裁衣、合帐、造车、教牛马、纳畜、牧养、捕捉、畋猎。

根据干支五行关系，选择今日适宜和忌讳的事项各 5 条。`;

    const apiResponse = await fetch('https://api.modelverse.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      const text = apiData.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        yi = result.yi || [];
        ji = result.ji || [];
        advice = result.advice || '';
        aiSource = 'deepseek';
      }
    }
  } catch (err) {
    console.error('AI call failed:', err);
  }
  
  // 降级逻辑（AI 失败时）
  if (yi.length === 0 || ji.length === 0) {
    yi = ['祭祀', '祈福', '出行', '签约', '开业'];
    ji = ['诉讼', '开仓', '远行', '安葬', '破土'];
    advice = '今日运势平稳，宜静不宜动，保持平常心。';
    aiSource = 'fallback';
  }
  
  // 写入缓存（24小时过期，第二天自动刷新）
  const result = { yi, ji, advice };
  try {
    await redis.setex(cacheKey, 86400, result); // 24 小时
    console.log(`[Cache Set] ${cacheKey} (TTL: 24h)`);
  } catch (err) {
    console.warn('[Cache Write Error]', err);
  }
  
  // VIP 个性化建议（保留原逻辑）
  let personalAdvice = null;
  if (session?.user?.id) {
    personalAdvice = `根据您的八字，今日特别适合${yi[0]}和${yi[1]}，需要注意避免${ji[0]}。`;
  }
  
  return NextResponse.json({
    solar,
    lunar,
    ganzhi,
    yi,
    ji,
    advice,
    personalAdvice,
    _source: aiSource,
  });
}
