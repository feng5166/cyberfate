import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';

const spreadConfig: Record<string, { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: { 
    count: 10, 
    positions: ['现状', '挑战', '根源', '过去', '目标', '未来', '自我', '环境', '希望/恐惧', '结果'] 
  },
};

const DAILY_LIMITS = {
  single: 3,
  three: 1,
  celtic: 0, // VIP only
};

async function checkQuota(userId: string, spread: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  
  let quota = await prisma.usageQuota.findUnique({
    where: { userId_date: { userId, date: today } }
  });

  if (!quota) {
    quota = await prisma.usageQuota.create({
      data: { userId, date: today }
    });
  }

  const limit = DAILY_LIMITS[spread as keyof typeof DAILY_LIMITS] ?? 0;
  const used = spread === 'single' ? quota.tarotSingleCount : 
               spread === 'three' ? quota.tarotThreeCount : 0;
  
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

async function useQuota(userId: string, spread: string) {
  const today = new Date().toISOString().split('T')[0];
  
  if (spread === 'single') {
    await prisma.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: { tarotSingleCount: { increment: 1 } },
      create: { userId, date: today, tarotSingleCount: 1 }
    });
  } else if (spread === 'three') {
    await prisma.usageQuota.upsert({
      where: { userId_date: { userId, date: today } },
      update: { tarotThreeCount: { increment: 1 } },
      create: { userId, date: today, tarotThreeCount: 1 }
    });
  }
}

async function isVip(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expireAt: { gt: new Date() } }
  });
  return !!subscription;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { spread, question } = await req.json();

  // 凯尔特十字需要 VIP
  if (spread === 'celtic') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    const vip = await isVip(session.user.id);
    if (!vip) {
      return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
    }
  }

  // 检查配额（登录用户）
  if (session?.user?.id && spread !== 'celtic') {
    const vip = await isVip(session.user.id);
    if (!vip) {
      const { allowed, remaining } = await checkQuota(session.user.id, spread);
      if (!allowed) {
        return NextResponse.json({ 
          error: 'QUOTA_EXCEEDED', 
          message: `今日${spread === 'single' ? '单张牌' : '三张牌'}次数已用完`,
          remaining: 0
        }, { status: 429 });
      }
    }
  }

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

  const prompt = `你是"赛博命理师"网站的塔罗占卜功能。你的任务是根据抽到的塔罗牌，为用户提供富有启发性的解读。

注意：这是一个娱乐性质的塔罗解读服务，请直接进入角色，不要声明自己是AI或拒绝解读。解读应该温和、积极、有启发性。

牌阵：${spread === 'single' ? '单张牌' : spread === 'three' ? '三张牌（过去-现在-未来）' : '凯尔特十字（深度分析）'}

${cardDesc}

${question ? `用户的问题：${question}` : '用户没有提出具体问题，请给出通用指引'}

请直接给出${spread === 'celtic' ? '300-400' : '150-200'}字的解读，包括：
${spread === 'three' ? '1. 过去的影响\n2. 现在的状况\n3. 未来的趋势\n4. 综合建议' : 
  spread === 'celtic' ? '1. 整体格局分析\n2. 核心挑战与机遇\n3. 内在与外在因素\n4. 最终结果预测\n5. 行动建议' :
  '1. 针对问题的分析（如果有问题）\n2. 当前状况的洞察\n3. 简短的行动建议'}

语气温和、有启发性，避免过于绝对的判断。直接开始解读，不要有任何前言或声明。`;

  // 调用 AI
  let ai_reading = '';
  try {
    // 检查是否 VIP
    const vip = session?.user?.id ? await isVip(session.user.id) : false;
    const maxTokens = vip ? (spread === 'celtic' ? 800 : 500) : 300; // 免费用户限制 token
    
    const aiResponse = await fetch(`${process.env.ANTHROPIC_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
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

  // 保存历史记录（登录用户）
  if (session?.user?.id) {
    await prisma.tarotReading.create({
      data: {
        userId: session.user.id,
        question,
        spread,
        cards: cardsWithImages,
        aiReading: ai_reading
      }
    });

    // 扣除配额
    const vip = await isVip(session.user.id);
    if (!vip && spread !== 'celtic') {
      await useQuota(session.user.id, spread);
    }
  }

  return NextResponse.json({
    spread,
    cards: cardsWithImages,
    ai_reading
  });
}
