'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaymentModal } from '@/components/PaymentModal';

const plans = [
  {
    name: '月卡',
    price: '¥29',
    period: '/ 月',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '标准客服支持'],
  },
  {
    name: '季卡',
    price: '¥69',
    period: '/ 季',
    recommended: true,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '优先客服支持', '紫微斗数（即将开放）', '周易占卜（即将开放）'],
  },
  {
    name: '年卡',
    price: '¥199',
    period: '/ 年',
    recommended: false,
    perks: ['无限次八字解读', '每日运势推送', 'AI 深度分析报告', '专属客服支持', '紫微斗数（即将开放）', '周易占卜（即将开放）', '塔罗牌（即将开放）', '新功能优先体验'],
  },
];

const comparisonRows = [
  { feature: '八字解读次数', free: '3次/天', monthly: '无限', quarterly: '无限', yearly: '无限' },
  { feature: '每日运势', free: '✓', monthly: '✓', quarterly: '✓', yearly: '✓' },
  { feature: 'AI 深度报告', free: '✗', monthly: '✓', quarterly: '✓', yearly: '✓' },
  { feature: '紫微斗数', free: '✗', monthly: '✗', quarterly: '即将开放', yearly: '即将开放' },
  { feature: '周易占卜', free: '✗', monthly: '✗', quarterly: '即将开放', yearly: '即将开放' },
  { feature: '客服支持', free: '✗', monthly: '标准', quarterly: '优先', yearly: '专属' },
];

export default function PricingPage() {
  const [modal, setModal] = useState<{ planName: string; price: string } | null>(null);

  return (
    <div className="bg-gradient-cyber min-h-screen px-4 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-cyber-gold mb-4">
            会员套餐
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            解锁完整命理体验，AI 深度分析伴你左右
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-cyber-gold-dark to-cyber-gold text-cyber-bg text-xs font-bold px-4 py-1 rounded-full">
                    推荐
                  </span>
                </div>
              )}
              <Card
                variant={plan.recommended ? 'highlight' : 'default'}
                className={`h-full flex flex-col ${plan.recommended ? 'ring-1 ring-cyber-gold/40' : ''}`}
              >
                <div className="text-center mb-6">
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-3">
                    {plan.name}
                  </h2>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-cyber-gold">{plan.price}</span>
                    <span className="text-text-muted text-sm mb-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-cyber-gold mt-0.5 shrink-0">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.recommended ? 'primary' : 'secondary'}
                  className="w-full"
                  onClick={() => setModal({ planName: plan.name, price: plan.price })}
                >
                  立即开通
                </Button>
              </Card>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div>
          <h2 className="font-heading text-xl font-bold text-center text-cyber-gold mb-8">
            权益对比
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-gold/20">
                  <th className="text-left py-3 px-4 text-text-muted font-normal w-1/3">功能</th>
                  <th className="text-center py-3 px-4 text-text-muted font-normal">免费</th>
                  <th className="text-center py-3 px-4 text-text-muted font-normal">月卡</th>
                  <th className="text-center py-3 px-4 text-cyber-gold font-semibold">季卡</th>
                  <th className="text-center py-3 px-4 text-text-muted font-normal">年卡</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-cyber-gold/10 ${i % 2 === 0 ? 'bg-cyber-card/30' : ''}`}
                  >
                    <td className="py-3 px-4 text-text-secondary">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-text-muted">{row.free}</td>
                    <td className="py-3 px-4 text-center text-text-secondary">{row.monthly}</td>
                    <td className="py-3 px-4 text-center text-cyber-gold font-medium">{row.quarterly}</td>
                    <td className="py-3 px-4 text-center text-text-secondary">{row.yearly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
