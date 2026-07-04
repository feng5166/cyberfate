import { CreditCard } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '退款政策 | 赛博命理师 CyberFate',
  description: 'CyberFate 赛博命理师会员退款政策，了解退款条件与申请流程。',
  alternates: { canonical: 'https://www.cyberfate.me/refund' },
};

export default function RefundPage() {
  return (
    <div className="min-h-dvh bg-brand-bg text-brand-ink">
      <PageShell width="page" className="py-12 md:py-16">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-accent-soft mb-4">
            <CreditCard className="w-6 h-6 text-brand-accent" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-brand-ink tracking-[0.08em] mb-3">
            退款政策
          </h1>
          <p className="text-sm text-brand-gray">
            最后更新：2026年3月6日
          </p>
        </div>

        {/* 内容区 */}
        <Card className="p-6 md:p-10">
            <div className="prose prose-gray max-w-none space-y-8 text-brand-ink/80">
              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  一、退款原则
                </h2>
                <p className="leading-relaxed">
                  赛博命理师（以下简称"本站"）致力于为用户提供优质的服务体验。如果您对我们的服务不满意，可以根据以下政策申请退款。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  二、可退款情况
                </h2>
                <p className="leading-relaxed mb-3">以下情况可申请全额退款：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>技术故障</strong>：因系统问题导致服务无法正常使用，且在24小时内未能修复</li>
                  <li><strong>重复支付</strong>：因系统错误或网络问题导致的重复扣费</li>
                  <li><strong>未消费会员</strong>：购买会员后7天内未使用任何付费服务，且无违规行为</li>
                  <li><strong>服务严重不符</strong>：实际服务内容与宣传严重不符（需提供证据）</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  三、不予退款情况
                </h2>
                <p className="leading-relaxed mb-3">以下情况不支持退款：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>主观不满</strong>：因个人主观原因（如"感觉不准"、"不喜欢结果"）不予退款</li>
                  <li><strong>已消费会员</strong>：已使用付费服务（如已完成八字分析、塔罗占卜等）</li>
                  <li><strong>超过时限</strong>：购买会员超过7天且已使用服务</li>
                  <li><strong>违规行为</strong>：存在滥用服务、恶意刷取次数等违规行为</li>
                  <li><strong>促销商品</strong>：参与特价促销活动的商品（除非服务无法提供）</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  四、退款流程
                </h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-brand-ink mb-2">1. 提交申请</p>
                    <p className="leading-relaxed">
                      发送邮件至 refund@cyberfate.me，标题注明"退款申请"，并提供：
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>订单号或支付凭证</li>
                      <li>退款原因说明</li>
                      <li>联系方式（手机号/邮箱）</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-brand-ink mb-2">2. 审核处理</p>
                    <p className="leading-relaxed">
                      我们会在3个工作日内审核您的申请，并通过邮件或电话联系您确认相关信息。
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-brand-ink mb-2">3. 退款到账</p>
                    <p className="leading-relaxed">
                      审核通过后，退款将在5-7个工作日内原路退回您的支付账户。具体到账时间取决于支付渠道。
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  五、部分退款
                </h2>
                <p className="leading-relaxed">
                  对于年度会员，如果已使用部分服务但遇到重大服务问题，我们可能提供按比例的部分退款。具体金额由客服根据实际情况评估。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  六、争议解决
                </h2>
                <p className="leading-relaxed">
                  如果您对退款决定有异议，可以申请二次审核。我们会由更高级别的客服重新评估您的情况，并在5个工作日内给出最终答复。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-brand-ink tracking-[0.06em] mb-4">
                  七、联系我们
                </h2>
                <p className="leading-relaxed">
                  如果您对退款政策有任何疑问，请通过以下方式联系我们：
                </p>
                <div className="space-y-1 text-sm mt-2">
                  <p>邮箱：refund@cyberfate.me</p>
                  <p>工作时间：周一至周五 9:00-18:00</p>
                </div>
              </section>

              <div className="mt-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>温馨提示：</strong>
                  命理服务具有个性化、即时性的特点，购买前请仔细阅读服务说明。我们建议您先使用免费功能体验，确认满意后再购买会员。
                </p>
              </div>
            </div>
        </Card>
      </PageShell>
      <Footer />
    </div>
  );
}
