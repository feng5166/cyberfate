'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { PricingCardList } from '@/components/pricing/PricingCardList';
import { AuthModal } from '@/components/auth/AuthModal';

const faqs = [
  { q: '免费版和会员版有什么区别？', a: '免费版每天可进行 3 次基础八字分析。会员版解锁无限次分析、AI 深度报告、紫微斗数、塔罗占卜等全部高级功能，同时享受优先客服支持。' },
  { q: '如何取消订阅？', a: '您可以随时在个人中心取消订阅，取消后当前计费周期结束前仍可享受会员权益。我们不会设置任何隐藏的自动续费陷阱。' },
  { q: '支付方式有哪些？', a: '目前支持支付宝、微信支付等主流支付方式。所有交易均经过加密处理，确保您的支付安全。' },
  { q: '会员权益可以共享吗？', a: '每个账号的会员权益仅限该账号使用。如需多人使用，建议分别开通或联系我们的团队方案。' },
  { q: '分析结果准确吗？', a: '我们的 AI 命理分析基于传统命理学体系结合现代 AI 技术，提供参考性解读。命理分析仅供娱乐和参考，不构成任何决策依据，请理性对待。' },
];

interface PricingClientProps {
  currentPlan?: string;
}

export default function PricingClient({ currentPlan }: PricingClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [modal, setModal] = useState<{ planName: string; price: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('专业版');
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ planName: string; price: string } | null>(null);

  const isSubscribed = session?.user?.isSubscribed ?? false;

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
    setModal({ planName, price: `¥${price}` });
  };

  useEffect(() => {
    if (session && pendingPlan) {
      if (isSubscribed) {
        router.push('/profile?manage=true');
      } else {
        setModal({ planName: pendingPlan.planName, price: `¥${pendingPlan.price}` });
      }
      setPendingPlan(null);
    }
  }, [session, pendingPlan, isSubscribed, router]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      <section className="px-4 pt-20 md:pt-28 pb-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display text-[32px] md:text-[40px] font-semibold text-[#1C1A16] tracking-[0.08em]">
            选择您的计划
          </h1>
          <p className="text-[15px] text-[#1C1A16]/55 mt-3">
            灵活订阅，随时取消
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

      {modal && (
        <PaymentModal
          planName={modal.planName}
          price={modal.price}
          onClose={() => setModal(null)}
          onSuccess={() => {
            if (from === 'home') {
              router.refresh();
              setTimeout(() => router.push('/'), 100);
            } else {
              router.push('/profile');
            }
          }}
        />
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
