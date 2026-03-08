import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const footerLinks = [
  {
    title: '功能',
    links: [
      { label: '八字计算', href: '/bazi' },
      { label: '每日运势', href: '/daily' },
      { label: '紫微斗数', href: '/ziwei', soon: true },
      { label: '塔罗牌', href: '/tarot', soon: true },
    ],
  },
  {
    title: '关于',
    links: [
      { label: '隐私政策', href: '/privacy' },
      { label: '服务条款', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-background-alt border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" strokeWidth={2} />
              <span className="font-heading text-xl font-semibold text-primary">
                赛博命理师
              </span>
            </div>
            <p className="text-secondary text-sm leading-relaxed">
              融合传统命理与现代 AI 技术，<br />
              为你提供科学、理性的命理分析参考。
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-primary mb-4">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.soon ? '#' : link.href}
                      className={`text-sm ${
                        link.soon
                          ? 'text-muted cursor-not-allowed'
                          : 'text-secondary hover:text-primary'
                      } transition-colors`}
                    >
                      {link.label}
                      {link.soon && <span className="ml-1 text-xs">(即将上线)</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-muted text-xs text-center mb-4">
            免责声明：本站所有命理分析仅供娱乐参考，不构成任何决策建议。重要决策请结合个人实际情况综合考虑。
          </p>
          <p className="text-muted text-xs text-center">
            © {new Date().getFullYear()} CyberFate 赛博命理师. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
