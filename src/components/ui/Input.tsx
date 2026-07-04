import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// 统一输入框配方：
// - text-base(16px)：iOS Safari 对 <16px 的输入框会自动放大，抖动整页；16px 杜绝聚焦缩放。
// - min-h-[44px]：触控目标达标。
// - focus 走古铜橙强调色环，与全站一致。
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-brand-gray">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full min-h-[44px] px-4 py-3 rounded-xl bg-white text-base text-brand-ink placeholder:text-brand-light',
            'border transition-colors focus:outline-none',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border-brand-border focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
