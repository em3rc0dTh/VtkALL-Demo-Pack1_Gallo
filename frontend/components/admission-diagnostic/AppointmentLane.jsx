import { EvaluationAppointmentCard } from './EvaluationAppointmentCard';
import { ServiceOperationCard } from './ServiceOperationCard';

export function AppointmentLane({ kind, items = [], onSelectItem }) {
  const isEvaluation = kind === 'evaluation';
  const label = isEvaluation ? 'Appointment Evaluation' : 'Appointment Service';
  
  return (
    <div className="flex flex-col mb-4 last:mb-0">
      {/* Titulo del Lane */}
      <div className="mb-2 px-1">
        <h4 className="text-[10px] font-black uppercase text-text-muted tracking-wider border-b border-border-subtle pb-1">
          {label}
        </h4>
      </div>

      {/* Contenedor de items */}
      <div className="flex flex-col gap-3 min-h-[120px] rounded-lg bg-surface-panel/30 border border-dashed border-border-subtle p-2">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs font-semibold text-text-muted text-center px-4">
              Sin citas
            </span>
          </div>
        ) : (
          items.map(item => {
            if (isEvaluation) {
              return (
                <EvaluationAppointmentCard 
                  key={item.id} 
                  item={item} 
                  onSelect={() => onSelectItem(item)} 
                />
              );
            } else {
              return (
                <ServiceOperationCard 
                  key={item.id} 
                  item={item} 
                  onSelect={() => onSelectItem(item)} 
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
}
