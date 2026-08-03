import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, FieldLabel } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function CustomerForm({ onSubmit, loading }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, contact: { phones: [{ number: phone }] } });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>1. Crear Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Nombre del Cliente</FieldLabel>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej. Juan Pérez" 
              required 
            />
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Ej. 999888777" 
              required 
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Crear Cliente
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ManagedEntityForm({ onSubmit, loading, customer }) {
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState('vehicle');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ displayName, type });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>2. Crear Entidad Gestionada</CardTitle>
        <p className="text-xs text-text-muted mt-1">Para el cliente: {customer?.name}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Nombre / Placa</FieldLabel>
            <Input 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              placeholder="Ej. ABC-123" 
              required 
            />
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <Input 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              placeholder="vehicle" 
              required 
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Crear Entidad
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CaseForm({ onSubmit, loading, managedEntity }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({});
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>3. Crear Caso</CardTitle>
        <p className="text-xs text-text-muted mt-1">Para entidad: {managedEntity?.displayName}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-text-secondary">
            Crearemos un caso (lead) asociado al cliente y a la entidad gestionada, preparándolo para el agendamiento.
          </p>
          <Button type="submit" loading={loading} className="w-full">
            Crear Caso
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
