import { forwardRef } from 'react';

export const Card = forwardRef(({ className = '', children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={`bg-dark-card/50 backdrop-blur-md border border-gray-700/50 rounded-xl transition-all hover:border-gray-600/50 hover:shadow-lg hover:shadow-black/20 ${className}`} 
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-5 border-b border-gray-700/50 ${className}`} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className = '', children, ...props }, ref) => (
  <h3 ref={ref} className={`text-base font-semibold leading-none tracking-tight text-white flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(({ className = '', children, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-gray-400 ${className}`} {...props}>
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`p-5 pt-4 ${className}`} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`flex items-center p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';
