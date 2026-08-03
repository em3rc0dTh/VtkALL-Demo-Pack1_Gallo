'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FactRow } from '@/components/shared/FactRow';
import { useAdminData } from '@/hooks/useAdminData';
import {
  adminEmptyData,
  appointmentForCase,
  caseLabel,
  customerName,
  customerPhone,
  displayText,
  formatDateTime,
  indexById,
  isConcreteOperationalCaseRecord,
  managedEntityLabel,
  managedEntitySecondary,
  offeringName,
  reservationForCase,
  variantForStatus,
} from '@/lib/admin/adminMappers';
import { statusLabel } from '@/lib/admin/statusPresentation';

const PAGE_SIZE = 10;

export function OrdersScreen() {
  const { data = adminEmptyData, loading, error } = useAdminData();
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [showDetailMobile, setShowDetailMobile] = useState(false);

  const customersById = useMemo(() => indexById(data?.customers || []), [data?.customers]);
  const entitiesById = useMemo(() => indexById(data?.managedEntities || []), [data?.managedEntities]);
  const offeringsById = useMemo(() => indexById(data?.catalogOfferings || []), [data?.catalogOfferings]);

  const orders = useMemo(() => (data?.cases || []).map((caseItem) => {
    const customer = customersById.get(caseItem.customerId);
    const entity = entitiesById.get(caseItem.managedEntityId);
    const appointment = appointmentForCase(data?.appointments || [], caseItem._id);
    const reservation = reservationForCase(data?.resourceReservations || [], caseItem._id, appointment?._id);
    const offering = offeringsById.get(appointment?.catalogOfferingId || reservation?.catalogOfferingId || caseItem.catalogOfferingId);

    if (!isConcreteOperationalCaseRecord({ caseItem, customer, entity, appointment, reservation })) {
      return null;
    }

    return {
      id: caseItem._id,
      label: caseLabel(caseItem),
      customer: customerName(customer),
      phone: customerPhone(customer),
      entity: managedEntityLabel(entity),
      secondary: managedEntitySecondary(entity),
      status: caseItem.status || 'Sin estado',
      variant: variantForStatus(caseItem.status),
      service: offeringName(offering),
      appointment,
      reservation,
      createdAt: caseItem.createdAt,
      customerId: caseItem.customerId,
    };
  }).filter(Boolean), [customersById, data?.appointments, data?.cases, data?.resourceReservations, entitiesById, offeringsById]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = orders.length ? (safePage - 1) * PAGE_SIZE : 0;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, orders.length);
  const visibleOrders = orders.slice(pageStart, pageEnd);
  const selected = orders.find((order) => order.id === selectedId) || visibleOrders[0] || orders[0];

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    if (selectedId && orders.some((order) => order.id === selectedId)) return;
    setSelectedId(orders[0]?.id || null);
  }, [orders, selectedId]);

  if (loading) return <StateBox>Cargando ordenes desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-surface-panel p-3">
        {['Estado: todos', 'Fecha: todas', 'Etapa: orden', 'Responsable: sin asignar'].map((filter) => (
          <span key={filter} className="rounded-md border border-border-default bg-surface-subtle px-3 py-2 text-xs font-semibold text-text-secondary">{filter}</span>
        ))}
        <Button size="sm" icon={RefreshCw}>Refrescar</Button>
      </div>

      {!orders.length ? (
        <StateBox>No hay ordenes operacionales para mostrar.</StateBox>
      ) : (
        <div className="min-h-0 flex-1 grid grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[0.95fr_1.55fr]">
          <Card className={`${showDetailMobile ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col overflow-hidden`}>
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Lista de ordenes</CardTitle>
                <span className="text-xs font-semibold text-text-muted">
                  Mostrando {pageStart + 1}-{pageEnd} de {orders.length} ordenes
                </span>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
              {visibleOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedId(order.id);
                    setShowDetailMobile(true);
                  }}
                  className={`rounded-lg border p-3 text-left hover:bg-hover-row ${selected?.id === order.id ? 'border-action-primary bg-action-primary/5' : 'border-border-subtle bg-surface-panel'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-bold text-text-primary">{order.customer}</span>
                    <span className="font-mono text-xs text-text-muted">{order.label}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{order.entity} - Vehiculo</p>
                  <p className="mt-1 text-xs text-text-muted">{order.secondary}</p>
                  <div className="mt-3"><Badge estado={order.status} variant={order.variant} /></div>
                </button>
              ))}
            </CardContent>
            <div className="sticky bottom-0 shrink-0 border-t border-border-subtle bg-surface-panel/95 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text-muted">Pagina {safePage} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className={`${showDetailMobile ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col overflow-hidden`}>
            <CardHeader className="shrink-0 flex-row items-start justify-between gap-4">
              <div>
                <Button className="mb-3 lg:hidden" size="sm" variant="outline" icon={ArrowLeft} onClick={() => setShowDetailMobile(false)}>
                  Volver a la lista
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{selected.label}</CardTitle>
                  <Badge estado={selected.status} variant={selected.variant} />
                </div>
                <p className="mt-1 text-sm text-text-secondary">{selected.entity} - {selected.customer}</p>
              </div>
              <Button size="sm" variant="outline">Ver timeline</Button>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr]">
              <div className="space-y-3 rounded-lg bg-surface-subtle p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Resumen de la orden</h3>
                <FactRow label="Servicio" value={selected.service} strong />
                <FactRow label="Cita" value={selected.appointment || selected.reservation ? formatDateTime(selected.appointment?.startAt || selected.reservation?.startAt) : 'Sin fecha'} />
                <FactRow label="Telefono" value={selected.phone} />
                <FactRow label="Creado" value={formatDateTime(selected.createdAt)} />
                <FactRow label="Estado de la orden" value={statusLabel(selected.status)} strong />
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-2">
                  {['Orden', 'Cliente', 'Vehiculo', 'Cita'].map((tab, index) => (
                    <Badge key={tab} estado={tab} variant={index === 0 ? 'info' : 'neutral'} />
                  ))}
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Detalles tecnicos</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FactRow label="ID del cliente" value={selected.customerId || 'Sin cliente'} />
                  <FactRow label="Vehiculo" value={selected.entity} />
                  <FactRow label="Estado de la orden" value={displayText(selected.status)} strong />
                  <FactRow label="ID de la cita" value={selected.appointment?._id || 'Sin cita'} />
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
