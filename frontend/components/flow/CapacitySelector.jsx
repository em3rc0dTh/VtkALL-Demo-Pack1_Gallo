import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, FieldLabel } from '@/components/ui/Input';

export function CapacitySelector({ onSearch, onSelectSlot, slots = [], loading, searchLoading }) {
  const [date, setDate] = useState('2026-07-06');
  
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ date, durationMinutes: 60 });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>4. Selector de Capacidad (ResourceReservation)</CardTitle>
        <p className="text-xs text-text-muted mt-1">
          El frontend solo presenta opciones. El backend valida si la capacidad existe. 
          *Usa fechas terminadas en "07" para simular NO_AVAILABILITY.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <FieldLabel>Fecha</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <Button type="submit" variant="secondary" loading={searchLoading}>
            Buscar Slots
          </Button>
        </form>

        {slots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Slots Disponibles</h4>
            <div className="grid grid-cols-2 gap-3">
              {slots.map((slot, idx) => {
                const time = new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <Button 
                    key={idx} 
                    variant="outline" 
                    className="justify-start py-6"
                    onClick={() => onSelectSlot(slot)}
                    loading={loading}
                  >
                    <div className="text-left">
                      <div className="font-bold text-lg">{time}</div>
                      <div className="text-xs text-status-success font-medium">Disponible ({slot.capacityRemaining})</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-text-muted italic mt-2">
              *Selecciona el slot de las 10:00 para forzar DOUBLE_BOOKING_CONFLICT en la simulación.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
