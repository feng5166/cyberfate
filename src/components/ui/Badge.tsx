import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  /** accent=古铜橙(VIP/强调) · neutral=中性灰 · outline=描边 · success/danger 仅数据语义 */
  variant?: 'accent' | 'neutral' | 'outline' | 'success' | 'danger';
  className?: string;
}

// 状态标/角标唯一件：VIP、NEW、收费等小标签统一走这里，替代各处手搓 px-1.5 py-0.5 rounded 小块。
const variantClass = {
  accent: 'bg-brand-accent/10 text-brand-accent',
  neutral: 'bg-brand-border-light text-brand-gray',
  outline: 'border border-brand-border text-brand-gray',
  success: 'bg-element-wood-bg text-element-wood-text',
  danger: 'bg-element-fire-bg text-element-fire-text',
} as const;

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
