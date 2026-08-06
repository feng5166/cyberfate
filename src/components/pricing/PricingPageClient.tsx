'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PricingClient from '@/app/pricing/PricingClient';

/**
 * 性能：定价页是纯营销页，原先在 page.tsx 里 getServerSession + DB 查
 * currentPlan，把整页拖成动态渲染。会话依赖下沉到本客户端组件后页面恢复
 * 静态渲染（首屏走 CDN 缓存），「当前套餐」角标改为按需客户端拉取。
 */
export default function PricingPageClient() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState<string | undefined>(undefined);

  const isSubscribed = session?.user?.isSubscribed ?? false;

  useEffect(() => {
    // 只有会员需要「当前套餐」角标；免费/未登录用户不多打这次 API
    if (!isSubscribed) return;
    let cancelled = false;
    fetch('/api/subscription/current')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { subscribed?: boolean; plan?: string | null } | null) => {
        if (!cancelled && data?.subscribed && data.plan) {
          setCurrentPlan(data.plan);
        }
      })
      .catch(() => {
        // 拉取失败只是少了角标展示，不影响选购主流程
      });
    return () => {
      cancelled = true;
    };
  }, [isSubscribed]);

  return <PricingClient currentPlan={currentPlan} />;
}
