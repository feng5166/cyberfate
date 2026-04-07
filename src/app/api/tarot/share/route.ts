import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { cards, question, spread } = (await req.json()) as {
    cards?: Array<{ name_zh?: string; orientation?: 'upright' | 'reversed' }>;
    question?: string;
    spread?: string;
  };
  const spreadNameMap: Record<string, string> = {
    single: '单张牌',
    three: '经典三张牌',
    celtic: '凯尔特十字',
    moonlight: '月光模式',
    mirror: '镜像模式',
  };

  // 生成分享文本
  const shareText = `🔮 塔罗占卜结果

${question ? `问题：${question}\n` : ''}
牌阵：${spreadNameMap[spread ?? ''] || '塔罗牌阵'}

抽到的牌：
${(cards || []).map((c) => `${c.name_zh || '未知牌'}（${c.orientation === 'upright' ? '正位' : '逆位'}）`).join('\n')}

来自赛博命理师 - https://cyberfate.me/tarot`;

  return NextResponse.json({ shareText });
}
