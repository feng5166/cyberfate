import { NextRequest, NextResponse } from 'next/server';
import { resolveSpread, shareSpreadName } from '@/lib/tarot';

export async function POST(req: NextRequest) {
  const { cards, question, spread } = (await req.json()) as {
    cards?: Array<{ name_zh?: string; orientation?: 'upright' | 'reversed' }>;
    question?: string;
    spread?: string;
  };

  // 生成分享文本（牌阵名走统一映射，含 relationship，不再漂移）
  const shareText = `🔮 塔罗占卜结果

${question ? `问题：${question}\n` : ''}牌阵：${shareSpreadName(resolveSpread(spread))}

抽到的牌：
${(cards || []).map((c) => `${c.name_zh || '未知牌'}（${c.orientation === 'upright' ? '正位' : '逆位'}）`).join('\n')}

来自赛博命理师 - https://cyberfate.me/tarot`;

  return NextResponse.json({ shareText });
}
