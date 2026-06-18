import type { Metadata } from 'next';

// 私密/后台页面：禁止搜索引擎索引（robots.txt 已 Disallow，此处再加 noindex 双保险，
// 防止被外链时仅凭 URL 进入索引）。
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
