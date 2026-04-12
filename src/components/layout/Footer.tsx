import Link from 'next/link';

const FOOTER_GROUPS = [
  {
    title: '八字功能',
    links: [
      { label: '八字分析', href: '/bazi' },
      { label: '合婚分析', href: '/bazi/marriage' },
      { label: '每日运势', href: '/daily' },
      { label: '紫微斗数', href: '/ziwei' },
      { label: '梅花易数', href: '/meihua' },
      { label: '塔罗占卜', href: '/tarot' },
      { label: 'AI老黄历', href: '/huangli' },
    ],
  },
  {
    title: '实用工具',
    links: [
      { label: '知识库', href: '/knowledge' },
      { label: '历史记录', href: '/history' },
      { label: '定价', href: '/pricing' },
    ],
  },
  {
    title: '公司',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '隐私政策', href: '/privacy' },
      { label: '服务条款', href: '/terms' },
      { label: '退款政策', href: '/refund' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-brand-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="font-display text-lg text-[#1C1A16] tracking-widest hover:opacity-70 transition-opacity">
              CYBERFATE
            </Link>
            <p className="mt-3 text-sm text-[#1C1A16]/70">
              AI 驱动的东方命理分析平台
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-[#1C1A16] tracking-wide uppercase">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-2 px-1 text-[14px] text-brand-gray hover:text-[#1C1A16] transition-colors min-h-[44px] flex items-center"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-brand-border-light flex flex-col md:flex-row items-center justify-between gap-4 text-[14px] text-[#1C1A16]/60">
          <p>© 2026 CyberFate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
