import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export function CaseSummary({ caseObj, onEdit }) {
  if (!caseObj) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-subtle p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-text-primary">Caso: {caseObj.caseNumber}</h4>
          <Badge estado={caseObj.status} variant="info" />
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar
        </Button>
      </div>
      <div className="text-sm text-text-secondary">
        <p>Vertical: {caseObj.verticalType}</p>
        <p className="mt-2 font-medium">Intención:</p>
        <p className="italic">&quot;{caseObj.intent?.summary || caseObj.intent?.type}&quot;</p>
        <p className="text-xs text-text-muted mt-2">ID: {caseObj._id}</p>
      </div>
    </div>
  );
}
