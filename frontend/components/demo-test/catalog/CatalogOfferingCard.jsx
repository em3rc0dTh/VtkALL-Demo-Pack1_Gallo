export function CatalogOfferingCard({ offering, isSelected, onClick }) {
  return (
    <button
      onClick={() => onClick(offering)}
      className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
        isSelected 
          ? 'border-action-primary bg-action-primary/5 ring-1 ring-action-primary' 
          : 'border-border-subtle bg-surface-subtle hover:border-action-primary/50 hover:bg-hover-row'
      }`}
    >
      <div className="font-semibold text-text-primary">{offering.name}</div>
      <p className="text-sm text-text-secondary">{offering.description}</p>
      
      <div className="mt-2 flex gap-2 text-xs font-medium text-text-muted">
        <span className="rounded bg-surface-app px-2 py-1">
          {offering.fulfillmentPolicy.estimatedDurationMinutes} min
        </span>
        <span className="rounded bg-surface-app px-2 py-1">
          Equipo: {offering.fulfillmentPolicy.suggestedTeamId}
        </span>
      </div>
    </button>
  );
}
