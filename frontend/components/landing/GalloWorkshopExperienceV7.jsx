'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  Paintbrush,
  Phone,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { sortLandingBlocks } from '@/lib/landing/landingContract';
import {
  formatGalloAddress,
  galloHoursLines,
  projectGalloBusinessProfile,
  projectGalloCatalogGroups,
} from '@/lib/landing/galloAuthorityProjection';
import { normalizeServicePresentation } from '@/lib/landing/galloPresentationRegistry';
import {
  normalizeSectionInstances,
  sectionInstanceFor,
  sectionNavigation,
} from '@/lib/landing/galloSectionInstances';
import styles from './GalloWorkshopExperienceV3.module.css';

const cx = (...values) => values.filter(Boolean).join(' ');
const isVideoUrl = (url = '') => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url);
const safeAlign = (value) => ['left', 'center', 'right'].includes(value) ? value : 'left';
const safeMedia = (value) => ['background', 'side', 'none'].includes(value) ? value : 'background';
const serviceIcons = [Wrench, ScanLine, Paintbrush];

function VisualMedia({ src, alt = '', className = '', eager = false }) {
  if (!src) return null;
  if (isVideoUrl(src)) {
    return <video src={src} className={className} autoPlay muted loop playsInline preload="metadata" aria-label={alt || undefined} />;
  }
  return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} />;
}

