'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gauge,
  MapPin,
  Paintbrush,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { sortLandingBlocks } from '@/lib/landing/landingContract';

const FALLBACK_PRIMARY = '#3217F6';
const FALLBACK_ACCENT = '#FFD500';

const sectionIdByVariant = {
  gallo_workshop_hero: 'inicio',
  gallo_brand_scene: 'marcas',
  gallo_services_scene: 'servicios',
  gallo_diagnostic_scene: 'diagnostico',
  gallo_process_scene: 'proceso',
  gallo_experience_scene: 'nosotros',
  gallo_evidence_scene: 'evidencia',
  gallo_contact_scene: 'contacto',
  gallo_final_scene: 'final',
};

const iconForServiceIndex = [Wrench, ScanLine, Paintbrush];

const cx = (...values) => values.filter(Boolean).join(' ');

function SceneShell({ id, children, className = '', tone = 'light' }) {
  return (
    <section
      id={id}
      data-gallo-scene={id}
      className={cx(
        'relative h-[100dvh] min-h-[620px] w-full snap-start snap-always overflow-hidden',
        tone === 'dark' ? 'bg-[#080A16] text-white' : 'bg-[#F7F8FC] text-[#101322]',
        className,
      )}
    >
      <div className="h-full overflow-y-auto overscroll-contain pt-20 md:overflow-hidden md:pt-24">
        {children}
      </div>
    </section>
  );
}

function SceneKicker({ children, inverted = false }) {
  return (
    <div className={cx('mb-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em]', inverted ? 'text-[#FFD500]' : 'text-[#3217F6]')}>
      <span className={cx('h-px w-10', inverted ? 'bg-[#FFD500]' : 'bg-[#3217F6]')} />
      {children}
    </div>
  );
}

