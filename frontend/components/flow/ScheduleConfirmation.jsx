import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, Calendar } from 'lucide-react';

export function ScheduleConfirmation({ appointment, reservation, onFinish }) {
  if (!appointment || !reservation) return null;

  const start = new Date(appointment.scheduledStart).toLocaleString();
  const end = new Date(appointment.scheduledEnd).toLocaleString();

  return (
    <Card className="w-full max-w-2xl mx-auto border-status-success/30">
      <CardHeader className="bg-status-success-soft/50 rounded-t-xl pb-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <CheckCircle2 className="w-12 h-12 text-status-success" />
          <CardTitle className="text-xl">¡Agendamiento Exitoso!</CardTitle>
          <p className="text-sm text-text-secondary">El Appointment fue creado y la ResourceReservation confirmada.</p>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface-subtle border border-border-subtle">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Appointment (Customer Facing)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">ID:</span>
                <span className="font-mono text-xs">{appointment._id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Estado:</span>
                <Badge estado={appointment.status} variant="info" />
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Inicio:</span>
                <span className="font-medium">{start}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border-subtle">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Resource Reservation (Backend)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">ID:</span>
                <span className="font-mono text-xs">{reservation._id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Estado:</span>
                <Badge estado={reservation.status} variant="success" />
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fin:</span>
                <span className="font-medium">{end}</span>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onFinish} className="w-full" size="lg" icon={Calendar}>
          Ver Timeline del Caso
        </Button>
      </CardContent>
    </Card>
  );
}
