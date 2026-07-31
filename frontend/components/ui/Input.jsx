import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(({ className = '', error, readOnly, disabled, ...props }, ref) => {
  return (
    <input
      className={cn(
        "w-full rounded-lg px-4 py-2.5 text-base transition-all outline-none sm:text-sm",
        "placeholder:text-text-disabled",
        readOnly || disabled 
          ? "bg-surface-subtle border border-border-subtle text-text-muted cursor-not-allowed" 
          : "bg-surface-panel text-text-primary",
        !readOnly && !disabled && !error && "border border-border-default focus:border-focus-ring focus:ring-1 focus:ring-focus-ring",
        error && "border border-status-danger focus:ring-1 focus:ring-status-danger bg-status-danger-soft/30",
        className
      )}
      ref={ref}
      readOnly={readOnly}
      disabled={disabled}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className = '', error, readOnly, disabled, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg px-4 py-2.5 text-base transition-all outline-none min-h-[80px] resize-y sm:text-sm",
        "placeholder:text-text-disabled",
        readOnly || disabled 
          ? "bg-surface-subtle border border-border-subtle text-text-muted cursor-not-allowed" 
          : "bg-surface-panel text-text-primary",
        !readOnly && !disabled && !error && "border border-border-default focus:border-focus-ring focus:ring-1 focus:ring-focus-ring",
        error && "border border-status-danger focus:ring-1 focus:ring-status-danger bg-status-danger-soft/30",
        className
      )}
      ref={ref}
      readOnly={readOnly}
      disabled={disabled}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className = '', error, readOnly, disabled, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "w-full rounded-lg px-4 py-2.5 text-base transition-all outline-none sm:text-sm",
        readOnly || disabled 
          ? "bg-surface-subtle border border-border-subtle text-text-muted cursor-not-allowed" 
          : "bg-surface-panel text-text-primary",
        !readOnly && !disabled && !error && "border border-border-default focus:border-focus-ring focus:ring-1 focus:ring-focus-ring",
        error && "border border-status-danger focus:ring-1 focus:ring-status-danger bg-status-danger-soft/30",
        className
      )}
      ref={ref}
      disabled={disabled || readOnly} // Select generally uses disabled for readonly
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

export const FieldLabel = ({ className = '', children, ...props }) => (
  <label className={cn("mb-1.5 block text-sm font-semibold uppercase tracking-wide text-text-secondary", className)} {...props}>
    {children}
  </label>
);

export const FieldHint = ({ className = '', children, ...props }) => (
  <p className={cn("mt-1.5 text-[13px] text-text-muted", className)} {...props}>
    {children}
  </p>
);

export const FieldError = ({ className = '', children, ...props }) => {
  if (!children) return null;
  return (
    <p className={cn("mt-1.5 text-[13px] font-medium text-status-danger", className)} {...props}>
      {children}
    </p>
  );
};
