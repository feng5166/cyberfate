import { cn } from '@/lib/utils/cn';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** narrow=560 表单/登录 · page=840 阅读版心(默认) · wide=1024 · chart=1152 命盘/排盘/两列结果页 */
  width?: 'narrow' | 'page' | 'wide' | 'chart';
}

// 内容版心唯一真源。分层策略：中文长文/法务用 page(840) 控行长；命盘/排盘/两列结果页用 chart(1152) 吃满大屏。
const widthClass = {
  narrow: 'max-w-[560px]',
  page: 'max-w-page',   // 840px（globals --container-page）
  wide: 'max-w-5xl',    // 1024px
  chart: 'max-w-6xl',   // 1152px — 桌面命盘/排盘/双栏结果页
} as const;

export function PageShell({ children, className = '', width = 'page' }: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widthClass[width], className)}>
      {children}
    </div>
  );
}
