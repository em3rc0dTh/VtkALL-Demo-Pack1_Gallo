import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const TableWrapper = forwardRef(({ className = '', children, ...props }, ref) => (
  <div className="w-full overflow-auto rounded-xl border border-border-subtle bg-surface-panel shadow-sm">
    <table ref={ref} className={cn("w-full text-sm text-left", className)} {...props}>
      {children}
    </table>
  </div>
));
TableWrapper.displayName = 'TableWrapper';

export const TableHeader = forwardRef(({ className = '', children, ...props }, ref) => (
  <thead ref={ref} className={cn("text-xs text-text-secondary uppercase bg-surface-subtle border-b border-border-subtle tracking-wider font-semibold", className)} {...props}>
    <tr>
      {children}
    </tr>
  </thead>
));
TableHeader.displayName = 'TableHeader';

export const TableRow = forwardRef(({ className = '', children, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-border-subtle hover:bg-hover-row transition-colors", className)} {...props}>
    {children}
  </tr>
));
TableRow.displayName = 'TableRow';

export const TableCell = forwardRef(({ className = '', isHeader = false, children, ...props }, ref) => {
  const Tag = isHeader ? 'th' : 'td';
  const baseClass = isHeader ? 'px-4 py-3 font-semibold text-text-primary' : 'px-4 py-3 font-medium text-text-secondary';
  return (
    <Tag ref={ref} className={cn(baseClass, className)} {...props}>
      {children}
    </Tag>
  );
});
TableCell.displayName = 'TableCell';
