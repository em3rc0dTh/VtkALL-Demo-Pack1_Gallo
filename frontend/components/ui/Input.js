import { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      className={`w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-500 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <textarea
      className={`w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-500 min-h-[80px] resize-y ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const FieldLabel = ({ className = '', children, ...props }) => (
  <label className={`block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide ${className}`} {...props}>
    {children}
  </label>
);

export const FieldHint = ({ className = '', children, ...props }) => (
  <p className={`text-[11px] text-gray-500 mt-1.5 ${className}`} {...props}>
    {children}
  </p>
);

export const FieldError = ({ className = '', children, ...props }) => {
  if (!children) return null;
  return (
    <p className={`text-[11px] text-red-400 mt-1.5 font-medium ${className}`} {...props}>
      {children}
    </p>
  );
};
