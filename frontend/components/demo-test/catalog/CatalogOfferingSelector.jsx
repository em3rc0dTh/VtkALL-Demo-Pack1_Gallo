import { useCatalogOfferings } from '@/hooks/server-state/useCatalogOfferings';
import { CatalogOfferingCard } from './CatalogOfferingCard';
import { Button } from '@/components/ui/Button';

export function CatalogOfferingSelector({ 
  businessSlug, 
  verticalType, 
  selectedOfferingId, 
  onSelect 
}) {
  const { data: offerings, isPending, error, refetch } = useCatalogOfferings({
    businessSlug,
    verticalType
  });

  if (isPending) {
    return <div className="p-4 text-sm text-text-secondary">Cargando catálogo...</div>;
  }

  if (error) {
    return (
      <div className="rounded border border-border-danger bg-surface-danger p-4">
        <p className="text-sm font-semibold text-text-danger">Error al cargar catálogo</p>
        <p className="text-xs text-text-danger mt-1">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!offerings || offerings.length === 0) {
    return (
      <div className="p-4 text-sm text-text-secondary">
        No hay servicios disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {offerings.map(offering => (
        <CatalogOfferingCard
          key={offering._id}
          offering={offering}
          isSelected={selectedOfferingId === offering._id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
