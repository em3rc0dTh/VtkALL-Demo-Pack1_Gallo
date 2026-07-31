'use client';

import { useMemo, useState } from 'react';
import { Bot, CalendarClock, CheckCircle2, MapPin, MessageCircle, Phone, Sparkles, Wrench } from 'lucide-react';
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
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/92 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-white">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="truncate text-base font-black tracking-tight">{businessName}</span>
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

function LandingBlock({ block, catalogOfferings, businessName, agentName, onOpenChat }) {
  const data = block.data || {};
  const id = sectionIdByType[block.type] || block.id;

  if (block.type === 'hero') {
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
      <section id={id} className="bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-3xl font-black text-slate-950">{data.title}</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">{data.body}</p>
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
            {(data.items || []).map((item) => (
              <div key={item} className="flex min-h-36 items-end rounded-lg bg-slate-950 p-5 text-white">
                <span className="text-lg font-black">{item}</span>
              </div>
            ))}
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

function ContactFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <Icon className="mb-4 h-5 w-5 text-[var(--landing-primary)]" />
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-base font-bold text-slate-950">{value || 'Por confirmar'}</div>
    </div>
  );
}
