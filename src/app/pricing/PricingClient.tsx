'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PricingCardList } from '@/components/pricing/PricingCardList';
import { AuthModal } from '@/components/auth/AuthModal';
import { type PlanId, isValidPlanId, PLAN_NAME_TO_ID, getDefaultPlanId, PRICING_CONFIG } from '@/lib/pricing-config';

const defaultPlanId = getDefaultPlanId();
const defaultPlanConfig = PRICING_CONFIG[defaultPlanId];
const dailyConfig = PRICING_CONFIG['daily'];
const yearlyConfig = PRICING_CONFIG['yearly'];
const lifetimeConfig = PRICING_CONFIG['lifetime'];

const faqs = [
  { q: '免费版和会员版有什么区别？', a: '免费版每天可进行 3 次基础八字分析。会员版解锁无限次分析、AI 深度报告、紫微斗数、塔罗占卜等全部高级功能，同时享受优先客服支持。' },
  { q: `${dailyConfig.name}（按天）和年费/终身有什么区别？`, a: `${dailyConfig.name} $${dailyConfig.displayPrice}/天，适合想先体验全部功能的用户。${yearlyConfig.name} $${yearlyConfig.displayPrice}/年 性价比最高，适合长期使用者。${lifetimeConfig.name} $${lifetimeConfig.displayPrice} 终身一次性付费，永久解锁所有功能包括未来更新。` },
  { q: '支付方式有哪些？', a: '目前支持 Stripe 信用卡/借记卡支付。所有交易均经过加密处理，确保您的支付安全。' },
  { q: '终身版真的永久有效吗？', a: `是的！${lifetimeConfig.name}为一次性终身付费，无需续费，永久享受所有功能及未来新功能。` },
  { q: '可以升级套餐吗？', a: `可以！如果您购买了${dailyConfig.name}或${yearlyConfig.name}，后续可以补差价升级到更高版本。请联系客服或在个人中心操作。` },
  { q: '分析结果准确吗？', a: '我们的 AI 命理分析基于传统命理学体系结合现代 AI 技术，提供参考性解读。命理分析仅供娱乐和参考，不构成任何决策依据，请理性对待。' },
];

interface PricingClientProps {
  currentPlan?: string;
}

export default function PricingClient({ currentPlan }: PricingClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ planName: string; price: string } | null>(null);

  const isSubscribed = session?.user?.isSubscribed ?? false;
  const [selectedPlan, setSelectedPlan] = useState(isSubscribed ? '' : defaultPlanId);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const redirectToCheckout = useCallback(async (planName: string) => {
    const planId = PLAN_NAME_TO_ID[planName] || planName as PlanId;
    if (!isValidPlanId(planId)) return;

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Checkout error response:', data);
        const errorMsg = data.details || data.error || '创建支付会话失败，请稍后重试';
        alert(errorMsg);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Checkout network error:', error);
      const msg = error instanceof Error ? error.message : '网络错误';
      alert(`请求失败: ${msg}`);
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const handleCTAClick = (planName: string, price: string) => {
    if (!session) {
      setPendingPlan({ planName, price });
      setAuthOpen(true);
      return;
    }
    if (isSubscribed) {
      router.push('/profile?manage=true');
      return;
    }
    redirectToCheckout(planName);
  };

  useEffect(() => {
    if (session && pendingPlan) {
      if (isSubscribed) {
        router.push('/profile?manage=true');
      } else {
        redirectToCheckout(pendingPlan.planName);
      }
      setPendingPlan(null);
    }
  }, [session, pendingPlan, isSubscribed, router, redirectToCheckout]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      <section className="px-4 pt-20 md:pt-28 pb-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display text-[32px] md:text-[40px] font-semibold text-[#1C1A16] tracking-[0.08em]">
            选择您的计划
          </h1>
          <p className="text-[15px] text-[#1C1A16]/55 mt-3">
            一次付费，无需续费
          </p>
          {isSubscribed && (
            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-5 py-2.5 rounded-full border border-emerald-200">
              <span>您已是会员 ✨ 感谢支持</span>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-20 md:pb-28">
        <div className="max-w-[1000px] mx-auto">
          <PricingCardList
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onCTAClick={handleCTAClick}
            isSubscribed={isSubscribed}
            currentPlan={currentPlan}
          />
        </div>
      </section>

      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-[28px] font-semibold text-[#1C1A16] text-center mb-10">常见问题</h2>
          <div className="max-w-[720px] mx-auto divide-y divide-[#1C1A16]/8">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-[15px] font-medium text-[#1C1A16] pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-[#1C1A16]/40 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1C1A16]/40 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="text-sm text-[#1C1A16]/55 leading-relaxed mt-3 pt-1 animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
