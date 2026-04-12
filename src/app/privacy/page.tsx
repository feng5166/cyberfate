import { Shield } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';

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
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  二、信息使用
                </h2>
                <p className="leading-relaxed mb-3">我们收集的信息仅用于：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>提供八字分析和运势分析服务</li>
                  <li>改进产品体验和算法准确性</li>
                  <li>统计分析（匿名化处理）</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  三、信息保护
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
                  四、Cookies
                </h2>
                <p className="leading-relaxed">
                  本站使用 Cookies 来改善用户体验。您可以通过浏览器设置管理 Cookies。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  五、政策更新
                </h2>
                <p className="leading-relaxed">
                  我们可能会不时更新本隐私政策。重大变更时，我们会在网站上发布通知。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  六、联系我们
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
