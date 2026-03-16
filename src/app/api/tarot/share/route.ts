import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { cards, question, spread } = await req.json();

  // 生成分享文本
  const shareText = `🔮 塔罗占卜结果

${question ? `问题：${question}\n` : ''}
牌阵：${spread === 'single' ? '单张牌' : spread === 'three' ? '三张牌' : '凯尔特十字'}

抽到的牌：
${cards.map((c: any) => `${c.name_zh}（${c.orientation === 'upright' ? '正位' : '逆位'}）`).join('\n')}

来自赛博命理师 - https://cyberfate.me/tarot`;

  return NextResponse.json({ shareText });
}
