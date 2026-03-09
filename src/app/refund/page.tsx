export default function RefundPage() {
  return (
    <div className="bg-background min-h-screen px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
          退款政策
        </h1>
        <div className="text-sm text-muted mb-8">
          生效日期：2026-03-09 | 最后更新：2026-03-09
        </div>

        <div className="prose prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">一、退款原则</h2>
            <p className="text-secondary leading-relaxed">
              赛博命理师致力于为用户提供优质的服务体验。我们理解您可能因各种原因需要申请退款，我们会根据以下政策公平处理。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">二、退款条件</h2>
            
            <h3 className="text-xl font-semibold text-primary mb-3">2.1 可申请全额退款的情况</h3>
            <p className="text-secondary mb-3">以下情况下，您可以在 <strong>7 天内</strong> 申请全额退款：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2 mb-6">
              <li><strong>技术故障</strong>：因系统故障导致服务无法正常使用，且我们未能在 48 小时内解决</li>
              <li><strong>重复扣费</strong>：因系统错误导致重复扣费</li>
              <li><strong>未授权扣费</strong>：账户被盗用导致的非本人订阅</li>
            </ul>

            <h3 className="text-xl font-semibold text-primary mb-3">2.2 可申请部分退款的情况</h3>
            <ol className="list-decimal pl-6 text-secondary space-y-2 mb-3">
              <li><strong>未使用期限</strong>：
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>年卡用户在订阅后 30 天内申请退款，可按剩余天数比例退款</li>
                  <li>季卡用户在订阅后 14 天内申请退款，可按剩余天数比例退款</li>
                  <li>月卡用户在订阅后 7 天内申请退款，可按剩余天数比例退款</li>
                </ul>
              </li>
              <li className="mt-3"><strong>计算公式</strong>：
                <div className="bg-background-alt p-4 rounded mt-2 font-mono text-sm">
                  退款金额 = 订阅费用 × (剩余天数 / 总天数)
                </div>
              </li>
            </ol>

            <h3 className="text-xl font-semibold text-primary mb-3">2.3 不予退款的情况</h3>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>已使用超过退款期限（年卡 30 天 / 季卡 14 天 / 月卡 7 天）</li>
              <li>因违反服务条款被终止服务</li>
              <li>主观原因（如"不喜欢"、"不准确"等）且已超过 7 天</li>
              <li>已使用大量服务（如 AI 解读次数超过 50 次）</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">三、退款流程</h2>
            
            <h3 className="text-xl font-semibold text-primary mb-3">3.1 申请方式</h3>
            <p className="text-secondary mb-3">通过以下任一方式提交退款申请：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2 mb-6">
              <li><strong>邮件申请</strong>：发送至 support@cyberfate.com</li>
              <li><strong>在线客服</strong>：访问网站右下角客服窗口</li>
              <li><strong>个人中心</strong>：登录后在"订阅管理"中提交工单</li>
            </ul>

            <h3 className="text-xl font-semibold text-primary mb-3">3.2 所需信息</h3>
            <p className="text-secondary mb-3">请在申请中提供：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2 mb-6">
              <li>订单号</li>
              <li>注册邮箱</li>
              <li>退款原因</li>
              <li>相关截图（如有技术问题）</li>
            </ul>

            <h3 className="text-xl font-semibold text-primary mb-3">3.3 处理时效</h3>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li><strong>审核时间</strong>：收到申请后 3 个工作日内完成审核</li>
              <li><strong>退款到账</strong>：审核通过后 5-10 个工作日到账（具体时间取决于支付渠道）</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">四、特殊说明</h2>
            
            <h3 className="text-xl font-semibold text-primary mb-3">4.1 促销活动订阅</h3>
            <p className="text-secondary mb-3">参与促销活动（如限时折扣、优惠券）购买的订阅：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2 mb-6">
              <li>退款金额按 <strong>实际支付金额</strong> 计算</li>
              <li>不可要求按原价退款</li>
            </ul>

            <h3 className="text-xl font-semibold text-primary mb-3">4.2 赠送会员</h3>
            <p className="text-secondary mb-6">通过活动赠送或兑换码获得的会员时长不支持退款。</p>

            <h3 className="text-xl font-semibold text-primary mb-3">4.3 自动续费</h3>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>自动续费可随时在个人中心关闭</li>
              <li>关闭后当前订阅期结束后不再续费</li>
              <li>已扣费的续费订单可按本政策申请退款</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">五、争议解决</h2>
            <p className="text-secondary mb-3">如您对退款决定有异议：</p>
            <ol className="list-decimal pl-6 text-secondary space-y-2">
              <li>可在收到决定后 7 天内提出复议</li>
              <li>我们将在 5 个工作日内重新审核</li>
              <li>最终决定将以邮件形式通知</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">六、联系我们</h2>
            <p className="text-secondary mb-3">如有任何关于退款政策的疑问，请联系：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li><strong>邮箱</strong>：support@cyberfate.com</li>
              <li><strong>工作时间</strong>：周一至周五 9:00-18:00 (GMT+8)</li>
              <li><strong>响应时间</strong>：24 小时内回复</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-4">七、政策更新</h2>
            <p className="text-secondary mb-3">我们保留随时修改本退款政策的权利。政策更新后：</p>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>将在网站显著位置公告</li>
              <li>通过邮件通知现有订阅用户</li>
              <li>更新后的政策不影响已提交的退款申请</li>
            </ul>
          </section>

          <div className="text-center text-muted mt-12 pt-8 border-t border-border">
            <p>赛博命理师团队</p>
          </div>
        </div>
      </div>
    </div>
  );
}

