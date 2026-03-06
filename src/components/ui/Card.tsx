import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'glass';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl p-6';
    
    const variants = {
      default: 'bg-cyber-card border border-cyber-gold/10',
      highlight: 'bg-cyber-card border border-cyber-gold/30 shadow-glow',
      glass: 'bg-cyber-card/50 backdrop-blur-sm border border-cyber-gold/10',
    };
    
    const hoverStyles = hover ? 'card-hover cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
