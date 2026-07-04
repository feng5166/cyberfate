import { cn } from '@/lib/utils/cn';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** page=840 阅读版心(默认，内页/结果/法务) · wide=1024 稍宽 · narrow=560 表单/登录 */
  width?: 'page' | 'wide' | 'narrow';
}

// 内容版心唯一真源。此前 1280/840/768/672 + 13 种硬编码宽度混用，同级页面阅读宽度随机。
// 结果页/内容页/法务页统一用 <PageShell>；仅营销首页用更宽的 <Container>。
const widthClass = {
  page: 'max-w-page',   // 840px（globals --container-page）
  wide: 'max-w-5xl',    // 1024px
  narrow: 'max-w-[560px]',
} as const;

export function PageShell({ children, className = '', width = 'page' }: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widthClass[width], className)}>
      {children}
    </div>
  );
}
