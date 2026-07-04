import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'small' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    // 唯一焦点环：键盘导航时显示古铜橙 ring；关掉全局 outline 兜底避免重叠。
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ' +
      'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';

    // 强调色是全站唯一主色：primary 永远古铜橙。其余变体只做中性/次要。
    const variants = {
      primary: 'bg-brand-accent text-white hover:bg-brand-accent-hover shadow-sm',
      secondary: 'bg-white text-brand-ink border border-brand-ink/25 hover:border-brand-ink/50 hover:bg-brand-bg',
      text: 'text-brand-ink hover:text-brand-accent bg-transparent border-none px-0 py-0',
      small: 'bg-brand-ink text-white hover:bg-brand-ink/85 rounded-lg px-5 min-h-[40px] text-sm',
      ghost: 'bg-transparent text-brand-gray hover:text-brand-ink hover:bg-brand-border-light rounded-lg px-6 min-h-[44px] text-sm',
    };

    // 触控友好：主/次按钮各尺寸最小高度 ≥44px。
    const sizes = {
      sm: 'text-[13px] px-6 min-h-[44px]',
      md: 'text-[13px] px-[38px] min-h-[46px]',
      lg: 'text-[13px] px-10 min-h-[52px]',
    };
    const sizeClass = (variant === 'primary' || variant === 'secondary') ? sizes[size] : '';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant] || variants.primary, sizeClass, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
