import Badge from '@/components/ui/Badge';

export function IntakeProgress({ steps, activeStepId }) {
  const activeIndex = steps.findIndex(s => s.id === activeStepId);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {steps.map((step, index) => {
        let state = 'Pendiente';
        let variant = 'neutral';
        
        if (index < activeIndex) {
          state = 'Completado';
          variant = 'success';
        } else if (index === activeIndex) {
          state = 'Activo';
          variant = 'info';
        }

        return (
          <div 
            key={step.id} 
            className={`rounded-lg border p-3 text-center ${
              index === activeIndex 
                ? 'border-action-primary bg-action-primary/5' 
                : 'border-border-subtle bg-surface-subtle opacity-70'
            }`}
          >
            <Badge estado={state} variant={variant} />
            <div className="mt-2 text-xs font-bold text-text-primary">
              {index + 1}. {step.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
