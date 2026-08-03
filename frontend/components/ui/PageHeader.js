export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-border-default bg-surface-subtle/80 p-4 md:flex-row md:items-center">
      <div>
        {eyebrow && (
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-action-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[15px] text-text-secondary md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
