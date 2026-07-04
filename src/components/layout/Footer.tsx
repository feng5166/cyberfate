import Link from 'next/link';
import FeedbackSection from '@/components/feedback/FeedbackSection';
import { MODULES } from '@/data/modules';

const FOOTER_GROUPS = [
  {
    title: '命理功能',
    // 模块链接从 MODULES 唯一真源派生，标签与全站一致
    links: MODULES.map((m) => ({ label: m.label, href: m.href })),
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
  {
    title: '联系我们',
    links: [],
  },
];

export function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <FeedbackSection />
      {children}
      <footer className="bg-brand-bg border-t border-brand-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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
              {group.links.length > 0 ? (
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
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1C1A16] flex items-center justify-center">
                    <img src="/favicon.svg" alt="CyberFate" className="w-7 h-7" />
                  </div>
                  <p className="text-[12px] text-[#1C1A16]/50">
                    AI 赛博命理 · 探索命运之谜
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[13px] text-[#1C1A16]/60">
                      📧 feng5166@gmail.com
                    </p>
                    <p className="text-[13px] text-[#1C1A16]/60">
                      💬 wechat: feng5166
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-brand-border-light flex flex-col md:flex-row items-center justify-between gap-4 text-[14px] text-[#1C1A16]/60">
          <p>© 2026 CyberFate. All rights reserved.</p>
          <p className="text-[12px] text-[#1C1A16]/40">本站内容由 AI 辅助生成，仅供参考娱乐</p>
        </div>
      </div>
      </footer>
    </>
  );
}
