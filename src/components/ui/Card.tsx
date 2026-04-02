import { HTMLAttributes, forwardRef } from 'react';
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'form';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = true, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white rounded-card border border-brand-border-light p-7 shadow-card',
      highlight: 'bg-white rounded-card border-2 border-brand-black p-7 shadow-pricing',
      form: 'bg-white rounded-card border border-brand-border p-10 shadow-form max-w-[440px]',
    };
    
    const hoverStyles = hover ? 'hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300' : '';

    return (
      <div
        ref={ref}
        className={cn(variants[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
