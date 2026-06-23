export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 block">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
