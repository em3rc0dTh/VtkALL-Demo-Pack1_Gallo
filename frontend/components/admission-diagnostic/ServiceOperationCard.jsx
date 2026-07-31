import { Wrench, Clock } from 'lucide-react';
import { OperationalAppointmentCard } from './OperationalAppointmentCard';
import Badge from '@/components/ui/Badge';

export function ServiceOperationCard({ item, onSelect }) {
  const isScheduled = !!item.schedule?.startAt;
  
  const isSuccess = item.operationalStatus === 'assigned' || item.operationalStatus === 'executed';
  const indicatorClass = isSuccess ? 'bg-emerald-500' : 'bg-orange-500';
  
  // Header con estilo especifico para Service sin badge
  const headerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-status-warning">
        <Wrench className="h-4 w-4" />
        <span className="text-xs font-black uppercase">Service</span>
      </div>
    </div>
  );

  return (
    <OperationalAppointmentCard 
      item={item} 
      onSelect={onSelect} 
      headerContent={headerContent}
      indicatorClass={indicatorClass}
    >
      <div className="text-xs font-semibold text-text-secondary">
        <div className="mb-1 font-bold text-text-primary">
          {item.offering?.name || 'Servicio no especificado'}
        </div>
        
        <div className="mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3 text-text-muted" />
          <span>{item.durationMinutes ? `${item.durationMinutes} min` : 'Duración TBD'}</span>
        </div>
        
        <div className="mt-1">
          Equipo: {item.assignment?.teamName || 'Sin asignar'}
          {item.assignment?.workerName ? ` (${item.assignment.workerName})` : ''}
        </div>
        
        <div className="mt-1">
          {isScheduled ? (
             <span>Prog: {new Date(item.schedule.startAt).toLocaleString()}</span>
          ) : (
             <span className="text-text-muted italic">Sin programar</span>
          )}
        </div>
      </div>
    </OperationalAppointmentCard>
  );
}
