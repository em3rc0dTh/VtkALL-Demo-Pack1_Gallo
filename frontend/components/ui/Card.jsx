import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef(({ className = '', children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "bg-gradient-to-b from-surface-panel to-surface-subtle/35 border border-border-default rounded-xl shadow-sm transition-all hover:shadow-md",
      className
    )} 
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 rounded-t-xl border-b border-border-subtle bg-surface-subtle/70 p-5", className)} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className = '', children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight text-text-primary flex items-center gap-2", className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(({ className = '', children, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-text-muted", className)} {...props}>
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-4", className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';
