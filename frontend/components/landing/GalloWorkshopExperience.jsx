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

const ELECTRIC_BLUE = '#1741ff';
const YELLOW = '#ffd400';
const INK = '#05070f';
const PAPER = '#f7f8fc';
const cx = (...values) => values.filter(Boolean).join(' ');
const serviceIcons = [Wrench, ScanLine, Paintbrush];

const sceneIdByVariant = {
  gallo_workshop_hero: 'inicio',
  gallo_brand_scene: 'marcas',
  gallo_insurance_scene: 'aseguradoras',
  gallo_services_scene: 'servicios',
  gallo_diagnostic_scene: 'diagnostico',
  gallo_process_scene: 'proceso',
  gallo_experience_scene: 'nosotros',
  gallo_evidence_scene: 'evidencia',
  gallo_contact_scene: 'contacto',
  gallo_final_scene: 'final',
};

function sceneIdForBlock(block) {
  const variant = block?.layout?.variant || block?.data?.variant;
  return sceneIdByVariant[variant] || block?.id || 'scene';
}

function Scene({ id, children, dark = false, className = '' }) {
  return (
    <section
      id={id}
      data-gallo-scene={id}
      className={cx(
        'relative h-[100dvh] w-full overflow-hidden',
        dark ? 'bg-[#05070f] text-white' : 'bg-[#f7f8fc] text-[#101322]',
        className,
      )}
    >
      <div className="h-full overflow-hidden pt-20 md:pt-24">{children}</div>
    </section>
  );
}

function Kicker({ children, dark = false }) {
  return (
    <div className={cx('mb-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em]', dark ? 'text-[#ffd400]' : 'text-[#1741ff]')}>
      <span className={cx('h-px w-10', dark ? 'bg-[#ffd400]' : 'bg-[#1741ff]')} />
      {children}
    </div>
  );
}

