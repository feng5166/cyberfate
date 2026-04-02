'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
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
  const [modal, setModal] = useState<{ planName: string; price: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white min-h-screen">
      {/* 页面标题 */}
      <section className="px-4 pt-20 md:pt-26 pb-8">
        <Container>
          <div className="text-center max-w-xl mx-auto">
            <h1 className="font-display text-h1 md:text-display text-brand-black tracking-[0.08em] text-center">
              选择您的计划
            </h1>
            <p className="text-body-sm text-brand-gray text-center mt-3">
              灵活订阅，随时取消
            </p>
          </div>
        </Container>
      </section>

      {/* 三列定价卡片 */}
      <section className="px-4 pb-20 md:pb-26">
        <Container>
          <div className="flex flex-col lg:flex-row gap-6 max-w-[1000px] mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`flex-1 ${plan.recommended ? 'relative' : ''}`}>
                {/* 推荐标签 */}
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block bg-brand-black text-white text-xs px-3 py-1 rounded-full font-medium">
                      ★ 最受欢迎
                    </span>
                  </div>
                )}
                <Card
                  variant={plan.recommended ? 'highlight' : 'default'}
                  hover={!plan.recommended}
                  className={`h-full flex flex-col p-9 ${plan.recommended ? 'lg:scale-[1.03] lg:-translate-y-2' : ''}`}
                >
                  {/* 计划名称 */}
                  <h2 className="text-h3 font-semibold text-brand-black text-center mb-4">
                    {plan.name}
                  </h2>

                  {/* 价格 — ⚠️ Bug B1 修复：¥ 不是 HK$ */}
                  <div className="text-center mb-6 pb-6 border-b border-brand-border-light">
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-[40px] font-semibold leading-none text-brand-black">¥</span>
                      <span className="text-[40px] font-semibold leading-none text-brand-black">{plan.price}</span>
                    </div>
                    <span className="text-sm text-brand-gray ml-1">{plan.period}</span>
                  </div>

                  {/* 权益列表 — ⚠️ Bug B2 修复：更新权益表 */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* CTA 按钮 */}
                  <Button
                    variant={plan.recommended ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => setModal({ planName: plan.name, price: `¥${plan.price}` })}
                  >
                    {plan.recommended ? '立即开通' : '选择方案'}
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ 手风琴 */}
      <section className="px-4 pb-20 md:pb-26 bg-brand-bg">
        <Container>
          <h2 className="text-h2 font-semibold text-brand-black text-center mb-8">常见问题</h2>
          <div className="max-w-[720px] mx-auto divide-y divide-brand-border-light">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-base font-medium text-brand-black pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-brand-light shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-brand-light shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="text-sm text-brand-gray leading-relaxed mt-3 pt-1 animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <Footer />

      {/* Payment Modal */}
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
