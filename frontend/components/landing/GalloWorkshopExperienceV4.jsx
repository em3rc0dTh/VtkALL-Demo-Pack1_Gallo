'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  MapPin,
  Paintbrush,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { sortLandingBlocks } from '@/lib/landing/landingContract';
import styles from './GalloWorkshopExperienceV3.module.css';

const ELECTRIC_BLUE = '#1741ff';
const YELLOW = '#ffd400';
const INK = '#05070f';
const PAPER = '#f7f8fc';
const cx = (...values) => values.filter(Boolean).join(' ');
const serviceIcons = [Wrench, ScanLine, Paintbrush];

const sceneIdByVariant = {
  gallo_workshop_hero: 'inicio',
  gallo_partners_scene: 'confianza',
  gallo_services_scene: 'servicios',
  gallo_diagnostic_scene: 'diagnostico',
  gallo_process_scene: 'proceso',
  gallo_experience_scene: 'nosotros',
  gallo_evidence_scene: 'evidencia',
  gallo_contact_scene: 'contacto',
};

const navLabelByVariant = {
  gallo_workshop_hero: 'Inicio',
  gallo_partners_scene: 'Confianza',
  gallo_services_scene: 'Servicios',
  gallo_diagnostic_scene: 'Diagnóstico',
  gallo_process_scene: 'Proceso',
  gallo_experience_scene: 'Nosotros',
  gallo_evidence_scene: 'Evidencia',
  gallo_contact_scene: 'Contacto',
};

const sceneIdForBlock = (block) => {
  const variant = block?.layout?.variant || block?.data?.variant;
  return sceneIdByVariant[variant] || block?.id || 'scene';
};

const safeAlign = (value) => ['left', 'center', 'right'].includes(value) ? value : 'left';
const safeMediaMode = (value) => ['background', 'side', 'none'].includes(value) ? value : 'background';
const isVideoUrl = (url = '') => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url);

function VisualMedia({ src, alt = '', className = '', videoClassName = '', imageClassName = '', eager = false }) {
  if (!src) return null;
  const mediaClassName = cx(className, isVideoUrl(src) ? videoClassName : imageClassName);
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={mediaClassName}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || undefined}
      />
    );
  }
  return <img src={src} alt={alt} className={mediaClassName} loading={eager ? 'eager' : 'lazy'} />;
}

function Scene({ id, block, children, dark = false, className = '' }) {
  const align = safeAlign(block?.layout?.align);
  const media = safeMediaMode(block?.layout?.media);
  const density = block?.layout?.density === 'compact' ? 'compact' : 'comfortable';
  return (
    <section
      id={id}
      data-gallo-scene={id}
      data-gallo-align={align}
      data-gallo-media={media}
      data-gallo-density={density}
      className={cx(
        'relative h-[100dvh] w-full overflow-hidden',
        dark ? 'bg-[#05070f] text-white' : 'bg-[#f7f8fc] text-[#080b19]',
        className,
      )}
    >
      <div className={cx('h-full overflow-hidden pt-20 md:pt-24', density === 'compact' && 'md:pt-20')}>
        {children}
      </div>
    </section>
  );
}

function Kicker({ children, dark = false, align = 'left' }) {
  return (
    <div className={cx(
      'mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] sm:text-[11px]',
      dark ? 'text-[#ffd400]' : 'text-[#1741ff]',
      align === 'center' && 'justify-center',
      align === 'right' && 'justify-end',
    )}>
      <span className={cx('h-px w-9', dark ? 'bg-[#ffd400]' : 'bg-[#1741ff]')} />
      {children}
    </div>
  );
}

function alignmentClasses(align) {
  if (align === 'center') return 'text-center items-center';
  if (align === 'right') return 'text-right items-end';
  return 'text-left items-start';
}

