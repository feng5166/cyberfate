'use client';

import { useRouter } from 'next/navigation';

interface SubscriptionCardProps {
  subscription: {
    plan: string;
    plan_name: string;
    price: number;
    current_period_end: string;
  } | null;
  isSubscribed: boolean;
  quotaUsed: number;
  quotaLimit: number | null;
  onManage?: () => void;
}

export function SubscriptionCard({ subscription, isSubscribed, quotaUsed, quotaLimit, onManage }: SubscriptionCardProps) {
  const router = useRouter();

  if (!isSubscribed || !subscription) {
    // 免费用户
    return (
      <div className="bg-white border border-[#E5E2DD] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1C1A16]">📋 订阅计划</h2>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-[#1C1A16]">当前计划：<span className="font-medium">免费版</span></p>
          <p className="text-[#1C1A16]/70 text-sm">
            今日剩余次数：<span className="font-bold text-[#1C1A16]">{Math.max(0, (quotaLimit || 3) - quotaUsed)} / {quotaLimit || 3} 次</span>
          </p>
        </div>

        <button
          onClick={() => router.push('/pricing')}
          className="w-full bg-[#1C1A16] text-white py-3 rounded-lg font-medium hover:bg-[#2A2621] transition-colors"
        >
          🔓 升级到 Pro 会员
        </button>
        <p className="text-center text-xs text-[#1C1A16]/50 mt-2">
          解锁无限分析 + 全部高级功能
        </p>
      </div>
    );
  }

  // 已订阅用户
  const expireDate = new Date(subscription.current_period_end).toLocaleDateString('zh-CN');

  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1C1A16]">📋 订阅管理</h2>
        {onManage && (
          <button
            onClick={onManage}
            className="text-sm text-[#1C1A16]/60 hover:text-[#1C1A16] transition-colors"
          >
            查看详情 →
          </button>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-[#1C1A16]">
          当前计划：<span className="font-semibold">{subscription.plan_name}</span>
        </p>
        <p className="text-[#1C1A16]/70 text-sm">
          ¥{subscription.price}/{subscription.plan === 'monthly' ? '月' : subscription.plan === 'quarterly' ? '季' : '年'}
        </p>
        <p className="text-emerald-600 text-sm font-medium">
          ✅ 有效中
        </p>
        <p className="text-[#1C1A16]/60 text-sm">
          下次扣费日期：{expireDate}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/pricing')}
          className="flex-1 border border-[#1C1A16]/20 text-[#1C1A16] py-2.5 rounded-lg text-sm font-medium hover:border-[#1C1A16]/40 hover:bg-[#1C1A16]/[0.03] transition-colors"
        >
          📈 升级套餐
        </button>
        <button
          onClick={onManage || (() => router.push('/pricing?tab=manage'))}
          className="flex-1 border border-[#1C1A16]/20 text-[#1C1A16] py-2.5 rounded-lg text-sm font-medium hover:border-[#1C1A16]/40 hover:bg-[#1C1A16]/[0.03] transition-colors"
        >
          ⚙️ 管理订阅
        </button>
      </div>
    </div>
  );
}