function GalloHeader({ navigation, activeScene, onNavigate }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#17113F]/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <button type="button" onClick={() => onNavigate('#inicio')} className="group flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD500] transition group-hover:rotate-6 group-hover:bg-white/15">
            <Wrench className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.16em]">Gallo Autos</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Workshop</span>
          </span>
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {(navigation || []).map((item) => (
            <button
              type="button"
              key={`${item.label}-${item.href}`}
              onClick={() => onNavigate(item.href)}
              className={cx(
                'relative py-3 text-xs font-bold transition hover:text-white',
                activeScene === item.href.replace('#', '') ? 'text-white' : 'text-white/60',
              )}
            >
              {item.label}
              <span className={cx('absolute inset-x-0 -bottom-[17px] h-0.5 origin-left bg-[#FFD500] transition-transform', activeScene === item.href.replace('#', '') ? 'scale-x-100' : 'scale-x-0')} />
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate('#contacto')}
          className="inline-flex items-center gap-2 rounded-full bg-[#FFD500] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#17113F] shadow-[0_12px_36px_rgba(255,213,0,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(255,213,0,0.30)] sm:px-5"
        >
          Solicitar cita
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function HeroScene({ block, onNavigate }) {
  const data = block.data || {};
  const stats = Array.isArray(data.stats) ? data.stats : [];

  return (
    <SceneShell id="inicio" tone="dark" className="bg-[#0A0718]">
      <div className="absolute inset-0">
        <img src={data.heroMediaUrl || '/images/galeria_taller.png'} alt="Taller automotriz" className="h-full w-full object-cover opacity-48" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,5,24,0.98)_0%,rgba(22,12,74,0.93)_42%,rgba(38,17,119,0.46)_70%,rgba(8,5,26,0.70)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(72,37,255,0.32),transparent_34%)]" />
      </div>

      <div className="pointer-events-none absolute -right-16 top-[18%] h-[440px] w-[440px] rounded-full border border-white/10 opacity-70" />
      <div className="pointer-events-none absolute right-14 top-[27%] h-[260px] w-[260px] rounded-full border border-[#FFD500]/35 opacity-75 motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute right-[19%] top-[42%] h-2 w-2 rounded-full bg-[#FFD500] shadow-[0_0_50px_18px_rgba(255,213,0,0.42)]" />

      <div className="relative z-10 mx-auto grid h-full max-w-[1480px] items-center gap-12 px-6 pb-16 pt-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div className="max-w-4xl">
          <SceneKicker inverted>{data.eyebrow || 'Gallo Autos Workshop'}</SceneKicker>
          <h1 className="max-w-5xl text-[clamp(3rem,7vw,7.3rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">
            {data.title || 'Tu auto merece algo mejor que una respuesta genérica.'}
          </h1>
          <p className="mt-7 max-w-3xl text-[clamp(1rem,1.5vw,1.3rem)] font-semibold leading-8 text-white/72">
            {data.titleHighlight}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">{data.subtitle}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('#contacto')}
              className="group inline-flex items-center gap-3 rounded-full bg-[#FFD500] px-6 py-4 text-sm font-black text-[#17113F] shadow-[0_18px_60px_rgba(255,213,0,0.20)] transition hover:-translate-y-1"
            >
              {data.primaryCta || 'Solicitar una cita'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('#servicios')}
              className="inline-flex items-center gap-3 rounded-full border border-white/22 bg-white/8 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/14"
            >
              {data.secondaryCta || 'Explorar servicios'}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden self-end pb-14 lg:block">
          <div className="ml-auto w-full max-w-[480px] border-l border-white/15 pl-8">
            <p className="max-w-sm text-sm font-semibold leading-7 text-white/65">{data.supportingText}</p>
            <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
              {stats.slice(0, 3).map((item) => (
                <div key={`${item.label}-${item.value}`} className="bg-[#100C2A]/78 p-5 backdrop-blur-xl">
                  <div className="text-lg font-black text-[#FFD500]">{item.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/48">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button type="button" onClick={() => onNavigate('#marcas')} className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-white/55 transition hover:text-white" aria-label="Continuar a marcas">
        <span className="flex flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em]">
          Descubrir
          <ChevronDown className="h-5 w-5 motion-safe:animate-bounce" />
        </span>
      </button>
    </SceneShell>
  );
}

function BrandScene({ block, onNavigate }) {
  const data = block.data || {};
  const brands = Array.isArray(data.brands) ? data.brands : [];

  return (
    <SceneShell id="marcas" className="bg-white">
      <div className="mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
        <div>
          <SceneKicker>{data.eyebrow || 'Experiencia multimarca'}</SceneKicker>
          <h2 className="max-w-3xl text-[clamp(2.8rem,6vw,6.4rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#111327]">
            {data.title}
          </h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p>
          <button type="button" onClick={() => onNavigate('#servicios')} className="mt-8 inline-flex items-center gap-3 text-sm font-black text-[#3217F6]">
            Ver cómo cuidamos cada vehículo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute -inset-7 rounded-[44px] bg-[#3217F6]/7" />
          <div className="relative overflow-hidden rounded-[38px] bg-[#151042] p-6 shadow-[0_38px_90px_rgba(32,20,96,0.20)] sm:p-9">
            <div className="absolute inset-0 opacity-25">
              <img src={data.imageUrl || '/images/sobre_nosotros.png'} alt="Experiencia de taller" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[#151042]/80" />
            </div>
            <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
              {brands.map((brand, index) => (
                <div key={brand} className="group flex min-h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/7 px-4 text-center backdrop-blur transition hover:-translate-y-1 hover:border-[#FFD500]/45 hover:bg-white/12">
                  <span className="text-sm font-black tracking-[-0.02em] text-white/80 group-hover:text-white">{brand}</span>
                  <span className="absolute mt-16 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFD500]/0 transition group-hover:text-[#FFD500]/80">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function ServicesScene({ block, onNavigate }) {
  const data = block.data || {};
  const groups = Array.isArray(data.serviceGroups) ? data.serviceGroups : [];

  return (
    <SceneShell id="servicios" className="bg-[#F3F4FA]">
      <div className="mx-auto flex h-full max-w-[1480px] flex-col justify-center px-6 pb-10 sm:px-10 lg:px-14">
        <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SceneKicker>{data.eyebrow || 'Workshop'}</SceneKicker>
            <h2 className="max-w-3xl text-[clamp(2.6rem,5vw,5.4rem)] font-black leading-[0.92] tracking-[-0.05em] text-[#111327]">{data.title}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p>
        </div>

        <div className="mt-9 grid min-h-0 flex-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {groups.slice(0, 3).map((group, index) => {
            const Icon = iconForServiceIndex[index] || Wrench;
            return (
              <article key={group.title} className="group relative min-h-[190px] overflow-hidden rounded-[32px] bg-[#12142B] shadow-[0_28px_70px_rgba(20,20,50,0.12)]">
                <img src={group.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48 transition duration-700 group-hover:scale-105 group-hover:opacity-58" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,42,0.05),rgba(15,15,42,0.94))]" />
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
                  <span className="mb-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FFD500] backdrop-blur"><Icon className="h-5 w-5" /></span>
                  <div className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD500]">0{index + 1}</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">{group.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/64">{group.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => onNavigate('#diagnostico')} className="inline-flex items-center gap-3 text-sm font-black text-[#3217F6]">
            Siguiente: cómo diagnosticamos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </SceneShell>
  );
}

function DiagnosticScene({ block, onNavigate }) {
  const data = block.data || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];

  return (
    <SceneShell id="diagnostico" tone="dark" className="bg-[#100A39]">
      <div className="absolute inset-y-0 right-0 w-full opacity-32 lg:w-[54%]">
        <img src={data.imageUrl || '/images/galeria_taller.png'} alt="Diagnóstico automotriz" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#100A39_0%,rgba(16,10,57,0.36)_55%,rgba(16,10,57,0.72)_100%)]" />
      </div>
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center px-6 pb-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        <div className="relative z-10 max-w-3xl">
          <SceneKicker inverted>{data.eyebrow}</SceneKicker>
          <h2 className="text-[clamp(2.8rem,6vw,6.2rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-white/62">{data.subtitle}</p>
          <div className="mt-9 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
                <div className="text-[10px] font-black text-[#FFD500]">0{index + 1}</div>
                <div className="mt-3 text-sm font-black text-white">{step}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate('#proceso')} className="mt-8 inline-flex items-center gap-3 text-sm font-black text-[#FFD500]">
            Ver el proceso completo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </SceneShell>
  );
}

function ProcessScene({ block, onNavigate }) {
  const data = block.data || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];

  return (
    <SceneShell id="proceso" className="bg-white">
      <div className="mx-auto flex h-full max-w-[1480px] flex-col justify-center px-6 pb-10 sm:px-10 lg:px-14">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SceneKicker>{data.eyebrow}</SceneKicker>
            <h2 className="max-w-4xl text-[clamp(2.6rem,5vw,5.5rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#111327]">{data.title}</h2>
          </div>
          <div className="hidden items-center justify-end gap-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 lg:flex">
            <Gauge className="h-5 w-5 text-[#3217F6]" />
            Claridad de principio a fin
          </div>
        </div>

        <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-[#3217F6]/24 to-transparent lg:block" />
          {steps.slice(0, 6).map((step) => (
            <article key={step.number} className="relative rounded-[26px] border border-slate-200 bg-[#F7F8FC] p-5 transition hover:-translate-y-1 hover:border-[#3217F6]/25 hover:bg-white hover:shadow-[0_20px_50px_rgba(31,22,95,0.10)] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black tracking-[-0.05em] text-[#3217F6]">{step.number}</span>
                <CheckCircle2 className="h-5 w-5 text-[#FFD500]" />
              </div>
              <h3 className="mt-5 text-xl font-black text-[#15172B]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
            </article>
          ))}
        </div>

        <button type="button" onClick={() => onNavigate('#nosotros')} className="mt-7 ml-auto inline-flex items-center gap-3 text-sm font-black text-[#3217F6]">
          Conocer Gallo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </SceneShell>
  );
}

function ExperienceScene({ block, onNavigate }) {
  const data = block.data || {};
  const features = Array.isArray(data.features) ? data.features : [];

  return (
    <SceneShell id="nosotros" tone="dark" className="bg-[#17113F]">
      <div className="absolute inset-0">
        <img src={data.imageUrl || '/images/sobre_nosotros.png'} alt="Gallo Autos" className="h-full w-full object-cover opacity-22" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#17113F_12%,rgba(50,23,246,0.88)_58%,rgba(23,17,63,0.92)_100%)]" />
      </div>
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-14">
        <div>
          <SceneKicker inverted>{data.eyebrow}</SceneKicker>
          <h2 className="max-w-5xl text-[clamp(3rem,6vw,6.5rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/68">{data.body}</p>
        </div>
        <div className="grid gap-3">
          {features.slice(0, 3).map((feature, index) => (
            <div key={feature.title} className="rounded-[26px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFD500] font-black text-[#17113F]">0{index + 1}</span>
                <div>
                  <h3 className="text-lg font-black text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{feature.body}</p>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onNavigate('#evidencia')} className="mt-4 inline-flex items-center justify-end gap-3 text-sm font-black text-[#FFD500]">
            Ver evidencia
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </SceneShell>
  );
}

function EvidenceScene({ block, onNavigate }) {
  const data = block.data || {};

  return (
    <SceneShell id="evidencia" className="bg-[#F7F8FC]">
      <div className="mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
        <div>
          <SceneKicker>{data.eyebrow}</SceneKicker>
          <h2 className="max-w-4xl text-[clamp(2.8rem,5.5vw,5.8rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#111327]">{data.title}</h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#3217F6]/15 bg-white px-4 py-3 text-xs font-black text-[#3217F6] shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Evidence-first · no fake testimonials
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[40px] bg-[#14162B] shadow-[0_34px_90px_rgba(26,26,58,0.18)]">
          <img src={data.imageUrl || '/images/galeria_planchado.png'} alt="Trabajo automotriz" className="h-[48vh] min-h-[340px] w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111327] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD500]">Reserved evidence frame</div>
            <div className="mt-3 text-2xl font-black">Vehículo → problema → intervención → resultado</div>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate('#contacto')} className="absolute bottom-8 right-8 hidden items-center gap-3 text-sm font-black text-[#3217F6] lg:inline-flex">
          Hablar con Gallo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </SceneShell>
  );
}

function ContactScene({ block, onNavigate }) {
  const data = block.data || {};
  const hours = Array.isArray(data.hours) ? data.hours : [];
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address || 'Av. La Molina 724, La Molina, Lima')}`;

  return (
    <SceneShell id="contacto" tone="dark" className="bg-[#0E0A29]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(50,23,246,0.40),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,213,0,0.09),transparent_24%)]" />
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div>
          <SceneKicker inverted>{data.eyebrow}</SceneKicker>
          <h2 className="max-w-4xl text-[clamp(3rem,6vw,6.5rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/62">{data.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-full bg-[#FFD500] px-6 py-4 text-sm font-black text-[#17113F] transition hover:-translate-y-1">
              <MapPin className="h-4 w-4" />
              Ver ubicación
            </a>
            <button type="button" onClick={() => onNavigate('#inicio')} className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/7 px-6 py-4 text-sm font-black text-white transition hover:bg-white/12">
              Volver al inicio
            </button>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/12 bg-white/7 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4 border-b border-white/10 pb-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#3217F6] text-white"><MapPin className="h-5 w-5" /></span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD500]">Taller</div>
              <div className="mt-2 text-xl font-black text-white">{data.address}</div>
            </div>
          </div>
          <div className="flex items-start gap-4 py-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#FFD500]"><Clock3 className="h-5 w-5" /></span>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Horario</div>
              {hours.map((item) => <div key={item} className="text-sm font-bold text-white/80">{item}</div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#FFD500]/20 bg-[#FFD500]/8 p-4 text-xs leading-6 text-[#FFF4AF]">
            {data.note}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function FinalScene({ block, onNavigate }) {
  const data = block.data || {};

  return (
    <SceneShell id="final" tone="dark" className="bg-[#17113F]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[72vw] w-[72vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[48vw] w-[48vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFD500]/12" />
        <div className="absolute left-1/2 top-1/2 h-[24vw] w-[24vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3217F6]/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex h-full max-w-[1180px] flex-col items-center justify-center px-6 pb-10 text-center sm:px-10">
        <div className="mb-7 grid h-16 w-16 place-items-center rounded-full border border-white/12 bg-white/8 text-[#FFD500]"><Car className="h-7 w-7" /></div>
        <SceneKicker inverted>{data.eyebrow || 'Gallo Autos Workshop'}</SceneKicker>
        <h2 className="max-w-5xl text-[clamp(3rem,7vw,7rem)] font-black leading-[0.86] tracking-[-0.06em] text-white">{data.title}</h2>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-white/45">{data.note}</p>
        <button type="button" onClick={() => onNavigate('#inicio')} className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#FFD500] px-6 py-4 text-sm font-black text-[#17113F] transition hover:-translate-y-1">
          Recorrer nuevamente
          <ArrowRight className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </SceneShell>
  );
}

function UnsupportedScene({ block }) {
  return (
    <SceneShell id={block.id || 'scene'}>
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 text-center">
        <div>
          <Sparkles className="mx-auto h-7 w-7 text-[#3217F6]" />
          <h2 className="mt-5 text-3xl font-black text-[#111327]">{block.data?.title || block.id}</h2>
          <p className="mt-3 text-sm text-slate-500">Este bloque existe en el contrato, pero todavía no tiene una proyección visual Gallo.</p>
        </div>
      </div>
    </SceneShell>
  );
}

function GalloScene({ block, onNavigate }) {
  const variant = block.layout?.variant || block.data?.variant;

  if (variant === 'gallo_workshop_hero') return <HeroScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_brand_scene') return <BrandScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_services_scene') return <ServicesScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_diagnostic_scene') return <DiagnosticScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_process_scene') return <ProcessScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_experience_scene') return <ExperienceScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_evidence_scene') return <EvidenceScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_contact_scene') return <ContactScene block={block} onNavigate={onNavigate} />;
  if (variant === 'gallo_final_scene') return <FinalScene block={block} onNavigate={onNavigate} />;
  return <UnsupportedScene block={block} />;
}

export function GalloWorkshopLanding({ payload }) {
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const blocks = useMemo(() => sortLandingBlocks(content?.blocks), [content]);
  const sceneRootRef = useRef(null);
  const [activeScene, setActiveScene] = useState('inicio');

  const onNavigate = (href) => {
    const id = String(href || '').replace('#', '');
    if (!id) return;
    const root = sceneRootRef.current;
    const target = root?.querySelector(`#${CSS.escape(id)}`) || document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const root = sceneRootRef.current;
    if (!root) return undefined;

    const sceneElements = Array.from(root.querySelectorAll('[data-gallo-scene]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target?.getAttribute('data-gallo-scene');
        if (id) setActiveScene(id);
      },
      { root, threshold: [0.55, 0.72, 0.9] },
    );

    sceneElements.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, [blocks.length]);

  if (!content) {
    return <div className="grid min-h-screen place-items-center bg-[#F7F8FC] text-slate-500">Landing Gallo no disponible.</div>;
  }

  return (
    <main
      className="h-[100dvh] overflow-hidden bg-[#F7F8FC]"
      style={{ '--gallo-primary': content.theme?.primary || FALLBACK_PRIMARY, '--gallo-accent': content.theme?.accent || FALLBACK_ACCENT }}
    >
      <GalloHeader navigation={content.navigation} activeScene={activeScene} onNavigate={onNavigate} />
      <div ref={sceneRootRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {blocks.map((block) => (
          <GalloScene key={block.id} block={block} onNavigate={onNavigate} />
        ))}
      </div>
    </main>
  );
}
