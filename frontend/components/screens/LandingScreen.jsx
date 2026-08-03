'use client';

import { Gauge, MessageCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FactRow } from '@/components/shared/FactRow';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { DemoTestAgentChat } from '@/components/landing/DemoTestAgentChat';
import { catalogRepository } from '@/lib/catalog/catalogRepository';
import { getLandingConfig } from '@/lib/landing/landingConfig';
import { useEffect, useState } from 'react';

export function LandingScreen() {
  const { profile } = useBusinessProfile();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeedMessage, setChatSeedMessage] = useState('');
  const [services, setServices] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const landing = getLandingConfig(profile);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogError('');
      try {
        const result = await catalogRepository.getOfferings({
          businessSlug: profile.businessSlug,
          verticalType: profile.verticalType,
        });
        if (!cancelled) {
          setServices(result.catalogOfferings || []);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error.message || 'No se pudo cargar el catalogo.');
          setServices([]);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [profile.businessSlug, profile.verticalType]);

  const openAgent = (message = `Hola ${profile.agent.name}, quiero agendar una cita`) => {
    setChatSeedMessage(message);
    setChatOpen(true);
  };

  return (
    <main className="min-h-screen bg-surface-app text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border-default bg-surface-subtle/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-sm font-black uppercase tracking-widest">{profile.branding.name}</div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-text-secondary md:flex">
            <a href="#servicios">Servicios</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#galeria">Galeria</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <Button size="sm" icon={MessageCircle} onClick={() => openAgent()}>Chatear con {profile.agent.name}</Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="min-h-[360px]">
          <CardContent className="flex h-full flex-col justify-center gap-6 p-8">
            <Badge estado={landing.hero.eyebrow} variant="info" />
            <div>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-text-primary md:text-5xl">
                {landing.hero.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
                {landing.hero.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button icon={MessageCircle} onClick={() => openAgent()}>{landing.hero.primaryCta}</Button>
              <Button variant="outline" onClick={() => { document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' }); }}>{landing.hero.secondaryCta}</Button>
              <Button variant="ghost" onClick={() => { window.location.href = '/agendar'; }}>Abrir reserva</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex min-h-[360px] flex-col justify-between p-6">
            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{landing.visual.title}</span>
                <Gauge className="h-5 w-5 text-action-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {landing.visual.chips.map((item) => (
                  <div key={item} className="rounded-md border border-border-subtle bg-surface-panel p-3 text-center text-xs font-bold text-text-secondary">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <FactRow label="Catalogo" value={`${services.length} servicios activos`} strong />
              <FactRow label="Politica" value={profile.verticalType || 'BusinessProfile'} />
              <FactRow label="Seguimiento" value="Case + timeline backend" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="servicios" className="mx-auto max-w-6xl px-4 py-8">
        <PageHeader title={landing.sections.servicesTitle} description={landing.sections.servicesDescription} />
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.9fr]">
          {catalogError && (
            <Card>
              <CardContent className="p-5 text-sm font-semibold text-text-danger">{catalogError}</CardContent>
            </Card>
          )}
          {services.slice(0, 4).map((service) => (
            <Card key={service._id}>
              <CardContent className="space-y-4 p-5">
                <Badge estado={service.active === false ? 'Inactivo' : 'Activo'} variant={service.active === false ? 'danger' : 'success'} />
                <div>
                  <h3 className="font-bold text-text-primary">{service.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {service.durationMinutes ? `${service.durationMinutes} min` : 'Duracion segun disponibilidad'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={MessageCircle}
                  onClick={() => openAgent(`Hola ${profile.agent.name}, quiero consultar por ${service.name}`)}
                >
                  Consultar
                </Button>
              </CardContent>
            </Card>
          ))}
          {!catalogError && services.length === 0 && (
            <Card>
              <CardContent className="p-5 text-sm font-semibold text-text-secondary">No hay CatalogOfferings activos en backend.</CardContent>
            </Card>
          )}
          <Card className="md:row-span-2">
            <CardHeader>
              <CardTitle>Como reservar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Elige servicio', 'Confirma disponibilidad', 'Reserva'].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-primary-soft text-xs font-bold text-action-primary">{index + 1}</span>
                  <span className="text-sm font-semibold text-text-secondary">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="nosotros" className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{landing.sections.aboutTitle}</CardTitle></CardHeader>
          <CardContent className="text-sm leading-7 text-text-secondary">
            {landing.sections.aboutBody}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid grid-cols-3 gap-3 p-5">
            {['10 anos', '500 clientes', '2000 autos'].map((item) => (
              <div key={item} className="rounded-lg bg-surface-subtle p-4 text-center text-sm font-bold text-text-primary">{item}</div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="galeria" className="mx-auto max-w-6xl px-4 py-8">
        <PageHeader title={landing.sections.galleryTitle} description="Elementos configurables desde BusinessProfile.landing." />
        <div className="grid gap-3 md:grid-cols-4">
          {landing.sections.galleryItems.map((item) => (
            <div key={item} className="flex aspect-[4/3] items-center justify-center rounded-lg border border-border-subtle bg-surface-subtle text-sm font-bold text-text-muted">
              Foto {item}
            </div>
          ))}
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-6xl px-4 py-8 pb-24">
        <Card>
          <CardContent className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{landing.sections.contactTitle}</h2>
              <p className="text-sm text-text-secondary">{landing.sections.contactBody}</p>
            </div>
            <Button icon={MessageCircle} onClick={() => openAgent()}>Abrir chat de reserva</Button>
          </CardContent>
        </Card>
      </section>

      <DemoTestAgentChat
        businessSlug={profile.businessSlug}
        agentName={profile.agent.name}
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialMessage={chatSeedMessage}
      />
    </main>
  );
}
