'use client';

import { MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { DemoTestAgentChat } from '@/components/landing/DemoTestAgentChat';
import { useState } from 'react';

export function AgendarScreen() {
  const { profile } = useBusinessProfile();
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <main className="min-h-screen bg-surface-app p-4 text-text-primary">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-4xl items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Reserva con {profile.agent.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-text-secondary">
              El agente consulta el catalogo activo, toma tus datos, solicita disponibilidad y confirma la cita desde el backend.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button icon={MessageCircle} onClick={() => setChatOpen(true)}>Abrir agente</Button>
              <Button variant="outline" onClick={() => { window.location.href = '/'; }}>Volver al inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <DemoTestAgentChat
        businessSlug={profile.businessSlug}
        agentName={profile.agent.name}
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialMessage={`Hola ${profile.agent.name}, quiero agendar una cita`}
      />
    </main>
  );
}
