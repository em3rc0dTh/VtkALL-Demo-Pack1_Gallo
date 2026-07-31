import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalendarCheck2 } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return 'pendiente';
  return new Date(value).toLocaleString();
};

export function AppointmentSuccess({ appointment, reservation, onViewTimeline }) {
  if (!appointment) return null;

  return (
    <Card className="border-status-success/40">
      <CardHeader>
        <CardTitle>
          <CalendarCheck2 className="h-4 w-4 text-status-success" />
          Cita confirmada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
            <div className="mb-2 text-xs font-bold uppercase text-text-secondary">Appointment</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">ID</span>
                <span className="font-mono text-xs text-text-primary">{appointment._id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Inicio</span>
                <span className="font-medium text-text-primary">{formatDateTime(appointment.scheduledStart)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Fin</span>
                <span className="font-medium text-text-primary">{formatDateTime(appointment.scheduledEnd)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Estado</span>
                <Badge estado={appointment.status || 'scheduled'} variant="success" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
            <div className="mb-2 text-xs font-bold uppercase text-text-secondary">Verificacion operativa</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Reservation ID</span>
                <span className="font-mono text-xs text-text-primary">{reservation?._id || appointment.resourceReservationId}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Equipo</span>
                <span className="font-medium text-text-primary">{reservation?.teamId || 'none'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Estado</span>
                <Badge estado={reservation?.status || 'booked'} variant="info" />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onViewTimeline} variant="secondary">
          Refrescar timeline del caso
        </Button>
      </CardContent>
    </Card>
  );
}
