'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanSwitcher } from './PlanSwitcher';
import { InvoiceHistory } from './InvoiceHistory';
import { CancelSection } from './CancelSection';
import { PaymentMethodSection } from './PaymentMethodSection';

interface SubscriptionManagePanelProps {
  subscription: {
    plan: string;
    plan_name: string;
    price: number;
    current_period_end: string;
    cancel_at_period_end: boolean;
    pending_plan: string | null;
  };
  paymentMethod: {
    type: string;
    last4: string;
  } | null;
  onBack: () => void;
}

export function SubscriptionManagePanel({ subscription, paymentMethod, onBack }: SubscriptionManagePanelProps) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<string | null>(null);

  const handlePlanChange = async (newPlan: string, isUpgrade: boolean) => {
    setTargetPlan(newPlan);
    
    if (isUpgrade) {
      setShowUpgradeModal(true);
    } else {
      setShowDowngradeModal(true);
    }
  };

  const confirmUpgrade = async () => {
    if (!targetPlan) return;

    try {
      const res = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_plan: targetPlan, action: 'upgrade' })
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/pricing?plan=${targetPlan}&upgrade=true&amount=${data.prorated_amount}`);
      } else {
        alert(data.error || '升级失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setShowUpgradeModal(false);
    }
  };

  const confirmDowngrade = async () => {
    if (!targetPlan) return;

    try {
      const res = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_plan: targetPlan, action: 'downgrade' })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`新套餐将于 ${data.effective_date} 生效`);
        router.refresh();
      } else {
        alert(data.error || '降级失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setShowDowngradeModal(false);
    }
  };

  const expireDate = new Date(subscription.current_period_end).toLocaleDateString('zh-CN');

  return (
    <div className="bg-white border border-[#E5E2DD] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-sm text-[#1C1A16]/60 hover:text-[#1C1A16] transition-colors"
        >
          ← 返回
        </button>
        <h2 className="text-lg font-semibold text-[#1C1A16]">管理订阅</h2>
        <div className="w-12"></div>
      </div>

      {/* 当前计划概览 */}
      <div className="mb-6 p-4 bg-[#FAF9F6] rounded-lg">
        <h3 className="text-sm font-semibold text-[#1C1A16] mb-2">📋 当前计划</h3>
        <p className="text-[#1C1A16] mb-1">
          {subscription.plan_name} <span className="text-emerald-600 text-sm font-medium">✅ 当前计划</span>
        </p>
        <p className="text-[#1C1A16]/70 text-sm">¥{subscription.price}</p>
        <p className="text-[#1C1A16]/60 text-sm mt-2">到期日期：{expireDate}</p>
        {subscription.cancel_at_period_end && (
          <p className="text-orange-600 text-sm mt-1">⚠️ 将于到期后取消</p>
        )}
        {subscription.pending_plan && (
          <p className="text-blue-600 text-sm mt-1">
            ⏳ 将于到期后切换为 {subscription.pending_plan === 'monthly' ? '基础版' : subscription.pending_plan === 'quarterly' ? '专业版' : '尊享版'}
          </p>
        )}
      </div>

      {/* 变更套餐 */}
      <div className="mb-6">
        <PlanSwitcher
          currentPlan={subscription.plan}
          onPlanChange={handlePlanChange}
        />
      </div>

      {/* 支付方式 */}
      <PaymentMethodSection
        currentMethod={paymentMethod}
        onMethodUpdated={() => router.refresh()}
      />

      {/* 账单历史 */}
      <div className="border-t border-[#E5E2DD] pt-6 mt-6">
        <InvoiceHistory />
      </div>

      {/* 取消续订 */}
      {!subscription.cancel_at_period_end && (
        <CancelSection
          expireDate={expireDate}
          onCancelled={() => router.refresh()}
        />
      )}

      {/* 升级确认弹窗 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#1C1A16] mb-4">确认升级</h3>
            <p className="text-sm text-[#1C1A16]/70 mb-4">
              从 <span className="font-semibold">{subscription.plan_name}</span> 升级到{' '}
              <span className="font-semibold">
                {targetPlan === 'yearly' ? '尊享版（年卡）' : targetPlan === 'quarterly' ? '专业版（季卡）' : '基础版（月卡）'}
              </span>
            </p>
            <p className="text-sm text-[#1C1A16]/50 mb-6">
              升级后将立即生效，需补差价（按剩余天数比例计算）
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#E5E2DD] rounded text-[#1C1A16] hover:bg-[#1C1A16]/[0.03] transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 px-4 py-2.5 bg-[#1C1A16] text-white rounded hover:bg-[#2A2621] transition-colors"
              >
                确认升级
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 降级确认弹窗 */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#1C1A16] mb-4">确认切换套餐</h3>
            <p className="text-sm text-[#1C1A16]/70 mb-4">
              从 <span className="font-semibold">{subscription.plan_name}</span> 切换到{' '}
              <span className="font-semibold">
                {targetPlan === 'monthly' ? '基础版（月卡）' : targetPlan === 'quarterly' ? '专业版（季卡）' : '尊享版（年卡）'}
              </span>
            </p>
            <p className="text-sm text-[#1C1A16]/70 mb-2">
              当前周期剩余时间仍享受 {subscription.plan_name} 权益
            </p>
            <p className="text-sm font-semibold text-[#1C1A16] mb-6">
              新套餐将于 {expireDate} 生效
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#E5E2DD] rounded text-[#1C1A16] hover:bg-[#1C1A16]/[0.03] transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDowngrade}
                className="flex-1 px-4 py-2.5 bg-[#1C1A16] text-white rounded hover:bg-[#2A2621] transition-colors"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
