'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import {
  adminEmptyData,
  appointmentForCase,
  caseLabel,
  customerName,
  formatDateTime,
  indexById,
  isConcreteOperationalCaseRecord,
  isOperationalReservationRecord,
  managedEntityLabel,
  offeringName,
  reservationForCase,
  variantForStatus,
} from '@/lib/admin/adminMappers';
import { statusLabel } from '@/lib/admin/statusPresentation';

const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DashboardScreen() {
  const { data = adminEmptyData, loading, error } = useAdminData();
  const cases = useMemo(() => data?.cases || [], [data?.cases]);
  const appointments = useMemo(() => data?.appointments || [], [data?.appointments]);
  const customersById = useMemo(() => indexById(data?.customers || []), [data?.customers]);
  const managedEntitiesById = useMemo(() => indexById(data?.managedEntities || []), [data?.managedEntities]);
  const offeringsById = useMemo(() => indexById(data?.catalogOfferings || []), [data?.catalogOfferings]);
  const reservations = useMemo(() => data?.resourceReservations || [], [data?.resourceReservations]);
  const notifications = data?.notifications || [];

  const operationalCases = useMemo(() => cases.filter((caseItem) => {
    const appointment = appointmentForCase(appointments, caseItem._id);
    const reservation = reservationForCase(reservations, caseItem._id, appointment?._id);
    const customer = customersById.get(caseItem.customerId);
    const entity = managedEntitiesById.get(caseItem.managedEntityId);

    return isConcreteOperationalCaseRecord({ caseItem, customer, entity, appointment, reservation });
  }), [appointments, cases, customersById, managedEntitiesById, reservations]);

  const operationalReservations = useMemo(() => reservations.filter((reservation) => {
    const appointment = appointments.find((item) => item._id === reservation.appointmentId);
    const caseItem = cases.find((item) => item._id === (reservation.caseId || appointment?.caseId));
    const customer = customersById.get(caseItem?.customerId || appointment?.customerId);
    const entity = managedEntitiesById.get(caseItem?.managedEntityId || appointment?.managedEntityId);

    return isOperationalReservationRecord({ reservation, caseItem, customer, entity, appointment });
  }), [appointments, cases, customersById, managedEntitiesById, reservations]);

  const rows = useMemo(() => operationalCases.slice(0, 20).map((caseItem) => {
    const appointment = appointmentForCase(appointments, caseItem._id);
    const reservation = reservationForCase(reservations, caseItem._id, appointment?._id);
    const customer = customersById.get(caseItem.customerId);
    const entity = managedEntitiesById.get(caseItem.managedEntityId);
    const offering = offeringsById.get(appointment?.catalogOfferingId || caseItem.catalogOfferingId);

    return {
      id: caseLabel(caseItem),
      serviceType: offeringName(offering),
      entity: managedEntityLabel(entity),
      customer: customerName(customer),
      status: caseItem.status || 'Sin estado',
      variant: variantForStatus(caseItem.status),
      startAt: appointment?.startAt || reservation?.startAt,
    };
  }), [appointments, customersById, managedEntitiesById, offeringsById, operationalCases, reservations]);

  const today = todayKey();
  const todaysAppointments = appointments.filter((appointment) => {
    if (!appointment.startAt || String(appointment.startAt).slice(0, 10) !== today) return false;

    const caseItem = cases.find((item) => item._id === appointment.caseId);
    const reservation = reservationForCase(reservations, caseItem?._id, appointment._id);
    const customer = customersById.get(caseItem?.customerId || appointment.customerId);
    const entity = managedEntitiesById.get(caseItem?.managedEntityId || appointment.managedEntityId);

    return isConcreteOperationalCaseRecord({ caseItem, customer, entity, appointment, reservation });
  });

  const columns = useMemo(
    () => [
      {
        header: 'Case',
        accessorKey: 'id',
        cell: ({ getValue }) => <span className="font-bold text-text-primary text-xs">{getValue()}</span>,
      },
      {
        header: 'Servicio',
        accessorKey: 'serviceType',
        cell: ({ getValue }) => <span className="font-semibold text-text-secondary text-xs">{getValue()}</span>,
      },
      {
        header: 'Entidad',
        accessorKey: 'entity',
        cell: ({ getValue }) => <span className="text-text-primary text-xs">{getValue()}</span>,
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: ({ row }) => <Badge estado={row.original.status} variant={row.original.variant} />,
      },
    ],
    []
  );

  if (loading) {
    return <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">Cargando dashboard desde backend...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-border-danger bg-surface-danger p-4 text-sm font-semibold text-text-danger">{error.message}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-0 w-full overflow-hidden gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-panel p-2 shrink-0">
        <div className="flex gap-1">
          {['Hoy', 'Manana', 'Semana'].map((view, index) => (
            <Button key={view} size="sm" variant={index === 0 ? 'primary' : 'ghost'}>{view}</Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <StatusLegend />
          <Button size="sm" variant="outline">Actualizar</Button>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Fuente: backend v3</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_0.8fr_0.8fr] gap-3 min-h-0">
        <div className="flex flex-col gap-3 min-h-0 h-full">
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <MetricBox label="Citas hoy" value={todaysAppointments.length} tone="emerald" />
            <MetricBox label="Reservas activas" value={operationalReservations.length} tone="sky" />
            <MetricBox label="Cases abiertos" value={operationalCases.length} tone="amber" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col bg-surface-panel rounded-xl border border-border-subtle p-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
              <h3 className="text-xs font-black uppercase text-text-primary">Cases operacionales</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {rows.length ? <DataTable columns={columns} data={rows} /> : <EmptyState text="No hay cases operacionales." />}
            </div>
          </div>
        </div>

        <Panel title="Cupos / reservas">
          {operationalReservations.slice(0, 8).map((reservation) => (
            <div key={reservation._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-text-primary">{formatDateTime(reservation.startAt)}</div>
                  <div className="text-[10px] text-text-secondary mt-0.5">{reservation.teamId} · {reservation.durationMinutes}m</div>
                </div>
              </div>
              <Badge estado={reservation.status} variant={variantForStatus(reservation.status)} />
            </div>
          ))}
          {!operationalReservations.length && <EmptyState text="Sin reservas activas." />}
        </Panel>

        <Panel title="Notificaciones">
          {notifications.slice(0, 8).map((notification) => (
            <div key={notification._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <div className="text-xs font-bold text-text-primary">{notification.title || notification.type || notification._id}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">{statusLabel(notification.status || 'Sin estado')}</div>
              </div>
              <Badge estado={notification.status || 'info'} variant={variantForStatus(notification.status)} />
            </div>
          ))}
          {!notifications.length && <EmptyState text="Sin notificaciones en backend." />}
        </Panel>
      </div>
    </div>
  );
}

function StatusLegend() {
  const items = [
    { label: 'Confirmado / reservado', dot: 'bg-status-success' },
    { label: 'Pendiente', dot: 'bg-status-warning' },
    { label: 'En proceso', dot: 'bg-status-info' },
    { label: 'Cancelado / error', dot: 'bg-status-danger' },
  ];

  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex" aria-label="Leyenda de estados">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted">
          <span className={`h-2 w-2 rounded-full ${item.dot}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function MetricBox({ label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-500 text-emerald-500',
    sky: 'bg-sky-500 text-sky-500',
    amber: 'bg-amber-500 text-amber-500',
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-panel p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">{label}</span>
        <span className={`h-2 w-2 rounded-full ${tones[tone]?.split(' ')[0] || 'bg-slate-400'}`} />
      </div>
      <div className="text-3xl font-bold text-text-primary mt-2">{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border border-border-subtle bg-surface-panel p-3">
      <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2 mb-3">
        <h3 className="font-bold text-text-primary text-xs uppercase">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 divide-y divide-border-subtle/50 custom-scrollbar">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3 text-xs font-semibold text-text-muted">{text}</div>;
}
