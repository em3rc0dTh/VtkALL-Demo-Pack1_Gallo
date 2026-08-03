'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wrench, CheckCircle2, Clock } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import {
  adminEmptyData,
  currentReservationsForTeam,
  formatDateTime,
  indexById,
  managedEntityLabel,
  reservationsForTeam,
  variantForStatus,
} from '@/lib/admin/adminMappers';
import Badge from '@/components/ui/Badge';

export function ExecutionScreen() {
  const { data = adminEmptyData, loading, error } = useAdminData();
  const casesById = useMemo(() => indexById(data?.cases || []), [data?.cases]);
  const entitiesById = useMemo(() => indexById(data?.managedEntities || []), [data?.managedEntities]);

  const pendingReservations = useMemo(() => (data?.resourceReservations || [])
    .filter((reservation) => reservation.status === 'held')
    .slice(0, 20), [data?.resourceReservations]);

  if (loading) return <StateBox>Cargando bahias/equipos desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex gap-3 h-[calc(100vh-120px)] min-h-0 w-full overflow-hidden">
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-panel p-3 w-[280px] shrink-0 h-full overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <h3 className="font-bold text-text-primary text-xs uppercase">Reservas held</h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {pendingReservations.map((reservation) => {
            const caseItem = casesById.get(reservation.caseId);
            const entity = entitiesById.get(caseItem?.managedEntityId);
            return (
              <div key={reservation._id} className="p-2.5 rounded-lg border border-border-subtle bg-surface-sidebar">
                <div className="flex items-center justify-between">
                  <span className="font-black text-text-primary text-[10px] bg-surface-panel px-1.5 py-0.5 rounded border border-border-subtle">{reservation._id}</span>
                  <Badge estado={reservation.status} variant={variantForStatus(reservation.status)} />
                </div>
                <div className="text-xs font-bold text-text-secondary mt-1.5">{managedEntityLabel(entity)}</div>
                <div className="text-[9px] text-amber-500 font-semibold mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDateTime(reservation.startAt)}
                </div>
              </div>
            );
          })}
          {!pendingReservations.length && <StateBox>Sin reservas held.</StateBox>}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto h-full pr-1 custom-scrollbar align-start content-start">
        {(data?.workTeams || []).map((team) => {
          const teamReservations = reservationsForTeam(data?.resourceReservations || [], team._id);
          const current = currentReservationsForTeam(data?.resourceReservations || [], team._id);
          const capacity = Number(team.capacity) || 1;
          return (
            <Card key={team._id} className="h-fit">
              <CardHeader className="flex-row items-center gap-2 border-b border-border-subtle py-3">
                <Wrench className="h-4 w-4 text-text-muted" />
                <CardTitle>{team.name} ({current.length}/{capacity})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 p-3">
                {teamReservations.slice(0, capacity || 1).map((reservation) => {
                  const caseItem = casesById.get(reservation.caseId);
                  const entity = entitiesById.get(caseItem?.managedEntityId);
                  return (
                    <div key={reservation._id} className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
                      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-1.5 mb-2">
                        <span className="font-bold text-text-primary text-xs">{reservation._id}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="font-black text-xs text-text-primary">{managedEntityLabel(entity)}</div>
                      <div className="text-[9px] text-text-secondary flex items-center gap-1 pt-1">
                        <Clock className="h-3 w-3 text-text-muted" /> {formatDateTime(reservation.startAt)}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-border-subtle/30 flex justify-end">
                        <Button size="xs" variant="outline" className="w-full">Detalles</Button>
                      </div>
                    </div>
                  );
                })}
                {teamReservations.length < capacity && (
                  <div className="rounded-lg border border-border-subtle bg-surface-sidebar/50 border-dashed p-3 min-h-[90px] flex items-center justify-center text-xs text-text-muted italic">
                    Capacidad disponible
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!(data?.workTeams || []).length && <StateBox>No hay WorkTeams activos en backend.</StateBox>}
      </div>
    </div>
  );
}

function StateBox({ children, danger }) {
  return (
    <div className={`rounded-lg border p-4 text-sm font-semibold ${danger ? 'border-border-danger bg-surface-danger text-text-danger' : 'border-border-subtle bg-surface-panel text-text-secondary'}`}>
      {children}
    </div>
  );
}
