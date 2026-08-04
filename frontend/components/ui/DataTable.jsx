'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';

export function DataTable({ columns, data, pageSize = 5 }) {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Barra de Filtros / Búsqueda */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar en todos los campos..."
          className="w-full max-w-sm rounded-lg border border-border-default bg-surface-sidebar px-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:border-action-primary focus:outline-none"
        />
        <div className="text-xs text-text-muted">
          Mostrando {table.getRowModel().rows.length} de {data.length} filas
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-panel shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left text-sm text-text-primary border-collapse">
            <thead className="sticky top-0 z-10 border-b-2 border-border-default bg-surface-panel text-xs font-bold uppercase tracking-wider text-text-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 whitespace-nowrap bg-surface-panel">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-hover-row transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-text-muted"
                  >
                    No hay resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 bg-surface-panel">
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <span>Página</span>
            <strong className="text-text-primary">
              {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-hover-row disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-border-default px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-hover-row disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
