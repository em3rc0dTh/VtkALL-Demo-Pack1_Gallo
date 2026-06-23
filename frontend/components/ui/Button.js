import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef(({ 
  className = '', 
  variant = 'primary', 
  size = 'default', 
  loading = false, 
  disabled = false, 
  children, 
  icon: Icon,
  ...props 
}, ref) => {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-sm shadow-black/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white shadow-sm shadow-black/20",
    outline: "border border-gray-700/80 hover:border-gray-500 text-gray-300 hover:text-white bg-gray-900/50 hover:bg-gray-800",
    danger: "bg-red-500/90 hover:bg-red-600 text-white shadow-sm shadow-black/20",
    ghost: "bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-gray-200",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2",
  };

  const finalClasses = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.default} ${className}`;

  return (
    <button 
      ref={ref} 
      className={finalClasses} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
