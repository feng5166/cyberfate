'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';

const plans = [
  {
    name: '基础版',
    price: '29',
    period: '/ 月',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '标准客服支持'],
  },
  {
    name: '专业版',
    price: '68',
    period: '/ 季',
    recommended: true,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '优先客服支持', '紫微斗数', '周易占卜（梅花易数）'],
  },
  {
    name: '尊享版',
    price: '238',
    period: '/ 年',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '专属客服支持', '紫微斗数', '周易占卜（梅花易数）', '塔罗占卜', '新功能优先体验'],
  },
];

const faqs = [
  { q: '免费版和会员版有什么区别？', a: '免费版每天可进行 3 次基础八字分析。会员版解锁无限次分析、AI 深度报告、紫微斗数、塔罗占卜等全部高级功能，同时享受优先客服支持。' },
  { q: '如何取消订阅？', a: '您可以随时在个人中心取消订阅，取消后当前计费周期结束前仍可享受会员权益。我们不会设置任何隐藏的自动续费陷阱。' },
  { q: '支付方式有哪些？', a: '目前支持支付宝、微信支付等主流支付方式。所有交易均经过加密处理，确保您的支付安全。' },
  { q: '会员权益可以共享吗？', a: '每个账号的会员权益仅限该账号使用。如需多人使用，建议分别开通或联系我们的团队方案。' },
  { q: '分析结果准确吗？', a: '我们的 AI 命理分析基于传统命理学体系结合现代 AI 技术，提供参考性解读。命理分析仅供娱乐和参考，不构成任何决策依据，请理性对待。' },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [modal, setModal] = useState<{ planName: string; price: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('专业版');

  const handleSelectPlan = (planName: string, price: string) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setModal({ planName, price: `¥${price}` });
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      {/* 页面标题 */}
      <section className="px-4 pt-20 md:pt-28 pb-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display text-[32px] md:text-[40px] font-semibold text-[#1C1A16] tracking-[0.08em]">
            选择您的计划
          </h1>
          <p className="text-[15px] text-[#1C1A16]/55 mt-3">
            灵活订阅，随时取消
          </p>
        </div>
      </section>

      {/* 三列定价卡片 */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 max-w-[1000px] mx-auto">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;
            return (
              <div
                key={plan.name}
                className={`flex-1 cursor-pointer ${plan.recommended ? 'relative' : ''}`}
                onClick={() => setSelectedPlan(plan.name)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block bg-[#1C1A16] text-white text-xs px-3 py-1 rounded-full font-medium">
                      ★ 最受欢迎
                    </span>
                  </div>
                )}
                <div
                  className={`h-full flex flex-col p-5 md:p-9 bg-white rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'shadow-md ring-2 ring-[#1C1A16] lg:scale-[1.03] lg:-translate-y-2'
                      : 'shadow-sm hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  <h2 className="text-[20px] font-semibold text-[#1C1A16] text-center mb-4">
                    {plan.name}
                  </h2>

                  <div className="text-center mb-6 pb-6 border-b border-[#1C1A16]/8">
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-[40px] font-semibold leading-none text-[#1C1A16]">¥</span>
                      <span className="text-[40px] font-semibold leading-none text-[#1C1A16]">{plan.price}</span>
                    </div>
                    <span className="text-sm text-[#1C1A16]/55 ml-1">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-sm text-[#1C1A16]/80">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const selected = plans.find((p) => p.name === selectedPlan);
                      if (selected) handleSelectPlan(selected.name, selected.price);
                    }}
                    className={`w-full h-12 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#1C1A16] text-white hover:bg-[#2A2621]'
                        : 'border border-[#1C1A16]/15 text-[#1C1A16] hover:border-[#1C1A16]/40 hover:bg-[#1C1A16]/[0.03]'
                    }`}
                  >
                    {isSelected ? '立即开通' : '选择方案'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ 手风琴 */}
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
        />
      )}
    </div>
  );
}
