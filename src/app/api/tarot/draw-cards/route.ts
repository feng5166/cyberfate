import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isVip } from '@/lib/subscription';
import { drawRandomCards, getCardImageUrl } from '@/data/tarot';
import { applyChaos } from '@/lib/chaos-middleware';
import { SPREAD_CONFIG, resolveSpread, quotaLabel, peekTarotQuota } from '@/lib/tarot';
import { getClientIp } from '@/lib/ip';
import { isDebugRequest } from '@/lib/ai/debug';

// 只负责抽牌（便宜、可反复重抽）。配额/限流的「真源」在 /api/tarot/draw（AI 生成处），
// 这里仅做：轻量防刷 + 登录用户的只读配额预检（提前拦 UX），不扣任何额度。
export async function POST(req: NextRequest) {
  const chaosRes = await applyChaos(req);
  if (chaosRes) return chaosRes;

  const isDebugMode = isDebugRequest(req);

  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const spread = resolveSpread(body?.spread);

  const ip = getClientIp(req);

  // 轻量防刷：独立 key，不消耗 AI 解读 / 游客每日额度（那些在 /draw 里扣）
  //
  // failOpen: true —— 为什么这个端点零成本、Redis 挂了也该放行：
  // 1. 本端点只做本地洗牌（drawRandomCards → fisherYatesShuffle，src/data/tarot.ts 纯函数）
  //    + 只读 DB（isVip / peekTarotQuota 都是 findFirst/findUnique），不写库、不碰 AI。
  // 2. 计费真源是 /api/tarot/draw：ai_tarot、ai_tarot_guest（游客 1 次/天）与 chargeTarotQuota
  //    都在那边，且一律保持 fail-closed。本端点放行再多次也生成不出一个字的解读。
  // 3. 被刷的最坏后果是 78 张牌的洗牌 CPU + 两次只读查询；而 fail-closed 会让抽牌动画
  //    在 Redis 抖动时直接 429，用户连牌面都看不到。
  let rlDegraded = false;
  if (!isDebugMode) {
    const id = session?.user?.id || ip;
    const rl = await checkRateLimit('tarot_cards', id, 30, 60, { failOpen: true });
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' }, { status: 429 });
    // 降级放行时跳过下面的只读预检：那两次 Postgres 查询是纯 UX 前置提示，
    // 真正的扣费闸门在 /api/tarot/draw（chargeTarotQuota 原子扣减，且仍 fail-closed）。
    // Redis 挂掉期间限流强度已降为每实例内存计数，不该再让每次抽牌顺带压 DB。
    rlDegraded = rl.degraded === true;
  }

  // 凯尔特十字：VIP 专属（抽牌阶段就拦，避免非会员抽了牌又被 /draw 拒）
  if (!isDebugMode && spread === 'celtic') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'LOGIN_REQUIRED' }, { status: 401 });
    }
    const vip = await isVip(session.user.id);
    if (!vip) {
      return NextResponse.json({ error: 'VIP_REQUIRED' }, { status: 403 });
    }
  }

  // 登录非 VIP：只读预检，额度已满就提前拦（不扣减，真正扣减在 /draw）
  if (!isDebugMode && !rlDegraded && session?.user?.id && spread !== 'celtic') {
    const vip = await isVip(session.user.id);
    if (!vip) {
      const hasQuota = await peekTarotQuota(session.user.id, spread);
      if (!hasQuota) {
        return NextResponse.json(
          { error: 'QUOTA_EXCEEDED', message: `今日${quotaLabel(spread)}次数已用完`, remaining: 0 },
          { status: 429 }
        );
      }
    }
  }

  const config = SPREAD_CONFIG[spread];
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
