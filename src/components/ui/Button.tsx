import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'small' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-brand-black text-white hover:bg-gray-800 rounded-lg px-8 py-3.5 text-base',
      secondary: 'bg-white text-brand-black rounded-lg px-8 py-3.5 text-base border border-gray-300 hover:border-gray-400 hover:bg-gray-50',
      text: 'text-brand-black hover:underline bg-transparent border-none px-0 py-0',
      small: 'bg-brand-black text-white hover:bg-gray-800 rounded-lg px-5 py-2.5 text-sm',
      ghost: 'bg-transparent text-brand-gray hover:text-brand-black hover:bg-gray-100 rounded-lg px-6 py-2.5 text-sm border border-gray-200',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    // text & ghost variants don't use size
    const styleKey = (variant === 'text' || variant === 'small' || variant === 'ghost') ? variant : `${variant}-${size}`;

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant] || variants.primary, className)}
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
