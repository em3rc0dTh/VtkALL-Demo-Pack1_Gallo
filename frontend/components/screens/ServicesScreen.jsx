'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useAdminData } from '@/hooks/useAdminData';
import { adminEmptyData, offeringName } from '@/lib/admin/adminMappers';

export function ServicesScreen() {
  const { data = adminEmptyData, loading, error } = useAdminData();
  const services = useMemo(() => data?.catalogOfferings || [], [data?.catalogOfferings]);

  const rows = useMemo(() => services.map((service) => ({
    id: service._id,
    name: offeringName(service),
    price: service.price?.display || service.priceLabel || service.price || 'Sin precio definido',
    duration: service.durationMinutes ? `${service.durationMinutes} min` : 'Sin duracion definida',
    state: service.active === false ? 'Inactivo' : 'Activo',
    color: service.active === false ? 'ROJO' : 'VERDE',
    verticalType: service.verticalType || 'Sin vertical',
  })), [services]);

  const columns = useMemo(
    () => [
      {
        header: 'CatalogOffering',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-text-primary">{row.original.name}</div>
            <div className="mt-0.5 text-xs text-text-muted">{row.original.id}</div>
          </div>
        ),
      },
      {
        header: 'Precio / Duracion',
        id: 'price_duration',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-text-primary">{row.original.price}</div>
            <div className="text-xs text-text-secondary mt-0.5">{row.original.duration}</div>
          </div>
        ),
      },
      {
        header: 'Vertical',
        accessorKey: 'verticalType',
        cell: ({ getValue }) => <span className="text-xs font-semibold text-text-secondary">{getValue()}</span>,
      },
      {
        header: 'Estado backend',
        accessorKey: 'state',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${row.original.color === 'ROJO' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-semibold text-text-primary">{row.original.state}</span>
          </div>
        ),
      },
      {
        header: 'Accion',
        id: 'actions',
        cell: () => (
          <div className="flex justify-end">
            <Button size="sm" variant="outline">Ver contrato</Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) return <StateBox>Cargando CatalogOfferings desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-xs font-semibold text-text-secondary w-fit shadow-sm">
        <span className="text-text-muted uppercase tracking-wider text-[9px] font-black">Estado del CatalogOffering:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Activo en backend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>Inactivo</span>
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        {rows.length ? <DataTable columns={columns} data={rows} /> : <StateBox>No hay CatalogOfferings activos en backend.</StateBox>}
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