function Header({ navigation, activeScene, navigate, homeSceneId, actionSceneId, actionLabel }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,#1741ff_0%,#0c2dbb_34%,#05070f_76%)] text-white shadow-[0_14px_42px_rgba(3,14,60,0.22)]">
      <div className="mx-auto flex h-20 max-w-[1540px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <button type="button" onClick={() => navigate(homeSceneId)} className="group flex items-center text-left" aria-label="Volver al inicio">
          <img src="/brand/gallo-autos-logo.svg" alt="Gallo Autos" className="h-12 w-auto max-w-[168px] object-contain transition group-hover:scale-[1.02]" />
        </button>
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Navegación de Gallo Autos">
          {navigation.map((item) => {
            const id = String(item.href || '').replace('#', '');
            const active = activeScene === id;
            return (
              <button
                key={`${item.label}-${item.href}`}
                type="button"
                onClick={() => navigate(id)}
                className={cx('relative py-3 text-xs font-bold transition hover:text-white', active ? 'text-white' : 'text-white/62')}
              >
                {item.label}
                <span className={cx('absolute inset-x-0 -bottom-[17px] h-0.5 origin-left bg-[#ffd400] transition-transform', active ? 'scale-x-100' : 'scale-x-0')} />
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => navigate(actionSceneId)}
          className="inline-flex items-center gap-2 rounded-full bg-[#ffd400] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#05070f] shadow-[0_12px_36px_rgba(255,212,0,0.26)] transition hover:-translate-y-0.5 sm:px-5 sm:text-xs"
        >
          {actionLabel || 'Contactar a Gallo'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function Hero({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const layout = block.layout || {};
  const align = safeAlign(layout.align);
  const mediaMode = safeMediaMode(layout.media);
  const sideMedia = mediaMode === 'side';
  const mediaUrl = data.heroMediaUrl || '/images/galeria_taller.png';

  return (
    <Scene id="inicio" block={block} dark className="bg-[#05070f]">
      {mediaMode === 'background' ? (
        <div className="absolute inset-0">
          <VisualMedia src={mediaUrl} alt="Taller automotriz Gallo Autos" eager className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,15,0.98)_0%,rgba(5,15,50,0.96)_30%,rgba(23,65,255,0.62)_68%,rgba(5,7,15,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgba(23,65,255,0.72),transparent_36%)]" />
        </div>
      ) : null}
      <div className="relative z-10 mx-auto grid h-full max-w-[1540px] grid-rows-[minmax(0,1fr)_auto] px-6 pb-5 pt-5 sm:px-10 lg:px-14 lg:pb-6">
        <div className={cx('grid min-h-0 items-center gap-8', sideMedia && 'lg:grid-cols-[0.9fr_1.1fr]')}>
          <div className={cx('flex max-w-[820px] flex-col self-center', alignmentClasses(align))}>
            <Kicker dark align={align}>{data.eyebrow || 'Gallo Autos Workshop'}</Kicker>
            <h1 className="max-w-[820px] text-[clamp(2.7rem,5.25vw,5.5rem)] font-black leading-[0.88] tracking-[-0.06em] text-white">{data.title}</h1>
            <p className="mt-5 max-w-2xl text-sm font-bold leading-6 text-white sm:text-base">{data.titleHighlight}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64 sm:text-base">{data.subtitle}</p>
            <div className={cx('mt-6 flex flex-wrap gap-3', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
              {data.primaryCta ? (
                <button type="button" onClick={() => navigate('contacto')} className="inline-flex items-center gap-2 rounded-full bg-[#ffd400] px-5 py-3 text-sm font-black text-[#05070f] transition hover:-translate-y-0.5">
                  {data.primaryCta}<ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
              {data.secondaryCta ? (
                <button type="button" onClick={() => navigate('servicios')} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.07] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.12]">
                  {data.secondaryCta}
                </button>
              ) : null}
            </div>
          </div>
          {sideMedia ? (
            <div className="hidden h-[58vh] min-h-[360px] overflow-hidden rounded-[36px] border border-white/12 bg-[#080b19] shadow-[0_30px_90px_rgba(0,0,0,0.28)] lg:block">
              <VisualMedia src={mediaUrl} alt="Taller automotriz Gallo Autos" eager className="h-full w-full object-cover opacity-88" />
            </div>
          ) : null}
        </div>
        <div className="grid items-end gap-4 border-t border-white/10 pt-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <p className={cx('text-sm font-semibold leading-6 text-white/78', align === 'center' && 'text-center', align === 'right' && 'text-right')}>{data.supportingText}</p>
          <button type="button" onClick={() => navigate(fallbackNext)} className="hidden shrink-0 flex-col items-center gap-1.5 text-white/58 transition hover:text-white lg:flex" aria-label="Continuar">
            <span className="text-[9px] font-bold uppercase tracking-[0.26em]">Scroll para descubrir</span>
            <ChevronDown className="h-5 w-5 motion-safe:animate-bounce" />
          </button>
          <div className="hidden justify-self-end lg:block">
            <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/16 bg-[#05070f]/66 backdrop-blur-xl">
              {stats.slice(0, 3).map((item) => (
                <div key={`${item.label}-${item.value}`} className="min-w-0 border-r border-white/12 px-4 py-3 last:border-r-0">
                  <div className="whitespace-nowrap text-sm font-black text-[#ffd400]">{item.value}</div>
                  <div className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function PartnerPill({ label, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <div className={cx(
      'flex h-20 min-w-[180px] items-center justify-center rounded-[22px] border px-6 text-center text-sm font-black uppercase tracking-[0.045em] transition duration-300 hover:-translate-y-1 sm:min-w-[210px] sm:text-base',
      dark
        ? 'border-white/14 bg-white/[0.07] text-white shadow-[0_16px_34px_rgba(0,0,0,0.16)] hover:border-[#ffd400]/50 hover:bg-[#1741ff]/22'
        : 'border-[#1741ff]/12 bg-white text-[#08133b] shadow-[0_18px_38px_rgba(17,48,130,0.09)] hover:border-[#1741ff]/42 hover:text-[#1741ff]',
    )}>{label}</div>
  );
}

function Marquee({ items, reverse = false, tone = 'light' }) {
  const duplicated = [...items, ...items];
  return (
    <div className={cx('group relative overflow-hidden', styles.marqueeViewport)}>
      <div className={cx(styles.marqueeTrack, reverse ? styles.marqueeReverse : styles.marqueeForward)}>
        {duplicated.map((item, index) => <PartnerPill key={`${item}-${index}`} label={item} tone={tone} />)}
      </div>
    </div>
  );
}

function Partners({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const brands = Array.isArray(data.brands) ? data.brands : [];
  const insurers = Array.isArray(data.insurers) ? data.insurers : [];
  const midpoint = Math.ceil(brands.length / 2);
  const firstLane = brands.slice(0, midpoint);
  const secondLane = brands.slice(midpoint);
  const align = safeAlign(block.layout?.align);
  return (
    <Scene id="confianza" block={block}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(23,65,255,0.12),transparent_28%),radial-gradient(circle_at_8%_92%,rgba(255,212,0,0.10),transparent_24%)]" />
      <div className="relative mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-7 sm:px-10 lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker align={align}>{data.eyebrow || 'Confianza que nos respalda'}</Kicker>
          <h2 className="max-w-[1000px] text-[clamp(2.4rem,4.35vw,4.7rem)] font-black leading-[0.92] tracking-[-0.055em] text-[#080b19]">{data.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p>
        </div>
        <div className="mt-6 space-y-3">
          <Marquee items={firstLane.length ? firstLane : ['Gallo Autos']} />
          <Marquee items={secondLane.length ? secondLane : firstLane} reverse />
        </div>
        <div className="mt-5 rounded-[30px] bg-[#05070f] px-5 py-5 text-white shadow-[0_28px_70px_rgba(6,18,65,0.18)] sm:px-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#ffd400]"><ShieldCheck className="h-4 w-4" />Aseguradoras</div>
            <button type="button" onClick={() => navigate(fallbackNext)} className="hidden items-center gap-2 text-xs font-black text-[#ffd400] sm:inline-flex">Continuar<ArrowRight className="h-4 w-4" /></button>
          </div>
          <Marquee items={insurers.length ? insurers : ['Consulta tu aseguradora']} reverse tone="dark" />
        </div>
      </div>
    </Scene>
  );
}

function Services({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const groups = Array.isArray(data.serviceGroups) ? data.serviceGroups : [];
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMediaMode(block.layout?.media);
  return (
    <Scene id="servicios" block={block} className="bg-[#f3f6ff]">
      <div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.35rem,4.5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p>
        </div>
        <div className="mt-6 grid min-h-0 flex-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {groups.slice(0, 3).map((group, index) => {
            const Icon = serviceIcons[index] || Wrench;
            return (
              <article key={`${group.title}-${index}`} className="group relative min-h-[180px] overflow-hidden rounded-[32px] bg-[#080b19] shadow-[0_28px_70px_rgba(10,25,80,0.14)]">
                {mediaMode !== 'none' ? <VisualMedia src={group.imageUrl} alt={group.title || ''} className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-62" /> : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,15,0.06),rgba(5,7,15,0.96))]" />
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">
                  <span className="mb-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-[#1741ff] text-[#ffd400]"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-xl font-black text-white">{group.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/64">{group.description}</p>
                </div>
              </article>
            );
          })}
        </div>
        <button type="button" onClick={() => navigate(fallbackNext)} className="mt-5 inline-flex items-center justify-end gap-2 self-end text-sm font-black text-[#1741ff]">Continuar<ArrowRight className="h-4 w-4" /></button>
      </div>
    </Scene>
  );
}

function Diagnostic({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMediaMode(block.layout?.media);
  const hasSide = mediaMode !== 'none';
  return (
    <Scene id="diagnostico" block={block} dark>
      <div className={cx('mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', hasSide && 'lg:grid-cols-[1fr_1fr]')}>
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker dark align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.5rem,5vw,5.2rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/68">{data.subtitle}</p>
          <div className={cx('mt-7 flex flex-wrap gap-2', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
            {steps.map((step, index) => <span key={`${step}-${index}`} className="rounded-full border border-white/12 bg-white/[0.07] px-4 py-2 text-xs font-black text-white/78">{String(index + 1).padStart(2, '0')} · {step}</span>)}
          </div>
          <button type="button" onClick={() => navigate(fallbackNext)} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#ffd400]">Continuar<ArrowRight className="h-4 w-4" /></button>
        </div>
        {hasSide ? (
          <div className="relative hidden h-[54vh] min-h-[330px] overflow-hidden rounded-[38px] border border-white/10 bg-[#08133b] shadow-[0_36px_90px_rgba(0,0,0,0.28)] lg:block">
            <VisualMedia src={data.imageUrl || '/images/galeria_taller.png'} alt="Diagnóstico automotriz" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070f]/70 via-transparent to-transparent" />
          </div>
        ) : null}
      </div>
    </Scene>
  );
}

function Process({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const align = safeAlign(block.layout?.align);
  return (
    <Scene id="proceso" block={block} className="bg-white">
      <div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-5xl text-[clamp(2.35rem,4.6vw,4.9rem)] font-black leading-[0.92] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {steps.slice(0, 6).map((step, index) => (
            <div key={`${step.number}-${step.title}-${index}`} className="rounded-[28px] border border-[#1741ff]/10 bg-[#f7f8fc] p-5 shadow-[0_18px_44px_rgba(30,55,120,0.06)]">
              <div className="text-xs font-black text-[#1741ff]">{step.number || String(index + 1).padStart(2, '0')}</div>
              <h3 className="mt-3 text-lg font-black text-[#080b19]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => navigate(fallbackNext)} className="mt-5 inline-flex items-center justify-end gap-2 self-end text-sm font-black text-[#1741ff]">Continuar<ArrowRight className="h-4 w-4" /></button>
      </div>
    </Scene>
  );
}

function Experience({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const features = Array.isArray(data.features) ? data.features : [];
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMediaMode(block.layout?.media);
  const sideMedia = mediaMode === 'side';
  const mediaUrl = data.imageUrl || '/images/sobre_nosotros.png';
  return (
    <Scene id="nosotros" block={block} dark>
      {mediaMode === 'background' ? (
        <div className="absolute inset-0">
          <VisualMedia src={mediaUrl} alt="Gallo Autos" className="h-full w-full object-cover opacity-28" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,#05070f_12%,rgba(23,65,255,0.94)_58%,rgba(5,7,15,0.94)_100%)]" />
        </div>
      ) : null}
      <div className={cx('relative mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', sideMedia && 'lg:grid-cols-[1fr_0.9fr]')}>
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker dark align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-5xl text-[clamp(2.6rem,5.1vw,5.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72">{data.body}</p>
          <div className="mt-7 grid w-full gap-3 sm:grid-cols-3">
            {features.slice(0, 3).map((feature, index) => (
              <div key={`${feature.title}-${index}`} className="rounded-[24px] border border-white/12 bg-[#05070f]/38 p-4 backdrop-blur-xl">
                <div className="text-xs font-black text-[#ffd400]">0{index + 1}</div>
                <h3 className="mt-2 text-base font-black text-white">{feature.title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/65">{feature.body}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate(fallbackNext)} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#ffd400]">Continuar<ArrowRight className="h-4 w-4" /></button>
        </div>
        {sideMedia ? <div className="hidden h-[56vh] overflow-hidden rounded-[38px] border border-white/12 lg:block"><VisualMedia src={mediaUrl} alt="Gallo Autos" className="h-full w-full object-cover" /></div> : null}
      </div>
    </Scene>
  );
}

function Evidence({ block, navigate, fallbackNext }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMediaMode(block.layout?.media);
  return (
    <Scene id="evidencia" block={block}>
      <div className={cx('mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', mediaMode !== 'none' && 'lg:grid-cols-[0.92fr_1.08fr]')}>
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.45rem,4.8vw,5.1rem)] font-black leading-[0.91] tracking-[-0.05em] text-[#080b19]">{data.title}</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p>
          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#1741ff]/15 bg-white px-4 py-3 text-xs font-black text-[#1741ff] shadow-sm"><ShieldCheck className="h-4 w-4" />Evidencia real antes que testimonios inventados</div>
          <button type="button" onClick={() => navigate(fallbackNext)} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#1741ff]">Continuar<ArrowRight className="h-4 w-4" /></button>
        </div>
        {mediaMode !== 'none' ? (
          <div className="relative hidden h-[52vh] min-h-[320px] overflow-hidden rounded-[40px] bg-[#080b19] shadow-[0_34px_90px_rgba(10,25,80,0.18)] lg:block">
            <VisualMedia src={data.imageUrl || '/images/galeria_planchado.png'} alt="Trabajo automotriz" className="h-full w-full object-cover opacity-78" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ffd400]">Caso real · estructura reservada</div>
              <div className="mt-3 text-2xl font-black">Vehículo → problema → intervención → resultado</div>
            </div>
          </div>
        ) : null}
      </div>
    </Scene>
  );
}

function Contact({ block, navigate, homeSceneId }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const hours = Array.isArray(data.hours) ? data.hours : [];
  const address = data.address || 'Av. La Molina 724, La Molina, Lima';
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <Scene id="contacto" block={block} dark>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(23,65,255,0.62),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(255,212,0,0.11),transparent_24%)]" />
      <div className="relative mx-auto grid h-full max-w-[1540px] items-center gap-10 px-6 pb-8 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}>
          <Kicker dark align={align}>{data.eyebrow}</Kicker>
          <h2 className="max-w-4xl text-[clamp(2.7rem,5.2vw,5.6rem)] font-black leading-[0.9] tracking-[-0.055em] text-white">{data.title}</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/66">{data.subtitle}</p>
          <div className={cx('mt-7 flex flex-wrap gap-3', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-full bg-[#ffd400] px-6 py-4 text-sm font-black text-[#05070f] transition hover:-translate-y-1"><MapPin className="h-4 w-4" />{data.primaryCta || 'Ver ubicación'}</a>
            <button type="button" onClick={() => navigate(homeSceneId)} className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.12]">Volver al inicio</button>
          </div>
        </div>
        <div className="rounded-[36px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4 border-b border-white/10 pb-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1741ff] text-white"><MapPin className="h-5 w-5" /></span>
            <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd400]">Taller</div><div className="mt-2 text-xl font-black text-white">{address}</div></div>
          </div>
          <div className="flex items-start gap-4 py-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffd400]"><Clock3 className="h-5 w-5" /></span>
            <div className="space-y-2"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Horario</div>{hours.map((item) => <div key={item} className="text-sm font-bold text-white/80">{item}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-xs leading-6 text-[#fff4af]">{data.note}</div>
        </div>
      </div>
    </Scene>
  );
}

function Unknown({ block }) {
  return (
    <Scene id={block.id || 'scene'} block={block}>
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 text-center">
        <div><Sparkles className="mx-auto h-7 w-7 text-[#1741ff]" /><h2 className="mt-5 text-3xl font-black text-[#080b19]">{block.data?.title || block.id}</h2><p className="mt-3 text-sm text-slate-500">Bloque contractual todavía sin proyección visual Gallo.</p></div>
      </div>
    </Scene>
  );
}

function RenderScene({ block, navigate, fallbackNext, homeSceneId }) {
  const data = block.data || {};
  const variant = block.layout?.variant || data.variant;
  if (variant === 'gallo_workshop_hero') return <Hero block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_partners_scene') return <Partners block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_services_scene') return <Services block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_diagnostic_scene') return <Diagnostic block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_process_scene') return <Process block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_experience_scene') return <Experience block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_evidence_scene') return <Evidence block={block} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_contact_scene') return <Contact block={block} navigate={navigate} homeSceneId={homeSceneId} />;
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
          className={cx('h-2.5 rounded-full border transition-all duration-300', index === activeIndex ? 'w-7 border-[#ffd400] bg-[#ffd400]' : 'w-2.5 border-white/35 bg-[#05070f]/55 hover:border-[#1741ff] hover:bg-[#1741ff]')}
        />
      ))}
    </div>
  );
}

export function GalloWorkshopExperience({ payload }) {
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const blocks = useMemo(() => sortLandingBlocks(content?.blocks), [content]);
  const sceneIds = useMemo(() => blocks.map(sceneIdForBlock), [blocks]);
  const navigation = useMemo(() => blocks.flatMap((block) => {
    const variant = block?.layout?.variant || block?.data?.variant;
    const id = sceneIdByVariant[variant];
    const label = navLabelByVariant[variant];
    return id && label ? [{ label, href: `#${id}` }] : [];
  }), [blocks]);
  const contactBlock = useMemo(() => blocks.find((block) => sceneIdForBlock(block) === 'contacto'), [blocks]);
  const homeSceneId = sceneIds[0] || 'inicio';
  const actionSceneId = sceneIds.includes('contacto') ? 'contacto' : (sceneIds[sceneIds.length - 1] || homeSceneId);
  const actionLabel = contactBlock?.data?.primaryCta || 'Contactar a Gallo';
  const initialHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const [activeSceneId, setActiveSceneId] = useState(() => sceneIds.includes(initialHash) ? initialHash : homeSceneId);
  const [direction, setDirection] = useState(1);
  const touchStartYRef = useRef(null);
  const lastTransitionAtRef = useRef(0);

  const activeIndex = Math.max(0, sceneIds.indexOf(activeSceneId));
  const activeScene = sceneIds[activeIndex] || homeSceneId;

  useEffect(() => {
    if (!sceneIds.length) return;
    if (!sceneIds.includes(activeSceneId)) setActiveSceneId(sceneIds[0]);
  }, [sceneIds, activeSceneId]);

  const goToIndex = (nextIndex) => {
    if (!sceneIds.length) return;
    const bounded = Math.max(0, Math.min(sceneIds.length - 1, nextIndex));
    const nextId = sceneIds[bounded];
    if (!nextId || nextId === activeScene) return;
    const now = Date.now();
    if (now - lastTransitionAtRef.current < 620) return;
    lastTransitionAtRef.current = now;
    setDirection(bounded > activeIndex ? 1 : -1);
    setActiveSceneId(nextId);
  };

  const navigate = (id) => {
    const nextIndex = sceneIds.indexOf(id);
    if (nextIndex < 0 || id === activeScene) return;
    lastTransitionAtRef.current = 0;
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveSceneId(id);
  };

  useEffect(() => {
    if (!activeScene || typeof window === 'undefined') return;
    window.history.replaceState(null, '', `#${activeScene}`);
  }, [activeScene]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
        event.preventDefault();
        goToIndex(activeIndex + 1);
      } else if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
        event.preventDefault();
        goToIndex(activeIndex - 1);
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
  }, [activeIndex, activeScene, sceneIds]);

  if (!content || !blocks.length) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8fc] text-slate-500">Landing Gallo no disponible.</div>;
  }

  return (
    <main
      className="relative h-[100dvh] overflow-hidden bg-[#f7f8fc]"
      style={{ '--gallo-electric-blue': ELECTRIC_BLUE, '--gallo-yellow': YELLOW, '--gallo-ink': INK, '--gallo-paper': PAPER }}
      onWheel={(event) => {
        if (Math.abs(event.deltaY) < 24) return;
        goToIndex(activeIndex + (event.deltaY > 0 ? 1 : -1));
      }}
      onTouchStart={(event) => { touchStartYRef.current = event.touches?.[0]?.clientY ?? null; }}
      onTouchEnd={(event) => {
        const startY = touchStartYRef.current;
        const endY = event.changedTouches?.[0]?.clientY;
        touchStartYRef.current = null;
        if (typeof startY !== 'number' || typeof endY !== 'number') return;
        const distance = startY - endY;
        if (Math.abs(distance) < 44) return;
        goToIndex(activeIndex + (distance > 0 ? 1 : -1));
      }}
    >
      <Header navigation={navigation} activeScene={activeScene} navigate={navigate} homeSceneId={homeSceneId} actionSceneId={actionSceneId} actionLabel={actionLabel} />
      <SceneRail sceneIds={sceneIds} activeIndex={activeIndex} navigate={navigate} />
      <div className="relative h-[100dvh] w-full overflow-hidden">
        {blocks.map((block, index) => {
          const active = sceneIdForBlock(block) === activeScene;
          const behind = index < activeIndex;
          const offsetClass = active ? 'z-10 translate-y-0 scale-100 opacity-100' : behind ? 'pointer-events-none z-0 -translate-y-10 scale-[0.985] opacity-0' : 'pointer-events-none z-0 translate-y-10 scale-[0.985] opacity-0';
          const fallbackNext = sceneIds[Math.min(index + 1, sceneIds.length - 1)] || homeSceneId;
          return (
            <div
              key={block.id}
              aria-hidden={!active}
              data-scene-state={active ? 'active' : behind ? 'previous' : 'next'}
              className={cx('absolute inset-0 transform-gpu transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]', offsetClass)}
              style={{ transformOrigin: direction > 0 ? 'center bottom' : 'center top' }}
            >
              <RenderScene block={block} navigate={navigate} fallbackNext={fallbackNext} homeSceneId={homeSceneId} />
            </div>
          );
        })}
      </div>
    </main>
  );
}
