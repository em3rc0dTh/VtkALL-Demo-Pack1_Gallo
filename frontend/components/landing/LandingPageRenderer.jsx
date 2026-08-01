'use client';

import { useMemo, useState } from 'react';
import { Bot, CalendarClock, CheckCircle2, MapPin, MessageCircle, Phone, Sparkles, Trophy, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DemoTestAgentChat } from './DemoTestAgentChat';
import { sortLandingBlocks } from '@/lib/landing/landingContract';

const sectionIdByType = {
  catalog: 'servicios',
  about: 'taller',
  gallery: 'galeria',
  contact: 'contacto',
};

export function LandingPageRenderer({ payload }) {
  const [chatOpen, setChatOpen] = useState(false);
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const businessSlug = payload?.landingPage?.businessSlug || payload?.businessProfile?.businessSlug || 'turagua';
  const businessName = payload?.businessProfile?.brand?.displayName || payload?.businessProfile?.businessName || 'Turagua';
  const agentName = payload?.businessProfile?.agent?.name || 'Iris';
  const blocks = useMemo(() => sortLandingBlocks(content?.blocks), [content]);
  const theme = content?.theme || {};
  const heroLogoUrl = blocks.find((block) => block.type === 'hero')?.data?.logoUrl;
  const logoUrl = heroLogoUrl || payload?.businessProfile?.brand?.logoUrl;

  if (!content) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app text-text-secondary">Landing no disponible.</div>;
  }

  return (
    <main
      className="min-h-screen bg-[var(--landing-surface)] text-[var(--landing-text)]"
      style={{
        '--landing-primary': theme.primary || '#1d4ed8',
        '--landing-accent': theme.accent || '#f59e0b',
        '--landing-surface': theme.surface || '#f8fafc',
        '--landing-text': theme.text || '#0f172a',
      }}
    >
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/88 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={`${businessName} logo`} className="h-12 w-32 rounded-lg border border-sky-200 bg-slate-900 object-contain p-1 shadow-sm" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-white">
                <Wrench className="h-5 w-5" />
              </span>
            )}
            <span className="truncate text-base font-black tracking-tight">
              Turagua <span className="text-[var(--landing-primary)]">Racing Peru</span>
            </span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
            {(content.navigation || []).map((item) => (
              <a key={`${item.label}-${item.href}`} href={item.href} className="hover:text-[var(--landing-primary)]">{item.label}</a>
            ))}
          </nav>
          <Button type="button" onClick={() => setChatOpen(true)} className="bg-[var(--landing-primary)] hover:opacity-90">
            <MessageCircle className="h-4 w-4" />
            Agendar
          </Button>
        </div>
      </header>

      {blocks.map((block) => (
        <LandingBlock
          key={block.id}
          block={block}
          catalogOfferings={payload?.catalogOfferings || []}
          businessName={businessName}
          agentName={agentName}
          logoUrl={logoUrl}
          onOpenChat={() => setChatOpen(true)}
        />
      ))}

      <DemoTestAgentChat
        businessSlug={businessSlug}
        agentName={agentName}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </main>
  );
}

