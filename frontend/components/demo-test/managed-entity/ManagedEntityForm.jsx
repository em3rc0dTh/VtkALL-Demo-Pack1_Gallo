import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, FieldLabel } from '@/components/ui/Input';

export function ManagedEntityForm({ 
  businessSlug, 
  customerId,
  verticalType,
  title, 
  onSubmit, 
  isPending, 
  error 
}) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!brand || !model || !plate) return;
    
    onSubmit({
      businessSlug,
      customerId,
      type: verticalType,
      displayName: `${brand} ${model} ${plate}`.trim(),
      data: {
        brand,
        model,
        year,
        plate
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {error && (
        <div className="rounded border border-border-danger bg-surface-danger p-3 text-sm text-text-danger whitespace-pre-wrap">
          Error: {error.code ? `${error.code}: ${error.message}` : error.message}
          {error.details ? `\n${JSON.stringify(error.details, null, 2)}` : ''}
        </div>
      )}

      {/* Vehículo fields specific to demo_test vertical */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Marca *</FieldLabel>
          <Input 
            required 
            value={brand} 
            onChange={e => setBrand(e.target.value)} 
            placeholder="Ej. Toyota" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Modelo *</FieldLabel>
          <Input 
            required 
            value={model} 
            onChange={e => setModel(e.target.value)} 
            placeholder="Ej. Yaris" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Año</FieldLabel>
          <Input 
            type="number"
            value={year} 
            onChange={e => setYear(e.target.value)} 
            placeholder="Ej. 2020" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Placa *</FieldLabel>
          <Input 
            required 
            value={plate} 
            onChange={e => setPlate(e.target.value)} 
            placeholder="Ej. ABC-123" 
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !brand || !model || !plate}>
          {isPending ? 'Guardando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
