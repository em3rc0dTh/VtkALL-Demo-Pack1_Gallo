'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';

export function LoginWireframe() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-app p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="justify-center">Panel de Control Administrativo</CardTitle>
          <p className="text-sm text-text-secondary">Acceso local al panel conectado al backend</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <FieldLabel>Correo electronico</FieldLabel>
            <Input readOnly value="admin@demo.com" />
          </div>
          <div>
            <FieldLabel>Contrasena</FieldLabel>
            <Input readOnly value="********" />
          </div>
          <Button className="w-full" onClick={() => { window.location.href = '/admin/dashboard'; }}>Ingresar al panel</Button>
        </CardContent>
      </Card>
    </main>
  );
}
