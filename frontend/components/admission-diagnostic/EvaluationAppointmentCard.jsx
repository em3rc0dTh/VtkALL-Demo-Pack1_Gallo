import { ClipboardCheck, Calendar } from 'lucide-react';
import { OperationalAppointmentCard } from './OperationalAppointmentCard';
import Badge from '@/components/ui/Badge';

export function EvaluationAppointmentCard({ item, onSelect }) {
  const isScheduled = !!item.schedule?.startAt;
  const isConfirmed = item.confirmationStatus === 'confirmed_by_customer' || item.confirmationStatus === 'confirmed';
  const indicatorClass = isConfirmed ? 'bg-emerald-500' : 'bg-slate-400';
  
  // Header con estilo especifico para Evaluation sin badge
  const headerContent = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-status-info">
        <ClipboardCheck className="h-4 w-4" />
        <span className="text-xs font-black uppercase">Evaluation</span>
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
        <div className="flex items-start gap-1">
          <Calendar className="mt-0.5 h-3.5 w-3.5 text-text-muted" />
          {isScheduled ? (
            <span>{new Date(item.schedule.startAt).toLocaleString()}</span>
          ) : (
            <span className="text-text-muted italic">Sin agendar</span>
          )}
        </div>
        <div className="mt-1">Modo: {item.evaluation?.mode || 'Presencial'}</div>
        <div className="mt-1">Equipo: {item.assignment?.teamName || 'Sin asignar'}</div>
      </div>
    </OperationalAppointmentCard>
  );
}
