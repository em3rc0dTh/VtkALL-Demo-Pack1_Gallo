'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useAdminData } from '@/hooks/useAdminData';
import {
  adminEmptyData,
  customerName,
  customerPhone,
  formatDateTime,
  managedEntityLabel,
  managedEntitySecondary,
} from '@/lib/admin/adminMappers';

export function ClientsScreen() {
  const { data = adminEmptyData, loading, error } = useAdminData();

  const rows = useMemo(() => (data?.customers || []).map((customer) => {
    const entities = (data?.managedEntities || []).filter((entity) => entity.customerId === customer._id);
    const cases = (data?.cases || []).filter((caseItem) => caseItem.customerId === customer._id);
    const lastUpdated = [customer.updatedAt, ...cases.map((caseItem) => caseItem.updatedAt)]
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      id: customer._id,
      name: customerName(customer),
      phone: customerPhone(customer),
      entities,
      casesCount: cases.length,
      attention: cases.length ? `${cases.length} cases vinculados` : 'Sin cases',
      lastContact: formatDateTime(lastUpdated || customer.createdAt),
    };
  }), [data?.cases, data?.customers, data?.managedEntities]);

  const columns = useMemo(
    () => [
      {
        header: 'Customer / ManagedEntities',
        accessorKey: 'name',
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="py-1">
              <div className="font-bold text-text-primary">{client.name}</div>
              <div className="text-xs text-text-secondary mt-0.5">{client.phone}</div>
              <div className="mt-2.5 space-y-1">
                {client.entities.length ? client.entities.map((entity) => (
                  <div key={entity._id} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary pl-2 border-l border-border-default">
                    <span className="text-text-muted">-&gt;</span> {managedEntityLabel(entity)} · {managedEntitySecondary(entity)}
                  </div>
                )) : (
                  <div className="text-xs italic text-text-muted">Sin ManagedEntity vinculado</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: 'Estado operacional',
        accessorKey: 'attention',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${row.original.casesCount ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-xs font-semibold text-text-primary">{row.original.attention}</span>
          </div>
        ),
      },
      {
        header: 'Ultima actualizacion',
        accessorKey: 'lastContact',
        cell: ({ getValue }) => <div className="text-xs font-semibold text-text-secondary">{getValue()}</div>,
      },
      {
        header: 'Acciones',
        id: 'actions',
        cell: () => (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline">Ver cases</Button>
            <Button size="sm" variant="outline">Ver timeline</Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) return <StateBox>Cargando Customers desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-xs font-semibold text-text-secondary w-fit shadow-sm">
        <span className="text-text-muted uppercase tracking-wider text-[9px] font-black">Fuente:</span>
        <span>Customers, ManagedEntities y Cases desde backend v3</span>
      </div>

      {rows.length ? <DataTable columns={columns} data={rows} /> : <StateBox>No hay Customers en backend.</StateBox>}
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
