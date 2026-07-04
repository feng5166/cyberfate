import { cn } from '@/lib/utils/cn';

interface SplitLayoutProps {
  /** 主内容（长文/AI 解读/详情），占弹性宽 */
  main: React.ReactNode;
  /** 侧栏（命盘/排盘/日历/概览/目录），固定宽、桌面可 sticky 陪同 */
  aside: React.ReactNode;
  /** 侧栏在左(命盘/日历/概览)还是右(目录)。默认右。 */
  asidePosition?: 'left' | 'right';
  /** 侧栏宽度档：320 / 360 / 400。默认 360。 */
  asideWidth?: 320 | 360 | 400;
  /** 桌面侧栏是否 sticky 跟随滚动（读解读时命盘/概览常驻视野）。默认 true。 */
  stickyAside?: boolean;
  className?: string;
  asideClassName?: string;
}

// 桌面两列布局唯一原语：<lg 竖向堆叠（侧栏按语义排在主内容前/后），lg+ 两列 + 侧栏 sticky。
// 用于「排盘/命盘 | AI 解读」「日历 | 当日详情」「概览 | 详情(master-detail)」等一切并排结果页。
// grid-cols 用字面量类（Tailwind 静态可扫，不能运行时拼接），故 position×width 预置为固定类。
const COLS = {
  'left-320': 'lg:grid-cols-[320px_minmax(0,1fr)]',
  'left-360': 'lg:grid-cols-[360px_minmax(0,1fr)]',
  'left-400': 'lg:grid-cols-[400px_minmax(0,1fr)]',
  'right-320': 'lg:grid-cols-[minmax(0,1fr)_320px]',
  'right-360': 'lg:grid-cols-[minmax(0,1fr)_360px]',
  'right-400': 'lg:grid-cols-[minmax(0,1fr)_400px]',
} as const;

export function SplitLayout({
  main, aside, asidePosition = 'right', asideWidth = 360,
  stickyAside = true, className = '', asideClassName = '',
}: SplitLayoutProps) {
  const cols = COLS[`${asidePosition}-${asideWidth}` as keyof typeof COLS];

  const asideEl = (
    <aside className={cn(stickyAside && 'lg:sticky lg:top-24 lg:self-start', asideClassName)}>
      {aside}
    </aside>
  );
  const mainEl = <div className="min-w-0">{main}</div>;

  return (
    <div className={cn('flex flex-col gap-6 lg:grid lg:gap-8 lg:items-start', cols, className)}>
      {asidePosition === 'left' ? (<>{asideEl}{mainEl}</>) : (<>{mainEl}{asideEl}</>)}
    </div>
  );
}