function LandingBlock({ block, catalogOfferings, businessName, agentName, logoUrl, onOpenChat }) {
  const data = block.data || {};
  const id = sectionIdByType[block.type] || block.id;

  if (block.type === 'hero') {
    if (data.variant === 'turagua_legacy') {
      return <TuraguaLegacyHero data={data} businessName={businessName} agentName={agentName} logoUrl={logoUrl} onOpenChat={onOpenChat} />;
    }

    return (
      <section id="inicio" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
              <Sparkles className="h-4 w-4" />
              {data.eyebrow || businessName}
            </span>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              {data.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{data.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={onOpenChat} className="bg-[var(--landing-primary)] px-6">
                <Bot className="h-4 w-4" />
                {data.primaryCta || `Hablar con ${agentName}`}
              </Button>
              <Button as="a" variant="secondary" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
                {data.secondaryCta || 'Ver servicios'}
              </Button>
            </div>
          </div>
          <div className="min-h-[360px] overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            <div className="flex h-full flex-col justify-between bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#f59e0b_100%)] p-7 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-wide">{businessName}</span>
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {['Diagnostico', 'Agenda', 'Servicio', 'Seguimiento'].map((item) => (
                    <div key={item} className="rounded-lg bg-white/12 p-4 backdrop-blur">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-amber-200" />
                      <div className="text-sm font-bold">{item}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-6 text-blue-50">Operaciones, catalogo y agente sobre contratos Pack0.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'stats') {
    return (
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-3 sm:px-6">
          {(data.items || []).map((item) => (
            <div key={`${item.label}-${item.value}`} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="text-3xl font-black text-[var(--landing-primary)]">{item.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">{item.label}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'catalog') {
    const selected = data.featuredOfferingIds?.length
      ? catalogOfferings.filter((offering) => data.featuredOfferingIds.includes(offering._id))
      : catalogOfferings;
    return (
      <section id={id} className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950">{data.title || 'Servicios'}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{data.subtitle}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selected.map((offering) => (
              <article key={offering._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[var(--landing-primary)]">
                  <Wrench className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-950">{offering.name || offering.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{offering.description || offering.summary || 'Servicio disponible para el negocio.'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'about' || block.type === 'structured_content') {
    return (
      <section id={id === 'taller' ? 'nosotros' : id} className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.title || 'Turagua taller'} className="min-h-80 w-full rounded-lg object-cover shadow-xl shadow-slate-300/40" />
          ) : null}
          <div>
            {data.eyebrow ? <p className="text-sm font-black uppercase text-[var(--landing-primary)]">{data.eyebrow}</p> : null}
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{data.title}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{data.body}</p>
            {Array.isArray(data.features) ? (
              <div className="mt-7 grid gap-4">
                {data.features.map((feature) => (
                  <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex gap-4">
                      <FeatureIcon name={feature.icon} />
                      <div>
                        <h3 className="font-black text-slate-950">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{feature.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'gallery' || block.type === 'promotion') {
    return (
      <section id={id} className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-black text-slate-950">{data.title || 'Galeria'}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data.items || []).map((item) => {
              const title = typeof item === 'string' ? item : item.title;
              const imageUrl = typeof item === 'string' ? '' : item.imageUrl;
              return (
              <div key={title} className="relative flex min-h-44 items-end overflow-hidden rounded-lg bg-slate-950 p-5 text-white">
                {imageUrl ? <img src={imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-65" /> : null}
                <span className="relative z-10 text-lg font-black">{title}</span>
              </div>
            );})}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'testimonials') {
    return (
      <section className="bg-slate-50 py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          {(data.items || []).map((item) => (
            <blockquote key={`${item.author}-${item.quote}`} className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-lg font-semibold leading-8 text-slate-800">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-bold text-[var(--landing-primary)]">{item.author}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'agent_call_to_action' || block.type === 'call_to_action') {
    return (
      <section className="bg-[var(--landing-primary)] py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-black">{data.title || `Habla con ${agentName}`}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-blue-50">{data.body}</p>
          </div>
          <Button type="button" onClick={onOpenChat} className="bg-white text-[var(--landing-primary)] hover:bg-blue-50">
            <MessageCircle className="h-4 w-4" />
            {data.cta || 'Abrir chat'}
          </Button>
        </div>
      </section>
    );
  }

  if (block.type === 'contact') {
    return (
      <section id={id} className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          <ContactFact icon={Phone} label="Telefono" value={data.phone} />
          <ContactFact icon={MapPin} label="Direccion" value={data.address} />
          <ContactFact icon={CalendarClock} label="Horario" value={data.hours} />
        </div>
      </section>
    );
  }

  if (block.type === 'footer') {
    return (
      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-black">{data.company || businessName}</span>
          <span className="text-sm text-slate-400">{data.note}</span>
        </div>
      </footer>
    );
  }

  return null;
}

function TuraguaLegacyHero({ data, businessName, agentName, logoUrl, onOpenChat }) {
  const mediaUrl = data.heroMediaUrl || data.imageUrl;
  const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(mediaUrl || '');

  return (
    <section id="inicio" className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#e8e8ee]">
      {isVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : mediaUrl ? (
        <img src={mediaUrl} alt={businessName} className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/35 to-white/85" />
      <div className="absolute inset-x-0 top-10 select-none text-center text-[13vw] font-black uppercase tracking-wide text-sky-200/25">
        {(data.backdropText || businessName).replace(/\s+/g, '')}
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.62fr_1fr] lg:items-end lg:py-16">
        <div className="order-2 grid gap-4 self-end sm:grid-cols-2 lg:order-1 lg:pb-4">
          {(data.promotions || []).slice(0, 2).map((promo) => (
            <button
              key={promo.title}
              type="button"
              onClick={onOpenChat}
              className="rounded-lg bg-slate-950/90 p-5 text-left text-white shadow-xl shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-slate-900"
            >
              <span className="inline-flex rounded bg-[var(--landing-primary)] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                {promo.eyebrow}
              </span>
              <h3 className="mt-4 min-h-14 text-xl font-black leading-tight">{promo.title}</h3>
              <span className="mt-5 flex h-10 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-sm font-black uppercase tracking-wide">
                {promo.cta || 'Obtener'}
              </span>
            </button>
          ))}
        </div>

        <div className="order-1 flex flex-col items-end text-right lg:order-2 lg:pb-16">
          {logoUrl ? <img src={logoUrl} alt={`${businessName} logo`} className="mb-5 h-16 w-44 rounded-lg border border-sky-200 bg-slate-950 object-contain p-1 shadow-lg lg:hidden" /> : null}
          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.98] text-[#4a393d] sm:text-6xl lg:text-7xl xl:text-8xl">
            {data.title}
            <span className="block text-[var(--landing-primary)]">{data.titleHighlight}</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[#4a393d]/85">
            {data.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as="a" variant="secondary" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
              {data.secondaryCta || 'Ver servicios'}
            </Button>
            <Button type="button" onClick={onOpenChat} className="bg-[var(--landing-primary)] px-7 text-white">
              <MessageCircle className="h-4 w-4" />
              {data.primaryCta || `Agendar con ${agentName}`}
            </Button>
          </div>
          <p className="mt-8 max-w-2xl text-base font-semibold leading-7 text-[#4a393d]/75">{data.supportingText}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenChat}
        className="absolute bottom-8 right-6 z-20 hidden max-w-sm rounded-lg bg-white p-5 text-left shadow-2xl shadow-slate-900/20 md:block"
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--landing-primary)] text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-black text-slate-950">Hola! Soy {agentName}</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">Comunicate conmigo para obtener mas informacion o agendar tu cita.</p>
            <p className="mt-2 text-sm font-black text-[var(--landing-primary)]">Abrir chat &rarr;</p>
          </div>
        </div>
      </button>
    </section>
  );
}

function FeatureIcon({ name }) {
  const Icon = name === 'trophy' ? Trophy : name === 'wrench' ? Wrench : Sparkles;
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[var(--landing-primary)]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function ContactFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <Icon className="mb-4 h-5 w-5 text-[var(--landing-primary)]" />
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-base font-bold text-slate-950">{value || 'Por confirmar'}</div>
    </div>
  );
}
