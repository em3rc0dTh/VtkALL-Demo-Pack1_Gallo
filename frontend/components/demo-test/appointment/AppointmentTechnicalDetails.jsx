import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FactRow } from '@/components/shared/FactRow';

export function AppointmentTechnicalDetails({ appointment, reservation, executionContext, idempotencyKey }) {
  if (!appointment && !reservation && !executionContext && !idempotencyKey) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles tecnicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <FactRow label="Appointment ID" value={appointment?._id || 'none'} />
        <FactRow label="ResourceReservation ID" value={reservation?._id || appointment?.resourceReservationId || 'none'} />
        <FactRow label="teamId" value={reservation?.teamId || 'none'} />
        <FactRow label="reservation status" value={reservation?.status || 'none'} />
        <FactRow label="Idempotency-Key" value={executionContext?.idempotencyKey || idempotencyKey || 'none'} />
        <FactRow label="correlationId" value={executionContext?.correlationId || 'none'} />
        <FactRow label="causationId" value={executionContext?.causationId || 'none'} />
      </CardContent>
    </Card>
  );
}
