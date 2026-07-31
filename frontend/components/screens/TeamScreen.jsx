'use client';

import { useEffect, useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { teamRepository } from '@/lib/team/teamRepository';

const ACTIVE_RESERVATION_STATUSES = new Set(['held', 'booked']);

const typeLabel = {
  frontdesk: 'Frontdesk',
  mechanics: 'Mecanica',
  detailing: 'Detailing',
  consultation: 'Consulta',
  bodywork: 'Carroceria',
  other: 'Otro',
};

const formatTimeRange = (startAt, endAt) => {
  if (!startAt || !endAt) return 'Sin horario';

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Horario invalido';
  }

  return `${start.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
  })} ${start.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const isCurrentReservation = (reservation, now) => {
  const start = new Date(reservation.startAt);
  const end = new Date(reservation.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return start <= now && now < end;
};

const buildRows = ({ teams, reservations }) => {
  const now = new Date();
  const activeReservations = reservations.filter((reservation) => (
    ACTIVE_RESERVATION_STATUSES.has(reservation.status)
  ));

  return teams.map((team) => {
    const teamReservations = activeReservations.filter((reservation) => reservation.teamId === team._id);
    const currentReservations = teamReservations.filter((reservation) => isCurrentReservation(reservation, now));
    const upcomingReservations = teamReservations
      .filter((reservation) => new Date(reservation.startAt) > now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    const capacity = Number(team.capacity) || 1;
    const usedUnits = currentReservations.reduce((total, reservation) => {
      return total + (Number(reservation.requiredUnits) || 1);
    }, 0);
    const nextReservation = currentReservations[0] || upcomingReservations[0] || null;

    let status = 'Disponible';
    let statusColor = 'VERDE';
    if (usedUnits >= capacity) {
      status = 'Lleno';
      statusColor = 'ROJO';
    } else if (usedUnits > 0) {
      status = 'Parcial';
      statusColor = 'AMARILLO';
    }

    return {
      id: team._id,
      name: team.name,
      type: typeLabel[team.type] || team.type || 'Sin tipo',
      status,
      statusColor,
      capacityLabel: `${Math.min(usedUnits, capacity)} / ${capacity}`,
      granularity: `${team.slotGranularityMinutes || 15} min`,
      activeReservation: nextReservation
        ? `${nextReservation.appointmentId || nextReservation.caseId || nextReservation._id} · ${formatTimeRange(nextReservation.startAt, nextReservation.endAt)}`
        : 'N/A',
    };
  });
};

export function TeamScreen() {
  const { profile } = useBusinessProfile();
  const [teams, setTeams] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamData() {
      if (!profile?.businessSlug) return;

      setLoading(true);
      setError(null);

      try {
        const [teamResult, reservationResult] = await Promise.all([
          teamRepository.getWorkTeams({ businessSlug: profile.businessSlug }),
          teamRepository.getResourceReservations({ businessSlug: profile.businessSlug }),
        ]);

        if (!cancelled) {
          setTeams(teamResult.data);
          setReservations(reservationResult.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setTeams([]);
          setReservations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeamData();

    return () => {
      cancelled = true;
    };
  }, [profile?.businessSlug]);

  const rows = useMemo(() => buildRows({ teams, reservations }), [teams, reservations]);

  const columns = useMemo(
    () => [
      {
        header: 'Equipo',
        accessorKey: 'name',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <div className="font-bold text-text-primary">{item.name}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase text-text-muted">{item.type}</div>
            </div>
          );
        },
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: ({ row }) => {
          const item = row.original;
          const colorMap = {
            VERDE: 'bg-emerald-500',
            AMARILLO: 'bg-amber-500',
            ROJO: 'bg-rose-500',
          };

          return (
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${colorMap[item.statusColor] || 'bg-slate-400'}`} />
              <span className="text-xs font-semibold text-text-primary">{item.status}</span>
            </div>
          );
        },
      },
      {
        header: 'Capacidad',
        accessorKey: 'capacityLabel',
        cell: ({ row }) => (
          <Badge
            estado={row.original.capacityLabel}
            variant={row.original.statusColor === 'ROJO'
              ? 'danger'
              : row.original.statusColor === 'AMARILLO'
                ? 'warning'
                : 'success'}
          />
        ),
      },
      {
        header: 'Reserva activa o proxima',
        accessorKey: 'activeReservation',
        cell: ({ getValue }) => {
          const value = getValue();
          return value === 'N/A' ? (
            <span className="text-xs italic text-text-muted">Sin reserva activa</span>
          ) : (
            <span className="text-xs font-semibold text-text-primary">{value}</span>
          );
        },
      },
      {
        header: 'Granularidad',
        accessorKey: 'granularity',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-text-secondary">{getValue()}</span>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
        Cargando equipos desde la base de datos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border-danger bg-surface-danger p-4">
        <div className="text-sm font-semibold text-text-danger">No se pudo cargar Personal y Equipos desde la API.</div>
        <div className="mt-1 text-xs text-text-danger">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex w-fit flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-xs font-semibold text-text-secondary shadow-sm">
        <span className="text-[9px] font-black uppercase text-text-muted">Disponibilidad de equipos:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Capacidad parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>Capacidad llena</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
          No hay WorkTeams activos en la base de datos para <span className="font-semibold text-text-primary">{profile.businessSlug}</span>.
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
}
