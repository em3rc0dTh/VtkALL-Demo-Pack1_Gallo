import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, FieldLabel } from '@/components/ui/Input';

export function CaseForm({ 
  businessSlug, 
  verticalType,
  customerId,
  managedEntityId,
  title, 
  onSubmit, 
  isPending, 
  error 
}) {
  const [summary, setSummary] = useState('');
  const [customerText, setCustomerText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summary) return;
    
    onSubmit({
      businessSlug,
      verticalType,
      customerId,
      managedEntityId,
      source: {
        channel: "manual_console",
        agent: "manual",
        origin: `${businessSlug}_frontend`,
      },
      intent: {
        type: "assessment_request",
        summary,
        customerText,
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

      <div className="space-y-3">
        <div>
          <FieldLabel>Resumen del caso *</FieldLabel>
          <Input 
            required 
            value={summary} 
            onChange={e => setSummary(e.target.value)} 
            placeholder="Ej. Revisión general de frenos" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Comentarios del cliente</FieldLabel>
          <Textarea
            value={customerText} 
            onChange={e => setCustomerText(e.target.value)} 
            placeholder="Ej. Siento un ruido metálico al frenar a alta velocidad..." 
            disabled={isPending}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !summary}>
          {isPending ? 'Guardando...' : 'Crear Caso'}
        </Button>
      </div>
    </form>
  );
}
