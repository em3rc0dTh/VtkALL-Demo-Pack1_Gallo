import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const errorCopy = {
  DOUBLE_BOOKING_CONFLICT: {
    title: 'El horario fue tomado',
    message: 'El backend detecto que la capacidad ya esta bloqueada. Actualiza disponibilidad y selecciona otro horario.',
  },
  NO_AVAILABILITY: {
    title: 'Horario no disponible',
    message: 'El horario seleccionado esta fuera de la agenda valida o ya no es elegible.',
  },
  IDEMPOTENCY_CONFLICT: {
    title: 'Conflicto de idempotencia',
    message: 'La misma key se reutilizo para datos distintos. No se reintenta automaticamente.',
  },
  COMMAND_IN_PROGRESS: {
    title: 'Comando en proceso',
    message: 'La operacion sigue protegida por lease. Reintenta manualmente con la misma key en unos segundos.',
  },
  IDEMPOTENCY_KEY_REQUIRED: {
    title: 'Falta Idempotency-Key',
    message: 'Esto indica un defecto de integracion frontend en modo API.',
  },
};

export function AppointmentError({ error, onRefreshAvailability, onRetrySameKey }) {
  if (!error) return null;
  const copy = errorCopy[error.code] || {
    title: error.code || 'Error tecnico',
    message: error.message || 'No se pudo completar el agendamiento.',
  };
  const isCapacityError = error.code === 'DOUBLE_BOOKING_CONFLICT' || error.code === 'NO_AVAILABILITY';

  return (
    <Card className="border-border-danger">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-text-secondary">{copy.message}</p>
        <div className="rounded border border-border-danger bg-surface-danger p-3 text-sm text-text-danger">
          <div className="font-semibold">{error.code}</div>
          <div>{error.message}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCapacityError && (
            <Button variant="secondary" onClick={onRefreshAvailability}>
              Actualizar disponibilidad
            </Button>
          )}
          {error.code === 'COMMAND_IN_PROGRESS' && (
            <Button variant="secondary" onClick={onRetrySameKey}>
              Reintentar misma key
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