function Header({ navigation = [], activeScene, navigate }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#05070f]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <button type="button" onClick={() => navigate('inicio')} className="group flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-[#1741ff] text-[#ffd400] transition group-hover:rotate-6 group-hover:scale-105">
            <Wrench className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.16em]">Gallo Autos</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Workshop</span>
          </span>
        </button>

        <nav className="hidden items-center gap-5 lg:flex">
          {navigation.map((item) => {
            const id = String(item.href || '').replace('#', '');
            const active = activeScene === id;
            return (
              <button
                key={`${item.label}-${item.href}`}
                type="button"
                onClick={() => navigate(id)}
                className={cx('relative py-3 text-xs font-bold transition hover:text-white', active ? 'text-white' : 'text-white/55')}
              >
                {item.label}
                <span className={cx('absolute inset-x-0 -bottom-[17px] h-0.5 origin-left bg-[#ffd400] transition-transform', active ? 'scale-x-100' : 'scale-x-0')} />
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => navigate('contacto')}
          className="inline-flex items-center gap-2 rounded-full bg-[#ffd400] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#05070f] shadow-[0_12px_36px_rgba(255,212,0,0.22)] transition hover:-translate-y-0.5 sm:px-5"
        >
          Solicitar cita
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function Hero({ data, navigate }) {
  const stats = Array.isArray(data.stats) ? data.stats : [];
  return (
    <Scene id="inicio" dark className="bg-[#05070f]">
      <div className="absolute inset-0">
        <img src={data.heroMediaUrl || '/images/galeria_taller.png'} alt="Taller automotriz" className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,15,0.99)_0%,rgba(5,14,50,0.96)_39%,rgba(23,65,255,0.58)_72%,rgba(5,7,15,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(23,65,255,0.55),transparent_35%)]" />
      </div>
      <div className="pointer-events-none absolute -right-16 top-[18%] h-[440px] w-[440px] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-14 top-[27%] h-[260px] w-[260px] rounded-full border border-[#ffd400]/40 motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute right-[19%] top-[42%] h-2 w-2 rounded-full bg-[#ffd400] shadow-[0_0_50px_18px_rgba(255,212,0,0.42)]" />

      <div className="relative z-10 mx-auto grid h-full max-w-[1480px] items-center gap-12 px-6 pb-14 pt-6 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div className="max-w-4xl">
          <Kicker dark>{data.eyebrow || 'Gallo Autos Workshop'}</Kicker>
          <h1 className="max-w-5xl text-[clamp(2.8rem,6.6vw,7rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h1>
          <p className="mt-6 max-w-3xl text-[clamp(1rem,1.45vw,1.25rem)] font-semibold leading-8 text-white/75">{data.titleHighlight}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">{data.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('contacto')} className="group inline-flex items-center gap-3 rounded-full bg-[#ffd400] px-6 py-4 text-sm font-black text-[#05070f] transition hover:-translate-y-1">
              {data.primaryCta || 'Solicitar una cita'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => navigate('servicios')} className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
              {data.secondaryCta || 'Explorar servicios'}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden self-end pb-14 lg:block">
          <div className="ml-auto w-full max-w-[480px] border-l border-white/15 pl-8">
            <p className="max-w-sm text-sm font-semibold leading-7 text-white/70">{data.supportingText}</p>
            <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
              {stats.slice(0, 3).map((item) => (
                <div key={`${item.label}-${item.value}`} className="bg-[#060b1d]/90 p-5 backdrop-blur-xl">
                  <div className="text-lg font-black text-[#ffd400]">{item.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button type="button" onClick={() => navigate('marcas')} className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-white/55 transition hover:text-white" aria-label="Continuar a marcas">
        <span className="flex flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em]">
          Scroll para descubrir
          <ChevronDown className="h-5 w-5 motion-safe:animate-bounce" />
        </span>
      </button>
    </Scene>
  );
}

function Brands({ data, navigate }) {
  const brands = Array.isArray(data.brands) ? data.brands : [];
  return (
    <Scene id="marcas" className="bg-white">
      <div className="mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
        <div>
          <Kicker>{data.eyebrow}</Kicker>
          <h2 className="max-w-3xl text-[clamp(2.7rem,5.7vw,6rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p>
          <button type="button" onClick={() => navigate('aseguradoras')} className="mt-8 inline-flex items-center gap-3 text-sm font-black text-[#1741ff]">
            Ver alianzas con aseguradoras
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <div className="absolute -inset-7 rounded-[44px] bg-[#1741ff]/10" />
          <div className="relative overflow-hidden rounded-[38px] bg-[#07112e] p-6 shadow-[0_38px_90px_rgba(10,35,120,0.20)] sm:p-9">
            <div className="absolute inset-0 opacity-20">
              <img src={data.imageUrl || '/images/sobre_nosotros.png'} alt="Experiencia de taller" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[#07112e]/85" />
            </div>
            <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
              {brands.map((brand, index) => (
                <div key={brand} className="group relative flex min-h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 text-center backdrop-blur transition hover:-translate-y-1 hover:border-[#ffd400]/50 hover:bg-[#1741ff]/25">
                  <span className="text-sm font-black text-white/85 group-hover:text-white">{brand}</span>
                  <span className="absolute bottom-3 right-3 text-[9px] font-bold tracking-[0.18em] text-[#ffd400]/0 transition group-hover:text-[#ffd400]/80">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function InsurancePartners({ data, navigate }) {
  const partners = Array.isArray(data.partners) ? data.partners : [];
  return (
    <Scene id="aseguradoras" dark className="bg-[#05070f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(23,65,255,0.42),transparent_32%),linear-gradient(120deg,#05070f_16%,#07112e_68%,#05070f_100%)]" />
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
        <div>
          <Kicker dark>{data.eyebrow || 'Aseguradoras'}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.8rem,5.8vw,6.2rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/65">{data.subtitle}</p>
          <button type="button" onClick={() => navigate('servicios')} className="mt-8 inline-flex items-center gap-3 text-sm font-black text-[#ffd400]">
            Continuar a servicios
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-[38px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:p-8">
          {partners.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {partners.map((partner) => (
                <div key={partner} className="grid min-h-32 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-center transition hover:border-[#ffd400]/45 hover:bg-[#1741ff]/20">
                  <span className="text-base font-black text-white">{partner}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[330px] flex-col justify-between rounded-[30px] border border-[#1741ff]/35 bg-[#07112e] p-7 sm:p-9">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1741ff] text-white"><ShieldCheck className="h-7 w-7" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ffd400]">Partner data gate</div>
                <h3 className="mt-4 text-2xl font-black text-white">Componente listo. Lista vigente pendiente de confirmación.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">Publicaremos logos y nombres sólo cuando Gallo confirme qué aseguradoras mantiene actualmente como aliadas.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

function Services({ data, navigate }) {
  const groups = Array.isArray(data.serviceGroups) ? data.serviceGroups : [];
  return (
    <Scene id="servicios" className="bg-[#f3f6ff]">
      <div className="mx-auto flex h-full max-w-[1480px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14">
        <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Kicker>{data.eyebrow}</Kicker>
            <h2 className="max-w-3xl text-[clamp(2.5rem,4.8vw,5.2rem)] font-black leading-[0.92] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p>
        </div>
        <div className="mt-8 grid min-h-0 flex-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {groups.slice(0, 3).map((group, index) => {
            const Icon = serviceIcons[index] || Wrench;
            return (
              <article key={group.title} className="group relative min-h-[180px] overflow-hidden rounded-[32px] bg-[#080b19] shadow-[0_28px_70px_rgba(10,25,80,0.14)]">
                <img src={group.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-60" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,15,0.05),rgba(5,7,15,0.95))]" />
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
                  <span className="mb-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-[#1741ff] text-[#ffd400]"><Icon className="h-5 w-5" /></span>
                  <div className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffd400]">0{index + 1}</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">{group.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/65">{group.description}</p>
                </div>
              </article>
            );
          })}
        </div>
        <button type="button" onClick={() => navigate('diagnostico')} className="mt-5 ml-auto inline-flex items-center gap-3 text-sm font-black text-[#1741ff]">
          Siguiente: cómo diagnosticamos
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Scene>
  );
}

function Diagnostic({ data, navigate }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  return (
    <Scene id="diagnostico" dark className="bg-[#05070f]">
      <div className="absolute inset-y-0 right-0 w-full opacity-35 lg:w-[54%]">
        <img src={data.imageUrl || '/images/galeria_taller.png'} alt="Diagnóstico automotriz" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070f_0%,rgba(7,17,46,0.45)_55%,rgba(23,65,255,0.48)_100%)]" />
      </div>
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center px-6 pb-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        <div className="relative z-10 max-w-3xl">
          <Kicker dark>{data.eyebrow}</Kicker>
          <h2 className="text-[clamp(2.8rem,5.8vw,6rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-white/65">{data.subtitle}</p>
          <div className="mt-9 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-[#1741ff]/15 p-4 backdrop-blur">
                <div className="text-[10px] font-black text-[#ffd400]">0{index + 1}</div>
                <div className="mt-3 text-sm font-black text-white">{step}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate('proceso')} className="mt-8 inline-flex items-center gap-3 text-sm font-black text-[#ffd400]">
            Ver el proceso completo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Scene>
  );
}

function Process({ data, navigate }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  return (
    <Scene id="proceso" className="bg-white">
      <div className="mx-auto flex h-full max-w-[1480px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Kicker>{data.eyebrow}</Kicker>
            <h2 className="max-w-4xl text-[clamp(2.5rem,4.8vw,5.2rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          </div>
          <div className="hidden items-center justify-end gap-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 lg:flex">
            <Gauge className="h-5 w-5 text-[#1741ff]" />
            Claridad de principio a fin
          </div>
        </div>
        <div className="relative mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-[#1741ff]/25 to-transparent lg:block" />
          {steps.slice(0, 6).map((step) => (
            <article key={step.number} className="relative rounded-[26px] border border-slate-200 bg-[#f7f8fc] p-5 transition hover:-translate-y-1 hover:border-[#1741ff]/30 hover:bg-white hover:shadow-[0_20px_50px_rgba(23,65,255,0.10)] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black tracking-[-0.05em] text-[#1741ff]">{step.number}</span>
                <CheckCircle2 className="h-5 w-5 text-[#ffd400]" />
              </div>
              <h3 className="mt-5 text-xl font-black text-[#080b19]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
            </article>
          ))}
        </div>
        <button type="button" onClick={() => navigate('nosotros')} className="mt-6 ml-auto inline-flex items-center gap-3 text-sm font-black text-[#1741ff]">
          Conocer Gallo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Scene>
  );
}

function Experience({ data, navigate }) {
  const features = Array.isArray(data.features) ? data.features : [];
  return (
    <Scene id="nosotros" dark className="bg-[#05070f]">
      <div className="absolute inset-0">
        <img src={data.imageUrl || '/images/sobre_nosotros.png'} alt="Gallo Autos" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#05070f_12%,rgba(23,65,255,0.92)_58%,rgba(5,7,15,0.95)_100%)]" />
      </div>
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-14">
        <div>
          <Kicker dark>{data.eyebrow}</Kicker>
          <h2 className="max-w-5xl text-[clamp(2.9rem,5.8vw,6.2rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/72">{data.body}</p>
        </div>
        <div className="grid gap-3">
          {features.slice(0, 3).map((feature, index) => (
            <div key={feature.title} className="rounded-[26px] border border-white/12 bg-[#05070f]/35 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ffd400] font-black text-[#05070f]">0{index + 1}</span>
                <div>
                  <h3 className="text-lg font-black text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{feature.body}</p>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => navigate('evidencia')} className="mt-4 inline-flex items-center justify-end gap-3 text-sm font-black text-[#ffd400]">
            Ver evidencia
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Scene>
  );
}

function Evidence({ data, navigate }) {
  return (
    <Scene id="evidencia">
      <div className="mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14">
        <div>
          <Kicker>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.7rem,5.3vw,5.6rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#1741ff]/15 bg-white px-4 py-3 text-xs font-black text-[#1741ff] shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Evidence-first · no fake testimonials
          </div>
          <button type="button" onClick={() => navigate('contacto')} className="mt-8 flex items-center gap-3 text-sm font-black text-[#1741ff]">
            Hablar con Gallo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="relative overflow-hidden rounded-[40px] bg-[#080b19] shadow-[0_34px_90px_rgba(10,25,80,0.18)]">
          <img src={data.imageUrl || '/images/galeria_planchado.png'} alt="Trabajo automotriz" className="h-[48vh] min-h-[300px] w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ffd400]">Reserved evidence frame</div>
            <div className="mt-3 text-2xl font-black">Vehículo → problema → intervención → resultado</div>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function Contact({ data, navigate }) {
  const hours = Array.isArray(data.hours) ? data.hours : [];
  const address = data.address || 'Av. La Molina 724, La Molina, Lima';
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <Scene id="contacto" dark className="bg-[#05070f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(23,65,255,0.48),transparent_31%),radial-gradient(circle_at_82%_70%,rgba(255,212,0,0.10),transparent_24%)]" />
      <div className="relative mx-auto grid h-full max-w-[1480px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div>
          <Kicker dark>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.9rem,5.8vw,6.2rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/65">{data.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-full bg-[#ffd400] px-6 py-4 text-sm font-black text-[#05070f] transition hover:-translate-y-1">
              <MapPin className="h-4 w-4" />
              Ver ubicación
            </a>
            <button type="button" onClick={() => navigate('inicio')} className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.12]">
              Volver al inicio
            </button>
          </div>
        </div>
        <div className="rounded-[36px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4 border-b border-white/10 pb-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1741ff] text-white"><MapPin className="h-5 w-5" /></span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd400]">Taller</div>
              <div className="mt-2 text-xl font-black text-white">{address}</div>
            </div>
          </div>
          <div className="flex items-start gap-4 py-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffd400]"><Clock3 className="h-5 w-5" /></span>
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Horario</div>
              {hours.map((item) => <div key={item} className="text-sm font-bold text-white/80">{item}</div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-xs leading-6 text-[#fff4af]">{data.note}</div>
        </div>
      </div>
    </Scene>
  );
}

function Final({ data, navigate }) {
  return (
    <Scene id="final" dark className="bg-[#05070f]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[72vw] w-[72vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[48vw] w-[48vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffd400]/10" />
        <div className="absolute left-1/2 top-1/2 h-[24vw] w-[24vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1741ff]/30 blur-3xl" />
      </div>
      <div className="relative mx-auto flex h-full max-w-[1180px] flex-col items-center justify-center px-6 pb-8 text-center sm:px-10">
        <div className="mb-7 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-[#1741ff] text-[#ffd400]"><Car className="h-7 w-7" /></div>
        <Kicker dark>{data.eyebrow}</Kicker>
        <h2 className="max-w-5xl text-[clamp(2.9rem,6.5vw,6.7rem)] font-black leading-[0.86] tracking-[-0.06em] text-white">{data.title}</h2>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-white/50">{data.note}</p>
        <button type="button" onClick={() => navigate('inicio')} className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#ffd400] px-6 py-4 text-sm font-black text-[#05070f] transition hover:-translate-y-1">
          Recorrer nuevamente
          <ArrowRight className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </Scene>
  );
}

function Unknown({ block }) {
  return (
    <Scene id={block.id || 'scene'}>
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 text-center">
        <div>
          <Sparkles className="mx-auto h-7 w-7 text-[#1741ff]" />
          <h2 className="mt-5 text-3xl font-black text-[#080b19]">{block.data?.title || block.id}</h2>
          <p className="mt-3 text-sm text-slate-500">Bloque contractual todavía sin proyección visual Gallo.</p>
        </div>
      </div>
    </Scene>
  );
}

function RenderScene({ block, navigate }) {
  const data = block.data || {};
  const variant = block.layout?.variant || data.variant;
  if (variant === 'gallo_workshop_hero') return <Hero data={data} navigate={navigate} />;
  if (variant === 'gallo_brand_scene') return <Brands data={data} navigate={navigate} />;
  if (variant === 'gallo_insurance_scene') return <InsurancePartners data={data} navigate={navigate} />;
  if (variant === 'gallo_services_scene') return <Services data={data} navigate={navigate} />;
  if (variant === 'gallo_diagnostic_scene') return <Diagnostic data={data} navigate={navigate} />;
  if (variant === 'gallo_process_scene') return <Process data={data} navigate={navigate} />;
  if (variant === 'gallo_experience_scene') return <Experience data={data} navigate={navigate} />;
  if (variant === 'gallo_evidence_scene') return <Evidence data={data} navigate={navigate} />;
  if (variant === 'gallo_contact_scene') return <Contact data={data} navigate={navigate} />;
  if (variant === 'gallo_final_scene') return <Final data={data} navigate={navigate} />;
  return <Unknown block={block} />;
}

function SceneRail({ sceneIds, activeIndex, navigate }) {
  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex">
      {sceneIds.map((id, index) => (
        <button
          key={id}
          type="button"
          aria-label={`Ir a sección ${index + 1}`}
          onClick={() => navigate(id)}
          className={cx(
            'h-2.5 rounded-full border transition-all duration-300',
            index === activeIndex ? 'w-7 border-[#ffd400] bg-[#ffd400]' : 'w-2.5 border-white/30 bg-[#05070f]/50 hover:border-[#1741ff] hover:bg-[#1741ff]',
          )}
        />
      ))}
    </div>
  );
}

export function GalloWorkshopExperience({ payload }) {
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const blocks = useMemo(() => sortLandingBlocks(content?.blocks), [content]);
  const sceneIds = useMemo(() => blocks.map(sceneIdForBlock), [blocks]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartYRef = useRef(null);
  const lastTransitionAtRef = useRef(0);

  const activeScene = sceneIds[activeIndex] || 'inicio';

  const goToIndex = (nextIndex) => {
    const bounded = Math.max(0, Math.min(sceneIds.length - 1, nextIndex));
    if (bounded === activeIndex) return;
    const now = Date.now();
    if (now - lastTransitionAtRef.current < 620) return;
    lastTransitionAtRef.current = now;
    setDirection(bounded > activeIndex ? 1 : -1);
    setActiveIndex(bounded);
  };

  const navigate = (id) => {
    const nextIndex = sceneIds.indexOf(id);
    if (nextIndex < 0 || nextIndex === activeIndex) return;
    lastTransitionAtRef.current = 0;
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const stepScene = (delta) => {
    if (!delta) return;
    goToIndex(activeIndex + delta);
  };

  useEffect(() => {
    if (!sceneIds.length) return;
    const requested = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    const requestedIndex = sceneIds.indexOf(requested);
    if (requestedIndex >= 0) setActiveIndex(requestedIndex);
  }, [sceneIds]);

  useEffect(() => {
    const id = sceneIds[activeIndex];
    if (!id || typeof window === 'undefined') return;
    window.history.replaceState(null, '', `#${id}`);
  }, [activeIndex, sceneIds]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const nextKeys = ['ArrowDown', 'PageDown'];
      const previousKeys = ['ArrowUp', 'PageUp'];
      if (nextKeys.includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
        event.preventDefault();
        stepScene(1);
      } else if (previousKeys.includes(event.key) || (event.key === ' ' && event.shiftKey)) {
        event.preventDefault();
        stepScene(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        navigate(sceneIds[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        navigate(sceneIds[sceneIds.length - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!content) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8fc] text-slate-500">Landing Gallo no disponible.</div>;
  }

  return (
    <main
      className="relative h-[100dvh] overflow-hidden bg-[#f7f8fc]"
      style={{ '--gallo-electric-blue': ELECTRIC_BLUE, '--gallo-yellow': YELLOW, '--gallo-ink': INK, '--gallo-paper': PAPER }}
      onWheel={(event) => {
        if (Math.abs(event.deltaY) < 24) return;
        stepScene(event.deltaY > 0 ? 1 : -1);
      }}
      onTouchStart={(event) => {
        touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
      }}
      onTouchEnd={(event) => {
        const startY = touchStartYRef.current;
        const endY = event.changedTouches?.[0]?.clientY;
        touchStartYRef.current = null;
        if (typeof startY !== 'number' || typeof endY !== 'number') return;
        const distance = startY - endY;
        if (Math.abs(distance) < 44) return;
        stepScene(distance > 0 ? 1 : -1);
      }}
    >
      <Header navigation={content.navigation} activeScene={activeScene} navigate={navigate} />
      <SceneRail sceneIds={sceneIds} activeIndex={activeIndex} navigate={navigate} />

      <div className="relative h-[100dvh] w-full overflow-hidden">
        {blocks.map((block, index) => {
          const active = index === activeIndex;
          const behind = index < activeIndex;
          const offsetClass = active
            ? 'z-10 translate-y-0 scale-100 opacity-100'
            : behind
              ? 'pointer-events-none z-0 -translate-y-10 scale-[0.985] opacity-0'
              : 'pointer-events-none z-0 translate-y-10 scale-[0.985] opacity-0';
          return (
            <div
              key={block.id}
              aria-hidden={!active}
              data-scene-state={active ? 'active' : behind ? 'previous' : 'next'}
              className={cx('absolute inset-0 transform-gpu transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]', offsetClass)}
              style={{ transformOrigin: direction > 0 ? 'center bottom' : 'center top' }}
            >
              <RenderScene block={block} navigate={navigate} />
            </div>
          );
        })}
      </div>
    </main>
  );
}
