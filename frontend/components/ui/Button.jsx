import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(({ 
  className = '', 
  variant = 'primary', 
  size = 'default', 
  loading = false, 
  disabled = false, 
  children, 
  icon: Icon,
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring/50 disabled:bg-action-disabled disabled:text-text-disabled disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-action-primary hover:bg-action-primary-hover text-on-action-primary shadow-sm",
    secondary: "bg-surface-panel border border-border-default hover:bg-surface-subtle text-text-secondary hover:text-text-primary shadow-sm",
    outline: "bg-surface-panel border border-border-default hover:bg-surface-subtle text-text-secondary hover:text-text-primary shadow-sm", // Alias para secondary
    danger: "bg-status-danger hover:bg-status-danger/90 text-white shadow-sm",
    "danger-outline": "bg-surface-panel border border-status-danger text-status-danger hover:bg-status-danger-soft",
    ghost: "bg-transparent hover:bg-surface-subtle text-text-secondary hover:text-text-primary",
  };
  
  const sizes = {
    sm: "min-h-9 px-3 py-1.5 text-[13px]",
    default: "min-h-10 px-4 py-2 text-sm",
    lg: "min-h-12 px-6 py-3 text-base",
    icon: "h-10 w-10 p-2",
  };

  const finalClasses = cn(
    baseClasses, 
    variants[variant] || variants.primary, 
    sizes[size] || sizes.default, 
    className
  );

  return (
    <button 
      type={type}
      ref={ref} 
      className={finalClasses} 
      disabled={disabled || loading} 
      onClick={(event) => {
        if (onClick) {
          onClick(event);
        }
      }}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
