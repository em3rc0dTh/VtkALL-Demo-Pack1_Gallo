import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { id: 'customer', label: 'Cliente' },
  { id: 'entity', label: 'Entidad' },
  { id: 'case', label: 'Caso' },
  { id: 'schedule', label: 'Agendar' },
  { id: 'done', label: 'Listo' }
];

export function FlowStepper({ currentStep }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border-subtle -z-10 -translate-y-1/2" />
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-surface-app px-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                isCompleted ? "bg-action-primary border-action-primary text-white" :
                isCurrent ? "bg-surface-panel border-action-primary text-action-primary" :
                "bg-surface-subtle border-border-default text-text-disabled"
              )}>
                {isCompleted ? <Check className="w-4 h-4" /> : (idx + 1)}
              </div>
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isCompleted || isCurrent ? "text-text-primary" : "text-text-disabled"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
