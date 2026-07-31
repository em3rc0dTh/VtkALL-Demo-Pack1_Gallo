import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, FieldLabel } from '@/components/ui/Input';

export function CustomerForm({ 
  businessSlug, 
  title, 
  onSubmit, 
  isPending, 
  error 
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    onSubmit({
      businessSlug,
      name,
      phone,
      email: email || undefined,
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
          <FieldLabel>Nombre *</FieldLabel>
          <Input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ej. Carlos Ramirez" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Teléfono *</FieldLabel>
          <Input 
            required 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Ej. +51 999 888 777" 
            disabled={isPending}
          />
        </div>
        <div>
          <FieldLabel>Email (Opcional)</FieldLabel>
          <Input 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="carlos@ejemplo.com" 
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !name || !phone}>
          {isPending ? 'Guardando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
