import { Card } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-cyber py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-cyber-gold mb-2">
            📜 服务条款
          </h1>
          <p className="text-text-secondary">
            最后更新：2026年3月6日
          </p>
        </div>

        <Card className="prose prose-invert prose-sm max-w-none">
          <div className="space-y-6 text-text-secondary">
            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                一、服务说明
              </h2>
              <p>
                赛博命理师（以下简称"本站"）是一个基于人工智能技术的
                命理分析娱乐平台，提供八字算命、每日运势等服务。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                二、免责声明
              </h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
                <p className="text-red-400 font-semibold mb-2">⚠️ 重要声明</p>
                <p>
                  本站所有命理分析内容<strong>仅供娱乐参考</strong>，
                  <strong>不构成任何决策建议</strong>。
                  包括但不限于投资、婚姻、职业、健康等重大人生决策，
                  请您结合实际情况综合考虑，理性对待。
                </p>
              </div>
              <p>
                命理学是中华传统文化的一部分，本站以科学、理性的态度
                呈现相关内容，不宣扬迷信，不保证预测准确性。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                三、用户责任
              </h2>
              <p>使用本站服务时，您同意：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>提供真实的出生信息（以获得准确的计算结果）</li>
                <li>不将本站服务用于非法目的</li>
                <li>不对本站进行恶意攻击或滥用</li>
                <li>理性对待分析结果，不过度依赖</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                四、知识产权
              </h2>
              <p>
                本站的设计、代码、内容等均受知识产权法保护。
                未经许可，不得复制、修改、分发本站内容。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                五、服务变更
              </h2>
              <p>
                我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
                我们将尽力保持服务稳定，但不对服务中断承担责任。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                六、责任限制
              </h2>
              <p>
                在法律允许的最大范围内，本站不对因使用或无法使用本站服务
                而导致的任何直接、间接、偶然、特殊或后果性损害承担责任。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                七、条款修改
              </h2>
              <p>
                我们可能会不时修改本服务条款。修改后的条款将在本页面发布，
                继续使用本站服务即表示您接受修改后的条款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                八、适用法律
              </h2>
              <p>
                本服务条款受中华人民共和国法律管辖。
                如发生争议，双方应友好协商解决。
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
