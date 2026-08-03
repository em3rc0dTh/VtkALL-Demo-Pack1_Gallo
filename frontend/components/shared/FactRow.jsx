export function FactRow({ label, value, strong }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border-subtle pb-2 text-sm">
      <span className="shrink-0 text-text-muted">{label}</span>
      <span className={`min-w-0 break-words text-right ${strong ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>{value}</span>
    </div>
  );
}
