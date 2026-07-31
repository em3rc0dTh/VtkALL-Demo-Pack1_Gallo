import Badge from '@/components/ui/Badge';

export function WorkItem({ state, variant, title, meta, action }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-panel p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Badge estado={state} variant={variant} />
        <span className="text-xs font-semibold text-text-muted">{meta}</span>
      </div>
      <div className="text-sm font-bold text-text-primary">{title}</div>
      {action && <div className="mt-3 text-xs font-semibold text-action-primary">{action}</div>}
    </div>
  );
}
