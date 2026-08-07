'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { track } from '@/lib/analytics';

// 轮询退避序列（ms，累计约 20s）：webhook 通常几秒内落库，前密后疏
const POLL_DELAYS = [1000, 1000, 2000, 2000, 3000, 3000, 4000, 4000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ConfirmState = 'confirming' | 'confirmed' | 'pending';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [countdown, setCountdown] = useState(5);

  // updateSession 引用会随 session 变化而变化，走 ref 避免触发轮询 effect 重跑。
  // 赋值放在 effect 里（render 期间写 ref 违反 React 并发渲染约定）
  const updateSessionRef = useRef(updateSession);
  useEffect(() => {
    updateSessionRef.current = updateSession;
  }, [updateSession]);

  // URL 标识（原始字符串，可安全作 effect 依赖）：
  // payment/create 流程带 order_id + session_id；stripe/create-checkout 直购只带 session_id
  const orderId = searchParams.get('order_id');
  const stripeSessionId = searchParams.get('session_id');
  const planParam = searchParams.get('plan');

  const statusQuery = orderId
    ? `orderId=${encodeURIComponent(orderId)}`
    : stripeSessionId
      ? `sessionId=${encodeURIComponent(stripeSessionId)}`
      : null;

  // 无任何订单标识（如直接访问本页）：无从确认，初始态直接落「处理中」，不误报成功。
  // 由 useState 初始值给出而非 effect 内 setState，省一次级联渲染
  const [state, setState] = useState<ConfirmState>(statusQuery ? 'confirming' : 'pending');

  // 埋点：到达本页 = Stripe 侧已收款（success_url 只有付成功才会跳），语义与
  // 改造前一致，必须「进页面即发」。若挪到轮询确认 paid 之后才发，webhook 慢的
  // 用户一律漏计，支付成功率会系统性偏低；到账确认另发 payment_confirmed，
  // 两个事件的差值正好能量出 webhook 延迟的规模。ref 去重挡住 StrictMode 双跑。
  const arrivalTrackedRef = useRef(false);
  useEffect(() => {
    if (arrivalTrackedRef.current) return;
    arrivalTrackedRef.current = true;
    track('payment_success', { plan: planParam || 'unknown', price: 0, status: 'arrived' });
  }, [planParam]);

  // 历史上这里曾把 cyberfate.vercel.app 别名域硬跳回生产主域（checkout 回跳域
  // 规范化：登录 cookie 只在主域上）。现 success_url 由 NEXTAUTH_URL 生成，回跳
  // 落在部署自身域；router.push 相对路径天然同源（等价 window.location.origin），
  // 硬编码生产域反而会把预览/本地环境甩到生产站，故移除该跳转。

  // 「先确认后放行」：Stripe 重定向回来的瞬间 webhook 大概率还未落库，此时刷
  // JWT 会把 isSubscribed=false 缓存 5 分钟（jwt 回调的 DB TTL），刚付费的用户
  // 会被当免费用户拦截。所以先轮询订单状态，确认 paid（即 webhook 已落库）后
  // 才 updateSession() 放行跳转。
  useEffect(() => {
    if (!statusQuery) return;

    let cancelled = false;

    (async () => {
      for (const delay of POLL_DELAYS) {
        await sleep(delay);
        if (cancelled) return;
        try {
          const res = await fetch(`/api/payment/status?${statusQuery}`);
          if (res.ok) {
            const data: { status?: string } = await res.json();
            if (data.status === 'paid') {
              // webhook 已落库，此刻刷 JWT 才能拿到 isSubscribed=true
              await updateSessionRef.current();
              if (cancelled) return;
              track('payment_confirmed', { plan: planParam || 'unknown', price: 0 });
              setState('confirmed');
              return;
            }
          }
        } catch {
          // 网络抖动：忽略，进入下一轮退避
        }
      }
      if (!cancelled) setState('pending');
    })();

    return () => {
      cancelled = true;
    };
  }, [statusQuery, planParam]);

  // 确认到账后才开始倒计时跳转
  useEffect(() => {
    if (state !== 'confirmed') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/bazi');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, router]);

  if (state === 'confirming') {
    return (
      <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div
            aria-hidden
            className="mx-auto mb-6 h-9 w-9 rounded-full border-2 border-brand-ink/15 border-t-brand-ink animate-spin"
          />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink tracking-[0.08em] mb-4">
            正在确认支付结果
          </h1>
          <p className="text-sm text-brand-gray leading-relaxed">
            支付已提交，正在等待到账确认（通常几秒内完成）
          </p>
          {/* 开通完全由 Stripe webhook 服务端驱动，本页轮询只为到账后刷新登录态，
              关页面不影响开通——别写「请不要关闭本页面」制造焦虑 */}
          <p className="text-sm text-brand-gray leading-relaxed mt-1">
            会员开通在服务端完成，关闭页面也不会影响
          </p>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-6" aria-hidden>
            🕐
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink tracking-[0.08em] mb-4">
            到账处理中
          </h1>
          <p className="text-sm text-brand-gray leading-relaxed mb-2">
            支付已提交，VIP 将在几分钟内自动生效
          </p>
          {/* 登录态里的 isSubscribed 烤在 JWT 中，普通刷新不会重新查库
              （jwt 回调仅在 trigger==='update' 或 5 分钟 DB TTL 到期时才查），
              所以文案不能写「刷新页面即可」；此处轮询已超时，也不宜再 updateSession
              ——那只会把 isSubscribed=false 重新缓存 5 分钟，反而更慢生效 */}
          <p className="text-sm text-brand-gray leading-relaxed mb-8">
            会员状态最多几分钟后自动同步，想立刻生效可退出后重新登录；如长时间未生效，请联系{' '}
            <a href="mailto:support@cyberfate.me" className="text-brand-ink underline underline-offset-2">
              support@cyberfate.me
            </a>
          </p>
          <button
            onClick={() => router.push('/bazi')}
            className="w-full min-h-[44px] px-6 py-3 bg-white border border-brand-ink/25 text-brand-ink font-semibold tracking-[0.08em] rounded-lg hover:border-brand-ink hover:bg-[#FDFBF7] transition-colors"
          >
            先去逛逛 · 八字分析
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="font-display text-3xl font-bold text-brand-ink tracking-[0.08em] mb-4">支付成功！</h1>
        <p className="text-sm text-brand-gray leading-relaxed mb-2">感谢你开通赛博命理师会员</p>
        <p className="text-sm text-brand-gray leading-relaxed mb-8">你的专属 AI 命理体验已解锁</p>
        <button
          onClick={() => router.push('/bazi')}
          className="w-full min-h-[44px] px-6 py-3 bg-brand-accent text-white font-semibold tracking-[0.08em] rounded-lg hover:bg-brand-accent-hover transition-colors"
        >
          开始八字分析（{countdown}s）
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={<div className="min-h-dvh bg-brand-bg flex items-center justify-center text-brand-gray">加载中...</div>}
    >
      <SuccessContent />
    </Suspense>
  );
}
