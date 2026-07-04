import { HTMLAttributes, forwardRef } from 'react';
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // 旧变体保留向后兼容；新变体 flat/outlined/elevated 为手搓卡片的统一迁移目标。
  variant?: 'default' | 'highlight' | 'form' | 'flat' | 'outlined' | 'elevated';
  hover?: boolean;
  /** 交互卡片：hover 抬升 + 触摸态。等价于 hover，但语义更清晰。 */
  interactive?: boolean;
}

// 全站唯一卡片：圆角固定 rounded-card(16px)，边框走 border token，不再手搓 rounded-xl/2xl。
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = true, interactive, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white rounded-card border border-brand-border-light p-7 shadow-card',
      flat: 'bg-white rounded-card border border-brand-border-light p-6',
      outlined: 'bg-white rounded-card border border-brand-border p-6',
      elevated: 'bg-white rounded-card border border-brand-border-light p-7 shadow-card',
      highlight: 'bg-white rounded-card border-2 border-brand-accent p-7 shadow-pricing',
      form: 'bg-white rounded-card border border-brand-border p-8 md:p-10 shadow-form max-w-[440px]',
    };

    const isInteractive = interactive ?? hover;
    const interactiveStyles = isInteractive
      ? 'hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 active:translate-y-0'
      : '';

    return (
      <div
        ref={ref}
        className={cn(variants[variant] || variants.default, interactiveStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
