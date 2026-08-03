import Badge from '@/components/ui/Badge';

export function OperationalAppointmentCard({ 
  item, 
  onSelect,
  headerContent,
  indicatorClass,
  children 
}) {
  return (
    <div 
      onClick={onSelect}
      className="relative cursor-pointer rounded-lg border border-border-subtle bg-surface-panel p-2.5 pl-3.5 text-left hover:border-border-default hover:bg-hover-row transition-colors overflow-hidden"
    >
      {/* Indicador de estado visual (borde izquierdo) */}
      {indicatorClass && (
        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${indicatorClass}`} />
      )}
      
      {/* Header section injected by specific cards (Icon, etc.) */}
      <div className="mb-2">
        {headerContent}
      </div>
      
      {/* Shared common info */}
      <div className="mt-2 space-y-1">
        <div className="text-sm font-black text-text-primary">
          {item.customer?.name}
        </div>
        <div className="text-sm font-semibold text-text-secondary">
          {item.managedEntity?.displayName}
        </div>
        <div className="text-xs text-text-muted">
          {item.managedEntity?.secondaryLabel}
        </div>
      </div>
      
      {/* Specific content for Evaluation or Service */}
      <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
        {children}
      </div>
      
      {/* Case Number Footer */}
      <div className="mt-3 text-xs font-bold text-text-muted flex items-center justify-between">
        <span>CASE {item.caseNumber}</span>
      </div>
    </div>
  );
}
