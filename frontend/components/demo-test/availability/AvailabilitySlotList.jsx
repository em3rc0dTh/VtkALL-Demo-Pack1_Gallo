export function AvailabilitySlotList({ slots, selectedSlot, onSelectSlot }) {
  if (!slots || slots.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map(slot => {
        const isSelected = selectedSlot?.startAt === slot.startAt;
        
        // Formateo visual simple (ej. "09:00 AM")
        const dateObj = new Date(slot.startAt);
        const timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <button
            key={slot.startAt}
            onClick={() => onSelectSlot(slot)}
            className={`rounded-md border p-3 text-center transition-colors ${
              isSelected 
                ? 'border-action-primary bg-action-primary text-text-on-primary' 
                : 'border-border-subtle bg-surface-app text-text-primary hover:border-action-primary/50 hover:bg-hover-row'
            }`}
          >
            <div className="font-semibold">{timeLabel}</div>
            <div className={`mt-1 text-xs ${isSelected ? 'text-text-on-primary/80' : 'text-text-secondary'}`}>
              Cupos: {slot.capacityRemaining}
            </div>
          </button>
        );
      })}
    </div>
  );
}
