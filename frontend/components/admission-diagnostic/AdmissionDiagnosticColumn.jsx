import { AppointmentLane } from './AppointmentLane';

export function AdmissionDiagnosticColumn({ stage, title, icon: Icon, colorClass, borderColor, items, onSelectItem }) {
  // items expected: { evaluation: [...], service: [...] }

  return (
    <div className="flex flex-col flex-1 min-w-[220px] shrink-0 rounded-xl bg-surface-sidebar p-2.5 border border-border-subtle h-full">
      {/* Column Header */}
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${borderColor || 'border-border-default'}`}>
        {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
        <h3 className={`text-xs font-bold uppercase tracking-wider ${colorClass || 'text-text-primary'}`}>
          {title}
        </h3>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <AppointmentLane 
          kind="evaluation" 
          items={items.evaluation} 
          onSelectItem={onSelectItem} 
        />
        
        <AppointmentLane 
          kind="service" 
          items={items.service} 
          onSelectItem={onSelectItem} 
        />
      </div>
    </div>
  );
}
