import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isVip } from '@/lib/subscription';
import { getTodayBeijing } from '@/lib/timezone';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';
import { applyChaos } from '@/lib/chaos-middleware';

type TarotSpread = 'single' | 'three' | 'celtic' | 'moonlight' | 'mirror' | 'relationship';

const spreadConfig: Record<TarotSpread, { count: number; positions?: string[] }> = {
  single: { count: 1 },
  three: { count: 3, positions: ['过去', '现在', '未来'] },
  celtic: {
    count: 10,
    positions: [
      '①现状',
      '②挑战',
      '③意识',
      '④根源',
      '⑤希望/恐惧',
      '⑥近期发展',
      '⑦可能结果',
      '⑧外部环境',
      '⑨心态信念',
      '⑩最终结局',
    ],
  },
  moonlight: {
    count: 3,
    positions: ['身心灵', '潜意识', '指引'],
  },
  mirror: {
    count: 5,
    positions: ['现状', '阻碍', '建议', '风险', 'Outcome'],
  },
  relationship: {
    count: 5,
    positions: ['你的感受', '对方感受', '关系基础', '当前障碍', '关系走向'],
  },
};

const DAILY_LIMITS: Record<TarotSpread, number> = {
  single: 1,
  three: 1,
  celtic: 0,
  moonlight: 1,
  mirror: 1,
  relationship: 1,
};

async function atomicCheckAndUseQuota(userId: string, spread: TarotSpread): Promise<boolean> {
  const today = getTodayBeijing();
  const limit = DAILY_LIMITS[spread];

  await prisma.usageQuota.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });

  const result = spread === 'single'
    ? await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotSingleCount: { lt: limit } },
        data: { tarotSingleCount: { increment: 1 } },
      })
    : await prisma.usageQuota.updateMany({
        where: { userId, date: today, tarotThreeCount: { lt: limit } },
        data: { tarotThreeCount: { increment: 1 } },
      });

  return result.count > 0;
}

function resolveSpread(value: unknown): TarotSpread {
  if (value === 'single' || value === 'three' || value === 'celtic' || value === 'moonlight' || value === 'mirror' || value === 'relationship') {
    return value;
  }
  return 'three';
}

function quotaLabel(spread: TarotSpread): string {
  if (spread === 'single') return '单张牌';
  if (spread === 'moonlight') return '月光模式';
  if (spread === 'mirror') return '镜像模式';
  if (spread === 'celtic') return '凯尔特十字';
  if (spread === 'relationship') return '关系牌阵';
  return '三张牌';
}

export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const spread = resolveSpread(body?.spread);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!isDebugMode) {
    if (session?.user?.id) {
      const rl = await checkRateLimit('ai_tarot', session.user.id, 10, 60);
      if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    } else {
      const rl = await checkRateLimit('ai_tarot_guest', ip, 1, 86400);
      if (!rl.allowed) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }
  }

  if (!isDebugMode && spread === 'celtic') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    const vip = await isVip(session.user.id);
    if (!vip) {
      return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
    }
  }

  if (session?.user?.id && spread !== 'celtic') {
    const vip = await isVip(session.user.id);
    if (!vip) {
      const allowed = await atomicCheckAndUseQuota(session.user.id, spread);
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message: `今日${quotaLabel(spread)}次数已用完`,
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }
  }

  const config = spreadConfig[spread];
  const cards = drawRandomCards(config.count);

  if (cards.length !== config.count) {
    return NextResponse.json({ error: '抽牌失败，请重试' }, { status: 500 });
  }

  const cardsWithImages = cards.map((card, idx) => ({
    ...card,
    image_url: getCardImageUrl(card),
    position: config.positions?.[idx],
  }));

  return NextResponse.json({ spread, cards: cardsWithImages });
}
