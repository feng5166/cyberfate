import { FileText } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      <Container className="py-12 md:py-16">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1C1A16]/5 mb-4">
            <FileText className="w-6 h-6 text-[#1C1A16]" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-[#1C1A16] tracking-[0.08em] mb-3">
            服务条款
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
                  一、服务说明
                </h2>
                <p className="leading-relaxed">
                  赛博命理师（以下简称"本站"）提供基于AI技术的命理分析服务。本站提供的所有分析结果仅供参考，不构成任何决策依据或保证。用户应理性看待命理分析，并对自己的决策负责。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  二、用户行为规范
                </h2>
                <p className="leading-relaxed mb-3">使用本站服务时，您同意：</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>不利用本站服务从事违法违规活动</li>
                  <li>不恶意攻击或干扰本站的正常运行</li>
                  <li>不传播虚假信息或侵犯他人权益</li>
                  <li>不滥用服务资源（如恶意刷取次数）</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  三、知识产权
                </h2>
                <p className="leading-relaxed mb-3">
                  本站的所有内容（包括但不限于文字、图片、代码、设计）均受知识产权法保护。未经许可，您不得：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>复制、修改、传播本站的内容</li>
                  <li>商业使用本站提供的分析结果</li>
                  <li>逆向工程或抓取本站的算法和数据</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  四、免责声明
                </h2>
                <p className="leading-relaxed mb-3">
                  本站提供的服务基于算法模型和历史数据，存在一定的局限性。我们不对以下情况承担责任：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li>分析结果的准确性、完整性或适用性</li>
                  <li>因使用本站服务而产生的任何直接或间接损失</li>
                  <li>因网络故障、系统维护等导致的服务中断</li>
                  <li>第三方服务（如支付平台）的问题</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  五、服务变更与终止
                </h2>
                <p className="leading-relaxed">
                  本站保留随时修改、暂停或终止服务的权利，无需事先通知。对于付费用户，我们会根据退款政策处理相关事宜。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  六、争议解决
                </h2>
                <p className="leading-relaxed">
                  因使用本站服务产生的争议，双方应友好协商解决。协商不成的，任何一方均可向本站所在地人民法院提起诉讼。
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-[#1C1A16] tracking-[0.06em] mb-4">
                  七、联系我们
                </h2>
                <p className="leading-relaxed">
                  如果您对本服务条款有任何疑问，请通过以下方式联系我们：
                </p>
                <p className="text-sm mt-2">
                  邮箱：support@cyberfate.me
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
