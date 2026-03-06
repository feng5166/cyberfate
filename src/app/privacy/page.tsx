import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-cyber py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-cyber-gold mb-2">
            🔒 隐私政策
          </h1>
          <p className="text-text-secondary">
            最后更新：2026年3月6日
          </p>
        </div>

        <Card className="prose prose-invert prose-sm max-w-none">
          <div className="space-y-6 text-text-secondary">
            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                一、信息收集
              </h2>
              <p>
                赛博命理师（以下简称"本站"）在提供服务时，可能会收集以下信息：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>您主动输入的出生日期和时辰信息</li>
                <li>您选填的姓名和性别信息</li>
                <li>浏览器类型、设备信息等技术数据</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                二、信息使用
              </h2>
              <p>我们收集的信息仅用于：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>提供八字计算和运势分析服务</li>
                <li>改善用户体验和服务质量</li>
                <li>进行匿名统计分析</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                三、信息存储
              </h2>
              <p>
                本站使用浏览器本地存储（localStorage）保存您的出生信息，
                以便您下次访问时无需重新输入。这些数据仅存储在您的设备上，
                我们的服务器不会保存您的个人信息。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                四、信息保护
              </h2>
              <p>
                我们采取合理的技术和管理措施保护您的信息安全。
                但请注意，互联网传输不能保证 100% 安全。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                五、第三方服务
              </h2>
              <p>
                本站使用 AI 技术（Claude by Anthropic）生成命理解读。
                在此过程中，您的出生信息会被发送至 AI 服务进行处理。
                我们不会将您的信息用于其他目的或分享给其他第三方。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                六、您的权利
              </h2>
              <p>您可以随时：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>清除浏览器本地存储的数据</li>
                <li>选择不使用本站服务</li>
                <li>联系我们删除相关数据</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                七、政策更新
              </h2>
              <p>
                我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，
                建议您定期查看。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-heading font-semibold text-cyber-gold mb-3">
                八、联系我们
              </h2>
              <p>
                如有任何隐私相关问题，请通过网站反馈渠道联���我们。
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
