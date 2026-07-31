import { useState } from 'react';
import { FieldLabel, Input } from '@/components/ui/Input';
import { FactRow } from '@/components/shared/FactRow';
import { Button } from '@/components/ui/Button';

export function AvailabilityForm({
  offering,
  timezone,
  onDateChange,
  date,
  onSearch,
  isFetching
}) {
  if (!offering) return null;

  return (
    <div className="space-y-4">
      <div className="rounded border border-border-subtle bg-surface-subtle p-3 space-y-2">
        <h4 className="text-sm font-semibold">Parámetros Derivados</h4>
        <FactRow label="Equipo sugerido" value={offering.fulfillmentPolicy.suggestedTeamId} />
        <FactRow label="Duración (min)" value={offering.fulfillmentPolicy.estimatedDurationMinutes} />
        <FactRow label="Zona horaria" value={timezone} />
      </div>

      <div>
        <FieldLabel>Fecha de consulta *</FieldLabel>
        <div className="flex gap-2 items-center">
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => onDateChange(e.target.value)} 
            className="w-auto"
          />
          {isFetching && <span className="text-sm text-text-secondary ml-2">Consultando...</span>}
        </div>
      </div>
    </div>
  );
}
