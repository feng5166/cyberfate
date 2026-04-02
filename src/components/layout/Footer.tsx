import Link from 'next/link';

const footerLinks = [
  { label: '隐私政策', href: '/privacy' },
  { label: '服务条款', href: '/terms' },
  { label: '退款政策', href: '/refund' },
];

export function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-brand-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-12">
        {/* Logo + 版权 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="font-display text-base text-brand-black tracking-widest hover:opacity-70 transition-opacity">
            CYBERFATE
          </Link>

          {/* 链接 */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-brand-gray hover:text-brand-black hover:underline transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 版权 */}
          <p className="text-xs text-brand-light">
            © {new Date().getFullYear()} CyberFate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
