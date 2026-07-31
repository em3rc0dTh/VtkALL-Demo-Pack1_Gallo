import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export function CustomerSummary({ customer, onEdit, isReused }) {
  if (!customer) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-subtle p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-text-primary">{customer.name}</h4>
          {isReused && <Badge estado="Reutilizado" variant="info" />}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar
        </Button>
      </div>
      <div className="text-sm text-text-secondary">
        <p>Teléfono: {customer.phone}</p>
        {customer.email && <p>Email: {customer.email}</p>}
        <p className="text-xs text-text-muted">ID: {customer._id}</p>
      </div>
    </div>
  );
}
