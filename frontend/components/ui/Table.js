import { forwardRef } from 'react';

export const TableWrapper = forwardRef(({ className = '', children, ...props }, ref) => (
  <div className="w-full overflow-auto rounded-xl border border-gray-700/50 bg-dark-card/30 backdrop-blur-sm">
    <table ref={ref} className={`w-full text-sm text-left ${className}`} {...props}>
      {children}
    </table>
  </div>
));
TableWrapper.displayName = 'TableWrapper';

export const TableHeader = forwardRef(({ className = '', children, ...props }, ref) => (
  <thead ref={ref} className={`text-xs text-gray-400 uppercase bg-gray-900/50 border-b border-gray-700/50 tracking-wider font-semibold ${className}`} {...props}>
    <tr>
      {children}
    </tr>
  </thead>
));
TableHeader.displayName = 'TableHeader';

export const TableRow = forwardRef(({ className = '', children, ...props }, ref) => (
  <tr ref={ref} className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${className}`} {...props}>
    {children}
  </tr>
));
TableRow.displayName = 'TableRow';

export const TableCell = forwardRef(({ className = '', isHeader = false, children, ...props }, ref) => {
  const Tag = isHeader ? 'th' : 'td';
  const baseClass = isHeader ? 'px-4 py-3 font-semibold' : 'px-4 py-3 font-medium text-gray-200';
  return (
    <Tag ref={ref} className={`${baseClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
});
TableCell.displayName = 'TableCell';
