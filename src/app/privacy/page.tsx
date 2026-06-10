import { Shield } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 | 赛博命理师 CyberFate',
  description: 'CyberFate 赛博命理师隐私政策，说明我们如何收集、使用和保护您的个人信息。',
  alternates: { canonical: 'https://www.cyberfate.me/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      <Container className="py-12 md:py-16">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1C1A16]/5 mb-4">
            <Shield className="w-6 h-6 text-[#1C1A16]" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-[#1C1A16] tracking-[0.08em] mb-3">
            隐私政策
          </h1>
          <p className="text-sm text-[#1C1A16]/60">
            最后更新：2026年3月6日
          </p>
        </div>

        {/* 内容区 */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 md:p-10">
            <div className="prose prose-gray max-w-none space-y-8 text-[#1C1A16]/80">
              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  一、信息收集
                </h2>
                <p className="leading-relaxed mb-3">
                  赛博命理师（以下简称"本站"）在提供服务时，可能会收集以下信息：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>您主动输入的出生日期和时辰信息</li>
                  <li>您选填的姓名和性别信息</li>
                  <li>浏览器类型、设备信息等技术数据</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <strong>重要提示：</strong>您提供的出生日期、时辰、性别等信息属于<strong>敏感个人信息</strong>，本站将按照最高标准保护此类信息，仅用于为您提供命理分析服务，不会用于其他目的。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  二、信息使用与第三方服务
                </h2>
                <p className="leading-relaxed mb-3">我们收集的信息仅用于：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>提供八字分析和运势分析服务</li>
                  <li>改进产品体验和算法准确性</li>
                  <li>统计分析（匿名化处理）</li>
                </ul>
                <p className="mt-4 leading-relaxed mb-2 font-medium text-sm">AI 服务商数据传输说明：</p>
                <p className="text-sm leading-relaxed">
                  本站使用 AI 大语言模型（包括 DeepSeek API）生成命理解读内容。您输入的出生信息可能会被传输至 AI 服务商服务器进行处理。我们仅传输分析所必需的最少数据，且不会与 AI 服务商共享您的账户标识信息。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  三、数据跨境传输
                </h2>
                <p className="leading-relaxed mb-3">
                  本站涉及以下跨境数据传输：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>Vercel（美国）</strong>：本站部署于 Vercel 平台，您的请求数据可能经由美国数据中心处理</li>
                  <li><strong>DeepSeek（中国大陆）</strong>：AI 解读服务由 DeepSeek 提供，相关命理分析数据会传输至其服务器</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed">
                  使用本站即表示您同意上述跨境数据传输。如您对此有疑虑，请勿提交个人出生信息。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  四、信息保护
                </h2>
                <p className="leading-relaxed mb-3">我们承诺：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>不会向第三方出售、出租或以其他方式披露您的个人信息</li>
                  <li>采用行业标准的安全措施保护数据</li>
                  <li>您可以随时删除历史记录</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  五、您的权利（数据主体权利）
                </h2>
                <p className="leading-relaxed mb-3">您对您的个人数据拥有以下权利：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>访问权</strong>：您可以请求查看我们持有的您的个人数据</li>
                  <li><strong>删除权</strong>：您可以随时要求删除您的账户及相关个人数据。请发送删除请求至 privacy@cyberfate.me，我们将在 30 个工作日内处理</li>
                  <li><strong>更正权</strong>：如您发现数据有误，可联系我们进行更正</li>
                  <li><strong>数据可携权</strong>：您可以请求以通用格式导出您的个人数据</li>
                  <li><strong>撤回同意权</strong>：您可以随时撤回对数据处理的同意，但不影响撤回前已进行处理的合法性</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  六、Cookies 与追踪技术
                </h2>
                <p className="leading-relaxed mb-3">
                  本站使用 Cookies 和类似技术来改善用户体验。具体使用情况如下：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>必要 Cookie</strong>：用于维持登录状态和基本功能，无法关闭</li>
                  <li><strong>功能 Cookie</strong>：记住您的偏好设置（如出生信息）</li>
                  <li><strong>分析 Cookie</strong>：用于了解网站使用情况（匿名统计）</li>
                </ul>
                <p className="mt-3 text-sm leading-relaxed">
                  您可以通过浏览器设置管理或禁用 Cookies，但这可能影响某些功能的正常使用。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  七、政策更新
                </h2>
                <p className="leading-relaxed">
                  我们可能会不时更新本隐私政策。重大变更时，我们会在网站上发布通知。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  八、联系我们
                </h2>
                <p className="leading-relaxed">
                  如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
                </p>
                <p className="text-sm mt-2">
                  邮箱：privacy@cyberfate.me
                </p>
              </section>
            </div>
          </Card>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
