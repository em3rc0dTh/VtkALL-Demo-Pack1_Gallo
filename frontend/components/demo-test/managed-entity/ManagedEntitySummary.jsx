import { Button } from '@/components/ui/Button';

export function ManagedEntitySummary({ entity, onEdit }) {
  if (!entity) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-subtle p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">{entity.displayName}</h4>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar
        </Button>
      </div>
      <div className="text-sm text-text-secondary">
        <p>Tipo: {entity.type}</p>
        {entity.data?.plate && <p>Placa: {entity.data.plate}</p>}
        {entity.data?.year && <p>Año: {entity.data.year}</p>}
        <p className="text-xs text-text-muted mt-2">ID: {entity._id}</p>
      </div>
    </div>
  );
}