function alignmentClasses(align) {
  if (align === 'center') return 'items-center text-center';
  if (align === 'right') return 'items-end text-right';
  return 'items-start text-left';
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

function SceneFrame({ block, instance, children, dark = false, className = '' }) {
  const align = safeAlign(block?.layout?.align);
  const media = safeMedia(block?.layout?.media);
  const density = block?.layout?.density === 'compact' ? 'compact' : 'comfortable';
  return (
    <section
      id={instance.anchor}
      data-gallo-scene={instance.anchor}
      data-semantic-family={instance.semanticFamily}
      data-instance-motion={instance.motion}
      data-instance-depth={instance.depth}
      data-gallo-align={align}
      data-gallo-media={media}
      data-gallo-density={density}
      className={cx(
        'gallo-instance-shell relative h-[100dvh] w-full overflow-hidden',
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

function Header({ navigation, activeScene, navigate, homeSceneId, actionSceneId, actionLabel, business }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,#1741ff_0%,#0c2dbb_34%,#05070f_76%)] text-white shadow-[0_14px_42px_rgba(3,14,60,0.22)]">
      <div className="mx-auto flex h-20 max-w-[1540px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <button type="button" onClick={() => navigate(homeSceneId)} className="group flex shrink-0 items-center text-left" aria-label={`Volver al inicio de ${business.displayName}`}>
          {business.logoUrl ? <img src={business.logoUrl} alt={business.displayName} className="h-12 w-auto max-w-[168px] object-contain transition group-hover:scale-[1.02]" /> : <span className="text-base font-black">{business.displayName}</span>}
        </button>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto px-3 xl:flex" aria-label={`Navegación de ${business.displayName}`}>
          {navigation.map((item) => {
            const id = String(item.href || '').replace('#', '');
            const active = activeScene === id;
            return (
              <button key={`${item.label}-${item.href}`} type="button" onClick={() => navigate(id)} className={cx('relative shrink-0 py-3 text-xs font-bold transition hover:text-white', active ? 'text-white' : 'text-white/62')}>
                {item.label}
                <span className={cx('absolute inset-x-0 -bottom-[17px] h-0.5 origin-left bg-[#ffd400] transition-transform', active ? 'scale-x-100' : 'scale-x-0')} />
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={() => navigate(actionSceneId)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffd400] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#05070f] shadow-[0_12px_36px_rgba(255,212,0,0.26)] transition hover:-translate-y-0.5 sm:px-5 sm:text-xs">
          {actionLabel || 'Contactar a Gallo'}<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function HeroSection({ block, instance, business, navigate, fallbackNext }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMedia(block.layout?.media);
  const mediaUrl = data.heroMediaUrl || '/images/galeria_taller.png';
  const stats = Array.isArray(data.stats) ? data.stats : [];
  return (
    <SceneFrame block={block} instance={instance} dark>
      {mediaMode === 'background' ? <><VisualMedia src={mediaUrl} alt={`Taller ${business.displayName}`} eager className="absolute inset-0 h-full w-full object-cover opacity-68" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,15,.98),rgba(10,28,102,.90)_45%,rgba(23,65,255,.58),rgba(5,7,15,.82))]" /></> : null}
      <div className={cx('relative z-10 mx-auto grid h-full max-w-[1540px] items-center gap-8 px-6 pb-8 sm:px-10 lg:px-14', mediaMode === 'side' && 'lg:grid-cols-[.92fr_1.08fr]')}>
        <div className={cx('flex max-w-[850px] flex-col', alignmentClasses(align))}>
          <Kicker dark align={align}>{data.eyebrow || `${business.displayName} Workshop`}</Kicker>
          <h1 className="text-[clamp(2.8rem,5.25vw,5.6rem)] font-black leading-[.88] tracking-[-.06em] text-white">{data.title}</h1>
          {business.tagline ? <p className="mt-5 max-w-2xl text-base font-black text-white">{business.tagline}</p> : null}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66 sm:text-base">{data.subtitle}</p>
          <div className={cx('mt-6 flex flex-wrap gap-3', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
            {data.primaryCta ? <button type="button" onClick={() => navigate('contacto')} className="rounded-full bg-[#ffd400] px-5 py-3 text-sm font-black text-[#05070f]">{data.primaryCta}</button> : null}
            {data.secondaryCta ? <button type="button" onClick={() => navigate('servicios')} className="rounded-full border border-white/20 bg-white/[.08] px-5 py-3 text-sm font-black text-white">{data.secondaryCta}</button> : null}
          </div>
          {stats.length ? <div className="mt-7 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-white/12 bg-black/20 backdrop-blur-xl">{stats.slice(0, 3).map((item) => <div key={`${item.label}-${item.value}`} className="border-r border-white/10 px-4 py-3 last:border-r-0"><div className="font-black text-[#ffd400]">{item.value}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-white/52">{item.label}</div></div>)}</div> : null}
          <button type="button" onClick={() => navigate(fallbackNext)} className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-white/60">Continuar<ChevronDown className="h-4 w-4" /></button>
        </div>
        {mediaMode === 'side' ? <div className="hidden h-[58vh] overflow-hidden rounded-[38px] border border-white/10 lg:block"><VisualMedia src={mediaUrl} alt="Taller Gallo" className="h-full w-full object-cover" /></div> : null}
      </div>
    </SceneFrame>
  );
}

function PartnerPill({ label, dark = false }) {
  return <div className={cx('flex h-20 min-w-[185px] items-center justify-center rounded-[22px] border px-5 text-center text-sm font-black uppercase tracking-[.04em]', dark ? 'border-white/14 bg-white/[.07] text-white' : 'border-[#1741ff]/12 bg-white text-[#08133b] shadow-[0_18px_38px_rgba(17,48,130,.08)]')}>{label}</div>;
}

function Marquee({ items, reverse = false, dark = false }) {
  const safe = items.length ? items : ['Gallo Autos'];
  return <div className={cx('overflow-hidden', styles.marqueeViewport)}><div className={cx(styles.marqueeTrack, reverse ? styles.marqueeReverse : styles.marqueeForward)}>{[...safe, ...safe].map((item, index) => <PartnerPill key={`${item}-${index}`} label={item} dark={dark} />)}</div></div>;
}

function PartnersSection({ block, instance, navigate, fallbackNext }) {
  const data = block.data || {};
  const brands = Array.isArray(data.brands) ? data.brands : [];
  const insurers = Array.isArray(data.insurers) ? data.insurers : [];
  const midpoint = Math.ceil(brands.length / 2);
  const align = safeAlign(block.layout?.align);
  return (
    <SceneFrame block={block} instance={instance}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(23,65,255,.12),transparent_28%),radial-gradient(circle_at_8%_92%,rgba(255,212,0,.10),transparent_24%)]" />
      <div className="relative mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-7 sm:px-10 lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-5xl text-[clamp(2.4rem,4.4vw,4.8rem)] font-black leading-[.92] tracking-[-.055em]">{data.title}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p></div>
        <div className="mt-6 space-y-3"><Marquee items={brands.slice(0, midpoint)} /><Marquee items={brands.slice(midpoint)} reverse /></div>
        <div className="mt-5 rounded-[30px] bg-[#05070f] px-6 py-5 text-white"><div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#ffd400]"><ShieldCheck className="h-4 w-4" />Aseguradoras</span><button type="button" onClick={() => navigate(fallbackNext)} className="text-xs font-black text-[#ffd400]">Continuar</button></div><Marquee items={insurers} reverse dark /></div>
      </div>
    </SceneFrame>
  );
}

function OfferingMeta({ offering, presentation }) {
  const pieces = [];
  if (presentation.showPrice && offering.priceLabel) pieces.push(offering.priceLabel);
  if (presentation.showDuration && offering.durationMinutes) pieces.push(`${offering.durationMinutes} min`);
  return <>{offering.name}{pieces.length ? ` · ${pieces.join(' · ')}` : ''}</>;
}

function ServiceGroupCard({ group, index, presentation }) {
  const Icon = serviceIcons[index % serviceIcons.length] || Wrench;
  const textMode = presentation.displayMode === 'text';
  return (
    <article className={cx('gallo-depth-card group relative overflow-hidden rounded-[30px] border', textMode ? 'border-[#1741ff]/12 bg-white p-6 text-[#080b19] shadow-sm' : 'border-white/5 bg-[#080b19] text-white shadow-[0_28px_70px_rgba(10,25,80,.14)]', presentation.displayMode === 'compact' && 'rounded-[22px]')}>
      {!textMode && presentation.showImage && group.imageUrl ? <VisualMedia src={group.imageUrl} alt={group.title || ''} className="absolute inset-0 h-full w-full object-cover opacity-42 transition duration-700 group-hover:scale-105" /> : null}
      {!textMode ? <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,15,.1),rgba(5,7,15,.98))]" /> : null}
      <div className={cx('relative flex h-full flex-col', textMode ? '' : 'justify-end p-6')}>
        {!textMode ? <span className="mb-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#1741ff] text-[#ffd400]"><Icon className="h-5 w-5" /></span> : null}
        <h3 className={cx('font-black', textMode ? 'text-xl' : 'mt-5 text-xl text-white')}>{group.title}</h3>
        {presentation.showDescription && group.description ? <p className={cx('mt-2 text-sm leading-6', textMode ? 'text-slate-500' : 'text-white/64')}>{group.description}</p> : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {group.offerings.map((offering) => <span key={offering.id} className={cx('rounded-full px-2.5 py-1 text-[10px] font-bold', textMode ? 'border border-[#1741ff]/12 bg-[#1741ff]/5 text-[#1741ff]' : 'border border-white/12 bg-white/[.08] text-white/82')}><OfferingMeta offering={offering} presentation={presentation} /></span>)}
          {!group.offerings.length ? <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold text-amber-500">Sin ofertas públicas activas</span> : null}
        </div>
      </div>
    </article>
  );
}

function ServicesSection({ block, instance, catalogOfferings, navigate, fallbackNext }) {
  const data = block.data || {};
  const presentation = normalizeServicePresentation(data.presentation || {});
  const groups = projectGalloCatalogGroups({ groups: data.serviceGroups || [], catalogOfferings });
  const align = safeAlign(block.layout?.align);
  const mode = presentation.displayMode;
  const containerClass = mode === 'list'
    ? 'flex flex-col gap-3 overflow-y-auto pr-1'
    : ['carousel', 'rail'].includes(mode)
      ? 'flex gap-4 overflow-x-auto overflow-y-hidden pb-3 snap-x snap-mandatory'
      : 'grid gap-4';
  const gridStyle = ['cards', 'compact', 'text', 'featured-grid'].includes(mode) ? { gridTemplateColumns: `repeat(${presentation.columns}, minmax(0, 1fr))` } : undefined;
  return (
    <SceneFrame block={block} instance={instance} className="bg-[#f3f6ff]">
      <div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14">
        <div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.35rem,4.5vw,4.8rem)] font-black leading-[.92] tracking-[-.05em]">{data.title}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{data.subtitle}</p></div>
        <div className={cx('mt-6 min-h-0 flex-1', containerClass)} style={gridStyle} data-service-display={mode}>
          {groups.map((group, index) => <div key={`${group.category}-${index}`} className={cx(['carousel', 'rail'].includes(mode) && 'snap-start', mode === 'carousel' && 'w-[min(78vw,430px)] shrink-0', mode === 'rail' && 'w-[min(70vw,330px)] shrink-0', mode === 'featured-grid' && index === 0 && 'lg:col-span-2')}><ServiceGroupCard group={group} index={index} presentation={presentation} /></div>)}
        </div>
        <button type="button" onClick={() => navigate(fallbackNext)} className="mt-4 inline-flex items-center justify-end gap-2 self-end text-sm font-black text-[#1741ff]">Continuar<ArrowRight className="h-4 w-4" /></button>
      </div>
    </SceneFrame>
  );
}

function DiagnosticSection({ block, instance, navigate, fallbackNext }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMedia(block.layout?.media);
  const steps = Array.isArray(data.steps) ? data.steps : [];
  return <SceneFrame block={block} instance={instance} dark><div className={cx('mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', mediaMode !== 'none' && 'lg:grid-cols-2')}><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker dark align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.5rem,5vw,5.2rem)] font-black leading-[.9] tracking-[-.055em]">{data.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-white/68">{data.subtitle}</p><div className="mt-7 flex flex-wrap gap-2">{steps.map((step, index) => <span key={`${step}-${index}`} className="rounded-full border border-white/12 bg-white/[.07] px-4 py-2 text-xs font-black text-white/78">{String(index + 1).padStart(2, '0')} · {step}</span>)}</div><button type="button" onClick={() => navigate(fallbackNext)} className="mt-7 text-left text-sm font-black text-[#ffd400]">Continuar →</button></div>{mediaMode !== 'none' ? <div className="hidden h-[54vh] overflow-hidden rounded-[38px] border border-white/10 lg:block"><VisualMedia src={data.imageUrl || '/images/galeria_taller.png'} alt="Diagnóstico" className="h-full w-full object-cover opacity-82" /></div> : null}</div></SceneFrame>;
}

function ProcessSection({ block, instance, navigate, fallbackNext }) {
  const data = block.data || {};
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const align = safeAlign(block.layout?.align);
  return <SceneFrame block={block} instance={instance} className="bg-white"><div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14"><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-5xl text-[clamp(2.35rem,4.6vw,4.9rem)] font-black leading-[.92] tracking-[-.05em]">{data.title}</h2></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{steps.slice(0, 6).map((step, index) => <div key={`${step.number}-${index}`} className="gallo-depth-card rounded-[28px] border border-[#1741ff]/10 bg-[#f7f8fc] p-5"><div className="text-xs font-black text-[#1741ff]">{step.number || String(index + 1).padStart(2, '0')}</div><h3 className="mt-3 text-lg font-black">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p></div>)}</div><button type="button" onClick={() => navigate(fallbackNext)} className="mt-5 self-end text-sm font-black text-[#1741ff]">Continuar →</button></div></SceneFrame>;
}

function ExperienceSection({ block, instance, navigate, fallbackNext }) {
  const data = block.data || {};
  const features = Array.isArray(data.features) ? data.features : [];
  const mediaMode = safeMedia(block.layout?.media);
  const align = safeAlign(block.layout?.align);
  const mediaUrl = data.imageUrl || '/images/sobre_nosotros.png';
  return <SceneFrame block={block} instance={instance} dark>{mediaMode === 'background' ? <><VisualMedia src={mediaUrl} alt="Gallo Autos" className="absolute inset-0 h-full w-full object-cover opacity-28" /><div className="absolute inset-0 bg-[linear-gradient(110deg,#05070f_12%,rgba(23,65,255,.94)_58%,rgba(5,7,15,.94)_100%)]" /></> : null}<div className={cx('relative mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', mediaMode === 'side' && 'lg:grid-cols-[1fr_.9fr]')}><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker dark align={align}>{data.eyebrow}</Kicker><h2 className="max-w-5xl text-[clamp(2.6rem,5.1vw,5.5rem)] font-black leading-[.9] tracking-[-.055em]">{data.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-white/72">{data.body}</p><div className="mt-7 grid w-full gap-3 sm:grid-cols-3">{features.slice(0, 3).map((feature, index) => <div key={`${feature.title}-${index}`} className="gallo-depth-card rounded-[24px] border border-white/12 bg-[#05070f]/38 p-4 backdrop-blur-xl"><div className="text-xs font-black text-[#ffd400]">0{index + 1}</div><h3 className="mt-2 font-black">{feature.title}</h3><p className="mt-2 text-xs leading-5 text-white/65">{feature.body}</p></div>)}</div><button type="button" onClick={() => navigate(fallbackNext)} className="mt-6 text-sm font-black text-[#ffd400]">Continuar →</button></div>{mediaMode === 'side' ? <div className="hidden h-[56vh] overflow-hidden rounded-[38px] border border-white/12 lg:block"><VisualMedia src={mediaUrl} alt="Gallo Autos" className="h-full w-full object-cover" /></div> : null}</div></SceneFrame>;
}

function EvidenceSection({ block, instance, navigate, fallbackNext }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMedia(block.layout?.media);
  return <SceneFrame block={block} instance={instance}><div className={cx('mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', mediaMode !== 'none' && 'lg:grid-cols-[.92fr_1.08fr]')}><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.45rem,4.8vw,5.1rem)] font-black leading-[.91] tracking-[-.05em]">{data.title}</h2><p className="mt-6 max-w-xl text-base leading-8 text-slate-500">{data.subtitle}</p><div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#1741ff]/15 bg-white px-4 py-3 text-xs font-black text-[#1741ff]"><ShieldCheck className="h-4 w-4" />Evidencia real antes que testimonios inventados</div><button type="button" onClick={() => navigate(fallbackNext)} className="mt-7 text-sm font-black text-[#1741ff]">Continuar →</button></div>{mediaMode !== 'none' ? <div className="hidden h-[52vh] overflow-hidden rounded-[40px] bg-[#080b19] lg:block"><VisualMedia src={data.imageUrl || '/images/galeria_planchado.png'} alt="Trabajo automotriz" className="h-full w-full object-cover opacity-78" /></div> : null}</div></SceneFrame>;
}

function ContactSection({ block, instance, business, navigate, homeSceneId }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const address = formatGalloAddress(business.primaryLocation) || 'Ubicación por configurar';
  const hours = galloHoursLines(business.commercialHours);
  const phone = business.contact?.primaryPhone || business.contact?.phone || '';
  const whatsapp = business.contact?.whatsapp || '';
  const email = business.contact?.email || '';
  return <SceneFrame block={block} instance={instance} dark><div className="mx-auto grid h-full max-w-[1540px] items-center gap-8 px-6 pb-8 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:px-14"><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker dark align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.6rem,5vw,5.4rem)] font-black leading-[.9] tracking-[-.055em]">{data.title}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-white/68">{data.subtitle}</p><div className="mt-7 flex gap-3"><button type="button" className="rounded-full bg-[#ffd400] px-5 py-3 text-sm font-black text-[#05070f]">{data.primaryCta || 'Contactar a Gallo'}</button><button type="button" onClick={() => navigate(homeSceneId)} className="rounded-full border border-white/16 px-5 py-3 text-sm font-black text-white">Volver al inicio</button></div></div><div className="rounded-[34px] border border-white/12 bg-white/[.07] p-6 backdrop-blur-xl"><div className="space-y-4 text-sm text-white/78"><div className="flex gap-3"><MapPin className="h-5 w-5 text-[#ffd400]" />{address}</div>{hours.map((line) => <div key={line} className="flex gap-3"><Clock3 className="h-5 w-5 text-[#ffd400]" />{line}</div>)}{phone ? <div className="flex gap-3"><Phone className="h-5 w-5 text-[#ffd400]" />{phone}</div> : null}{whatsapp ? <div className="flex gap-3"><Phone className="h-5 w-5 text-[#ffd400]" />WhatsApp · {whatsapp}</div> : null}{email ? <div className="flex gap-3"><Mail className="h-5 w-5 text-[#ffd400]" />{email}</div> : null}</div>{data.note ? <div className="mt-6 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-xs leading-6 text-[#fff4af]">{data.note}</div> : null}</div></div></SceneFrame>;
}

function RepeatableSplit({ block, instance, navigate }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  const mediaMode = safeMedia(block.layout?.media);
  const mediaUrl = data.mediaUrl || '';
  return <SceneFrame block={block} instance={instance} className="bg-white"><div className={cx('mx-auto grid h-full max-w-[1540px] items-center gap-9 px-6 pb-8 sm:px-10 lg:px-14', mediaMode !== 'none' && 'lg:grid-cols-2')}><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.4rem,4.7vw,5rem)] font-black leading-[.92] tracking-[-.05em]">{data.title}</h2><p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-8 text-slate-500">{data.body}</p>{data.ctaLabel ? <button type="button" onClick={() => navigate(data.ctaTarget || 'contacto')} className="mt-7 inline-flex items-center gap-2 self-start rounded-full bg-[#1741ff] px-5 py-3 text-sm font-black text-white">{data.ctaLabel}<ArrowRight className="h-4 w-4" /></button> : null}</div>{mediaMode !== 'none' ? <div className="gallo-depth-card hidden h-[56vh] overflow-hidden rounded-[38px] bg-[#080b19] shadow-[0_30px_80px_rgba(10,25,80,.18)] lg:block">{mediaUrl ? <VisualMedia src={mediaUrl} alt={data.title || ''} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white/40"><Sparkles className="h-9 w-9" /></div>}</div> : null}</div></SceneFrame>;
}

function RepeatableEditorial({ block, instance }) {
  const data = block.data || {};
  const align = safeAlign(block.layout?.align);
  return <SceneFrame block={block} instance={instance} className="bg-[#f7f8fc]"><div className="mx-auto flex h-full max-w-5xl items-center px-6 pb-8 sm:px-10"><div className={cx('flex w-full flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-4xl text-[clamp(2.5rem,5vw,5.4rem)] font-black leading-[.9] tracking-[-.055em]">{data.title}</h2><p className="mt-7 max-w-3xl whitespace-pre-line text-lg leading-9 text-slate-600">{data.body}</p>{data.quote ? <blockquote className="gallo-depth-card mt-8 max-w-3xl border-l-4 border-[#ffd400] bg-white p-6 text-xl font-black leading-8 text-[#08133b] shadow-sm">{data.quote}</blockquote> : null}</div></div></SceneFrame>;
}

function RepeatableCards({ block, instance }) {
  const data = block.data || {};
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const align = safeAlign(block.layout?.align);
  return <SceneFrame block={block} instance={instance} className="bg-white"><div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14"><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker align={align}>{data.eyebrow}</Kicker><h2 className="max-w-5xl text-[clamp(2.4rem,4.6vw,4.9rem)] font-black leading-[.92] tracking-[-.05em]">{data.title}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">{data.subtitle}</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card, index) => <article key={`${card.title}-${index}`} className="gallo-depth-card rounded-[28px] border border-[#1741ff]/10 bg-[#f7f8fc] p-6"><div className="text-xs font-black text-[#1741ff]">{String(index + 1).padStart(2, '0')}</div><h3 className="mt-3 text-xl font-black">{card.title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{card.body}</p></article>)}</div></div></SceneFrame>;
}

function RepeatableGallery({ block, instance }) {
  const data = block.data || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const align = safeAlign(block.layout?.align);
  return <SceneFrame block={block} instance={instance} dark><div className="mx-auto flex h-full max-w-[1540px] flex-col justify-center px-6 pb-8 sm:px-10 lg:px-14"><div className={cx('flex flex-col', alignmentClasses(align))}><Kicker dark align={align}>{data.eyebrow}</Kicker><h2 className="max-w-5xl text-[clamp(2.4rem,4.6vw,4.9rem)] font-black leading-[.92] tracking-[-.05em]">{data.title}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-white/62">{data.subtitle}</p></div><div className="mt-7 grid min-h-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, 6).map((item, index) => <figure key={`${item.caption}-${index}`} className="gallo-depth-card relative min-h-[180px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.05]">{item.mediaUrl ? <VisualMedia src={item.mediaUrl} alt={item.caption || ''} className="absolute inset-0 h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white/35"><Sparkles className="h-8 w-8" /></div>}<figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-4 pt-12 text-sm font-black text-white">{item.caption}</figcaption></figure>)}</div></div></SceneFrame>;
}

function RepeatableCta({ block, instance, navigate }) {
  const data = block.data || {};
  const mediaUrl = data.backgroundUrl || '';
  return <SceneFrame block={block} instance={instance} dark>{mediaUrl ? <><VisualMedia src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-36" /><div className="absolute inset-0 bg-[#05070f]/72" /></> : null}<div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 pb-8 text-center"><Kicker dark align="center">{data.eyebrow}</Kicker><h2 className="text-[clamp(2.6rem,5vw,5.3rem)] font-black leading-[.9] tracking-[-.055em]">{data.title}</h2><p className="mt-5 max-w-2xl text-base leading-8 text-white/68">{data.subtitle}</p>{data.ctaLabel ? <button type="button" onClick={() => navigate(data.ctaTarget || 'contacto')} className="mt-7 rounded-full bg-[#ffd400] px-6 py-3 text-sm font-black text-[#05070f]">{data.ctaLabel}</button> : null}</div></SceneFrame>;
}

function UnknownSection({ block, instance }) {
  return <SceneFrame block={block} instance={instance}><div className="mx-auto flex h-full max-w-5xl items-center justify-center px-6 text-center"><div><Sparkles className="mx-auto h-8 w-8 text-[#1741ff]" /><h2 className="mt-5 text-3xl font-black">{block.data?.title || instance.navLabel}</h2><p className="mt-3 text-sm text-slate-500">Plantilla sin renderer público asignado.</p></div></div></SceneFrame>;
}

function RenderSection({ block, instance, navigate, fallbackNext, homeSceneId, business, catalogOfferings }) {
  const variant = block?.layout?.variant || block?.data?.variant || '';
  if (variant === 'gallo_workshop_hero') return <HeroSection block={block} instance={instance} business={business} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_partners_scene') return <PartnersSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_services_scene') return <ServicesSection block={block} instance={instance} catalogOfferings={catalogOfferings} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_diagnostic_scene') return <DiagnosticSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_process_scene') return <ProcessSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_experience_scene') return <ExperienceSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_evidence_scene') return <EvidenceSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} />;
  if (variant === 'gallo_contact_scene') return <ContactSection block={block} instance={instance} business={business} navigate={navigate} homeSceneId={homeSceneId} />;
  if (variant === 'gallo_repeatable_split') return <RepeatableSplit block={block} instance={instance} navigate={navigate} />;
  if (variant === 'gallo_repeatable_editorial') return <RepeatableEditorial block={block} instance={instance} />;
  if (variant === 'gallo_repeatable_cards') return <RepeatableCards block={block} instance={instance} />;
  if (variant === 'gallo_repeatable_gallery') return <RepeatableGallery block={block} instance={instance} />;
  if (variant === 'gallo_repeatable_cta') return <RepeatableCta block={block} instance={instance} navigate={navigate} />;
  return <UnknownSection block={block} instance={instance} />;
}

function SceneRail({ sceneIds, activeIndex, navigate }) {
  return <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex">{sceneIds.map((id, index) => <button key={id} type="button" aria-label={`Ir a sección ${index + 1}`} onClick={() => navigate(id)} className={cx('h-2.5 rounded-full border transition-all duration-300', index === activeIndex ? 'w-7 border-[#ffd400] bg-[#ffd400]' : 'w-2.5 border-white/35 bg-[#05070f]/55 hover:border-[#1741ff] hover:bg-[#1741ff]')} />)}</div>;
}

export function GalloWorkshopExperience({ payload }) {
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const business = useMemo(() => projectGalloBusinessProfile(payload?.businessProfile || {}), [payload?.businessProfile]);
  const catalogOfferings = useMemo(() => Array.isArray(payload?.catalogOfferings) ? payload.catalogOfferings : [], [payload?.catalogOfferings]);
  const blocks = useMemo(() => normalizeSectionInstances(sortLandingBlocks(content?.blocks)), [content]);
  const sections = useMemo(() => blocks.map((block, index) => ({ block, instance: sectionInstanceFor(block, index) })), [blocks]);
  const sceneIds = useMemo(() => sections.map(({ instance }) => instance.anchor), [sections]);
  const navigation = useMemo(() => sectionNavigation(blocks), [blocks]);
  const contactSection = useMemo(() => sections.find(({ instance }) => instance.semanticFamily === 'contact'), [sections]);
  const homeSceneId = sceneIds[0] || 'inicio';
  const actionSceneId = contactSection?.instance?.anchor || sceneIds[sceneIds.length - 1] || homeSceneId;
  const actionLabel = contactSection?.block?.data?.primaryCta || 'Contactar a Gallo';
  const initialHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const [activeSceneId, setActiveSceneId] = useState(() => sceneIds.includes(initialHash) ? initialHash : homeSceneId);
  const [direction, setDirection] = useState(1);
  const touchStartYRef = useRef(null);
  const lastTransitionAtRef = useRef(0);
  const activeIndex = Math.max(0, sceneIds.indexOf(activeSceneId));
  const activeScene = sceneIds[activeIndex] || homeSceneId;

  useEffect(() => {
    if (sceneIds.length && !sceneIds.includes(activeSceneId)) setActiveSceneId(sceneIds[0]);
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
    if (activeScene && typeof window !== 'undefined') window.history.replaceState(null, '', `#${activeScene}`);
  }, [activeScene]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
        event.preventDefault(); goToIndex(activeIndex + 1);
      } else if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
        event.preventDefault(); goToIndex(activeIndex - 1);
      } else if (event.key === 'Home') { event.preventDefault(); navigate(sceneIds[0]); }
      else if (event.key === 'End') { event.preventDefault(); navigate(sceneIds[sceneIds.length - 1]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, activeScene, sceneIds]);

  if (!content || !blocks.length) return <div className="grid min-h-screen place-items-center bg-[#f7f8fc] text-slate-500">Landing Gallo no disponible.</div>;

  return (
    <main
      className="relative h-[100dvh] overflow-hidden bg-[#f7f8fc]"
      onWheel={(event) => { if (Math.abs(event.deltaY) >= 24) goToIndex(activeIndex + (event.deltaY > 0 ? 1 : -1)); }}
      onTouchStart={(event) => { touchStartYRef.current = event.touches?.[0]?.clientY ?? null; }}
      onTouchEnd={(event) => {
        const startY = touchStartYRef.current; const endY = event.changedTouches?.[0]?.clientY; touchStartYRef.current = null;
        if (typeof startY !== 'number' || typeof endY !== 'number') return;
        const distance = startY - endY; if (Math.abs(distance) >= 44) goToIndex(activeIndex + (distance > 0 ? 1 : -1));
      }}
    >
      <Header navigation={navigation} activeScene={activeScene} navigate={navigate} homeSceneId={homeSceneId} actionSceneId={actionSceneId} actionLabel={actionLabel} business={business} />
      <SceneRail sceneIds={sceneIds} activeIndex={activeIndex} navigate={navigate} />
      <div className="relative h-[100dvh] w-full overflow-hidden">
        {sections.map(({ block, instance }, index) => {
          const active = instance.anchor === activeScene;
          const behind = index < activeIndex;
          const offsetClass = active ? 'z-10 translate-y-0 scale-100 opacity-100' : behind ? 'pointer-events-none z-0 -translate-y-10 scale-[.985] opacity-0' : 'pointer-events-none z-0 translate-y-10 scale-[.985] opacity-0';
          const fallbackNext = sceneIds[Math.min(index + 1, sceneIds.length - 1)] || homeSceneId;
          return <div key={block.id} aria-hidden={!active} data-scene-state={active ? 'active' : behind ? 'previous' : 'next'} className={cx('absolute inset-0 transform-gpu transition-[opacity,transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)]', offsetClass)} style={{ transformOrigin: direction > 0 ? 'center bottom' : 'center top' }}><RenderSection block={block} instance={instance} navigate={navigate} fallbackNext={fallbackNext} homeSceneId={homeSceneId} business={business} catalogOfferings={catalogOfferings} /></div>;
        })}
      </div>
      <style jsx global>{`
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='fade'] > div { animation: gallo-instance-fade .55s ease both; }
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='rise'] > div,
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='stagger'] > div { animation: gallo-instance-rise .62s cubic-bezier(.22,1,.36,1) both; }
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='slide'] > div { animation: gallo-instance-slide .62s cubic-bezier(.22,1,.36,1) both; }
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='scale'] > div { animation: gallo-instance-scale .58s cubic-bezier(.22,1,.36,1) both; }
        [data-scene-state='active'] .gallo-instance-shell[data-instance-motion='blur-reveal'] > div { animation: gallo-instance-blur .66s cubic-bezier(.22,1,.36,1) both; }
        .gallo-instance-shell[data-instance-depth='subtle'] .gallo-depth-card { box-shadow: 0 26px 70px rgba(10,25,80,.13); transition: transform .32s ease, box-shadow .32s ease; }
        .gallo-instance-shell[data-instance-depth='subtle'] .gallo-depth-card:hover { transform: translateY(-5px); box-shadow: 0 34px 88px rgba(10,25,80,.2); }
        .gallo-instance-shell[data-instance-depth='tilt'] .gallo-depth-card { transform-style: preserve-3d; transition: transform .36s cubic-bezier(.22,1,.36,1), box-shadow .36s ease; }
        .gallo-instance-shell[data-instance-depth='tilt'] .gallo-depth-card:hover { transform: perspective(900px) rotateX(2deg) rotateY(-3deg) translateY(-6px); box-shadow: 0 38px 100px rgba(10,25,80,.22); }
        .gallo-instance-shell[data-instance-depth='layered'] .gallo-depth-card { box-shadow: 0 12px 0 rgba(23,65,255,.08), 0 28px 70px rgba(10,25,80,.14); transition: transform .32s ease, box-shadow .32s ease; }
        .gallo-instance-shell[data-instance-depth='layered'] .gallo-depth-card:hover { transform: translate(-3px,-6px); box-shadow: 6px 14px 0 rgba(23,65,255,.12), 0 36px 90px rgba(10,25,80,.2); }
        @keyframes gallo-instance-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes gallo-instance-rise { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes gallo-instance-slide { from { opacity:0; transform:translateX(34px) } to { opacity:1; transform:translateX(0) } }
        @keyframes gallo-instance-scale { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
        @keyframes gallo-instance-blur { from { opacity:0; filter:blur(14px); transform:translateY(14px) } to { opacity:1; filter:blur(0); transform:translateY(0) } }
        @media (max-width: 1023px) {
          [data-service-display='cards'], [data-service-display='compact'], [data-service-display='text'], [data-service-display='featured-grid'] { grid-template-columns: 1fr !important; overflow-y:auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gallo-instance-shell *, .gallo-instance-shell *::before, .gallo-instance-shell *::after { animation:none !important; transition:none !important; transform:none !important; scroll-behavior:auto !important; }
        }
      `}</style>
    </main>
  );
}
