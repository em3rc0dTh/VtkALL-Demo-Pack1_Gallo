'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  HeadphonesIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DemoTestAgentChat } from './DemoTestAgentChat';
import { sortLandingBlocks } from '@/lib/landing/landingContract';
import { resolvePublicAssetUrl } from '@/lib/assets/publicAssetUrl';

const sectionIdByType = {
  catalog: 'servicios',
  about: 'taller',
  gallery: 'galeria',
  contact: 'contacto',
};

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || '';
const hasOwn = (value, key) => Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

const resolveBusinessIdentity = (profile = {}) => {
  const settings = profile.settings || {};
  const brand = profile.brand || {};
  const settingsBrand = settings.branding || {};
  const displayName = pickText(settingsBrand.displayName, brand.displayName, profile.branding?.displayName, profile.businessName, profile.businessSlug, 'Turagua');
  const logoUrl = hasOwn(settingsBrand, 'logoUrl') ? pickText(settingsBrand.logoUrl) : pickText(brand.logoUrl, profile.branding?.logoUrl);
  const tagline = hasOwn(settingsBrand, 'tagline') ? pickText(settingsBrand.tagline) : pickText(brand.tagline, profile.branding?.tagline);
  const contact = {
    ...(profile.contact || {}),
    ...(settings.contact || {}),
  };
  const locations = Array.isArray(profile.locations)
    ? profile.locations
    : Array.isArray(settings.locations)
      ? settings.locations
      : [];
  const commercialHours = {
    ...(profile.commercialHours || {}),
    ...(settings.commercialHours || {}),
  };

  return {
    displayName,
    logoUrl,
    tagline,
    contact,
    locations,
    commercialHours,
    socials: Array.isArray(settings.socials) ? settings.socials : Array.isArray(profile.socials) ? profile.socials : [],
  };
};

export function LandingPageRenderer({ payload, builderEditing = null }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroDepth, setHeroDepth] = useState(0);
  const [activeHref, setActiveHref] = useState('#inicio');
  const content = payload?.content || payload?.landingPage?.published || payload?.landingPage?.draft;
  const businessProfile = payload?.businessProfile || {};
  const businessIdentity = resolveBusinessIdentity(businessProfile);
  const businessSlug = payload?.landingPage?.businessSlug || payload?.businessProfile?.businessSlug || 'turagua';
  const businessName = businessIdentity.displayName;
  const agentConfig = { ...(payload?.businessProfile?.agent || {}), ...(content?.agent || {}) };
  const agentName = agentConfig.name || 'Iris';
  const blocks = useMemo(() => sortLandingBlocks(content?.blocks), [content]);
  const theme = content?.theme || {};
  const motion = builderEditing?.enabled ? 'none' : (content?.motion || 'signature');
  const heroBlock = blocks.find((block) => block.type === 'hero');
  const isTuraguaLegacy = heroBlock?.data?.variant === 'turagua_legacy';
  const heroLogoUrl = heroBlock?.data?.brandMode === 'custom' ? heroBlock?.data?.logoUrl : '';
  const logoUrl = resolvePublicAssetUrl(heroLogoUrl || businessIdentity.logoUrl);
  const visibleBusinessName = heroBlock?.data?.brandMode === 'custom' && heroBlock?.data?.brandName ? heroBlock.data.brandName : businessName;

  useEffect(() => {
    if (builderEditing?.enabled) return undefined;
    const updateScrolled = () => {
      const scrollY = window.scrollY || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrolled(scrollY > 12);
      setScrollProgress(Math.min(1, scrollY / maxScroll));
      setHeroDepth(Math.min(1, scrollY / Math.max(1, window.innerHeight)));
    };
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    window.addEventListener('resize', updateScrolled, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrolled);
      window.removeEventListener('resize', updateScrolled);
    };
  }, [builderEditing?.enabled]);

  useEffect(() => {
    if (builderEditing?.enabled) return undefined;
    const sections = ['#inicio', '#servicios', '#nosotros', '#contacto']
      .map((href) => document.querySelector(href))
      .filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveHref(`#${visible.target.id}`);
    }, { threshold: [0.28, 0.45, 0.62] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [builderEditing?.enabled, blocks.length]);

  if (!content) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app text-text-secondary">Landing no disponible.</div>;
  }

  return (
    <main
      data-landing-renderer-version={isTuraguaLegacy ? 'turagua-frames-v2' : undefined}
      data-landing-motion={motion}
      className="min-h-screen bg-[var(--landing-surface)] text-[var(--landing-text)]"
      style={{
        '--landing-primary': theme.primary || '#1d4ed8',
        '--landing-accent': theme.accent || '#f59e0b',
        '--landing-surface': theme.surface || '#f8fafc',
        '--landing-text': theme.text || '#0f172a',
        '--landing-scroll-progress': scrollProgress,
        '--landing-hero-depth': heroDepth,
      }}
    >
      <header className={`landing-header sticky top-0 z-30 border-b border-black/10 backdrop-blur ${scrolled ? 'is-scrolled bg-white/94' : 'bg-white/88'}`}>
        <div className="landing-header-inner mx-auto flex min-h-16 max-w-[1380px] items-center justify-between gap-6 px-4 sm:px-6 lg:gap-10">
          <a href="#inicio" className="landing-logo flex min-w-0 items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={`${visibleBusinessName} logo`} className="landing-logo-image h-14 w-40 rounded-lg border border-sky-200 bg-slate-900 object-contain p-1.5 shadow-sm" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-white">
                <Wrench className="h-5 w-5" />
              </span>
            )}
            <span className="landing-brand-name truncate text-lg font-black tracking-tight text-[#30282b]">
              {isTuraguaLegacy ? (
                <>{visibleBusinessName}</>
              ) : visibleBusinessName}
            </span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
            {(content.navigation || []).map((item) => (
              <a key={`${item.label}-${item.href}`} href={item.href} aria-current={activeHref === item.href ? 'page' : undefined} className={`landing-nav-link relative hover:text-[var(--landing-primary)] ${activeHref === item.href ? 'is-active text-[var(--landing-primary)]' : ''}`}>{item.label}</a>
            ))}
          </nav>
          <Button type="button" onClick={() => setChatOpen(true)} className="landing-action bg-[var(--landing-primary)] hover:opacity-90">
            <MessageCircle className="h-4 w-4" />
            Agendar
          </Button>
        </div>
        <div className="landing-header-progress" aria-hidden="true" />
      </header>

      {blocks.map((block) => (
        <LandingBlock
          key={block.id}
          block={block}
          catalogOfferings={payload?.catalogOfferings || []}
          businessName={visibleBusinessName}
          businessProfile={businessProfile}
          agentName={agentName}
          logoUrl={logoUrl}
          businessIdentity={businessIdentity}
          onOpenChat={() => setChatOpen(true)}
          builderEditing={builderEditing}
        />
      ))}

      <DemoTestAgentChat
        businessSlug={businessSlug}
        agentName={agentName}
        businessName={visibleBusinessName}
        avatarUrl={agentConfig.avatarUrl || agentConfig.avatar_url}
        bannerUrl={agentConfig.bannerUrl || agentConfig.banner_url}
        welcomeMessage={agentConfig.welcomeMessage || agentConfig.mensaje_bienvenida}
        agentNameColor={agentConfig.nameColor || agentConfig.color_nombre_agente}
        avatarAlignment={agentConfig.avatarAlignment || agentConfig.alineacion_avatar_chat}
        logoUrl={logoUrl}
        open={chatOpen}
        onOpenChange={setChatOpen}
        introPush={!builderEditing?.enabled}
        launcher={!builderEditing?.enabled}
      />

      <LandingMotionStyles />
    </main>
  );
}

function LandingBlock({ block, catalogOfferings, businessName, businessProfile, businessIdentity, agentName, logoUrl, onOpenChat, builderEditing }) {
  const data = block.data || {};
  const id = sectionIdByType[block.type] || block.id;

  if (block.type === 'hero') {
    if (data.variant === 'turagua_legacy') {
      return <TuraguaLegacyHero data={data} businessName={businessName} businessIdentity={businessIdentity} agentName={agentName} logoUrl={logoUrl} onOpenChat={onOpenChat} builderEditing={builderEditing} />;
    }
    const heroDark = data.variant === 'hero_dark_panel' || block.layout?.variant === 'hero_dark_panel';
    const heroSplit = data.variant === 'hero_split_clean' || block.layout?.variant === 'hero_split_clean';

    return (
      <section id="inicio" className={heroDark ? 'bg-slate-950 text-white' : heroSplit ? 'bg-slate-50' : 'bg-white'}>
        <div className={`mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:py-20 ${heroSplit ? 'lg:grid-cols-2' : 'lg:grid-cols-[1.05fr_0.95fr]'}`}>
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
              <Sparkles className="h-4 w-4" />
              {data.eyebrow || businessName}
            </span>
            <h1 className={`max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl ${heroDark ? 'text-white' : 'text-slate-950'}`}>
              {data.title}
            </h1>
            <p className={`mt-6 max-w-2xl text-lg leading-8 ${heroDark ? 'text-slate-300' : 'text-slate-600'}`}>{data.subtitle}</p>
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
          <div className={`min-h-[360px] overflow-hidden rounded-lg border ${heroDark ? 'border-white/10 bg-white/8' : 'border-slate-200 bg-slate-950'}`}>
            <div className={`flex h-full flex-col justify-between p-7 text-white ${heroSplit ? 'bg-[linear-gradient(135deg,#0284c7_0%,#0f172a_62%,#22d3ee_100%)]' : 'bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#f59e0b_100%)]'}`}>
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
    const variant = block.layout?.variant || '';
    const dark = variant === 'stats_dark';
    const strip = variant === 'stats_strip';
    return (
      <section className={`border-y ${dark ? 'border-slate-800 bg-slate-950 text-white' : strip ? 'border-sky-100 bg-white' : 'border-slate-200 bg-slate-50'}`}>
        <div className={`mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-3 sm:px-6 ${strip ? 'py-3' : 'py-6'}`}>
          {(data.items || []).map((item, index) => (
            <div key={`${item.label}-${item.value}`} className={`rounded-lg border p-5 ${dark ? 'border-white/10 bg-white/8' : strip ? 'border-transparent bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <div className="text-3xl font-black text-[var(--landing-primary)]">{item.value}</div>
              <div className={`mt-1 text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'catalog') {
    if (['turagua_catalog_frame', 'turagua_catalog_compact', 'turagua_catalog_showcase'].includes(block.layout?.variant)) {
      return <TuraguaCatalogFrame id={id} block={block} offerings={catalogOfferings} businessName={businessName} agentName={agentName} onOpenChat={onOpenChat} builderEditing={builderEditing} />;
    }

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
    if (['turagua_about_frame', 'turagua_about_dark', 'turagua_about_clean'].includes(block.layout?.variant)) {
      return <TuraguaAboutFrame id={id === 'taller' ? 'nosotros' : id} block={block} builderEditing={builderEditing} />;
    }

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
    if (block.layout?.variant === 'turagua_explore_services') {
      return <TuraguaExploreFrame id={id} block={block} onOpenChat={onOpenChat} builderEditing={builderEditing} />;
    }
    const variant = block.layout?.variant || '';
    const dark = variant === 'gallery_dark';
    const strip = variant === 'gallery_strip';

    return (
      <section id={id} className={`${dark ? 'bg-slate-950 text-white' : 'bg-white'} py-14`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className={`text-3xl font-black ${dark ? 'text-white' : 'text-slate-950'}`}>{data.title || 'Galeria'}</h2>
          <div className={`mt-8 grid gap-4 ${strip ? 'auto-cols-[minmax(260px,1fr)] grid-flow-col overflow-x-auto' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
            {(data.items || []).map((item) => {
              const title = typeof item === 'string' ? item : item.title;
              const imageUrl = typeof item === 'string' ? '' : item.imageUrl;
              return (
              <div key={title} className={`relative flex items-end overflow-hidden rounded-lg bg-slate-950 p-5 text-white ${strip ? 'min-h-56' : 'min-h-44'}`}>
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
    const variant = block.layout?.variant || '';
    const dark = variant === 'testimonials_dark';
    const wall = variant === 'testimonials_quote_wall';
    return (
      <section className={`${dark ? 'bg-slate-950 text-white' : 'bg-slate-50'} py-14`}>
        <div className={`mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 ${wall ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {(data.items || []).map((item, index) => (
            <blockquote key={`${item.author}-${item.quote}`} className={`rounded-lg border p-6 ${dark ? 'border-white/10 bg-white/8' : 'border-slate-200 bg-white'}`}>
              <p className={`text-lg font-semibold leading-8 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-bold text-[var(--landing-primary)]">{item.author}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'agent_call_to_action' || block.type === 'call_to_action') {
    const variant = block.layout?.variant || '';
    const dark = variant === 'cta_dark';
    const panel = variant === 'cta_panel';
    return (
      <section className={`${dark ? 'bg-slate-950' : panel ? 'bg-slate-50' : 'bg-[var(--landing-primary)]'} py-12 text-white`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 ${panel ? 'items-center rounded-2xl bg-[var(--landing-primary)] p-8 text-center shadow-xl' : 'items-start justify-between lg:flex-row lg:items-center'}`}>
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
    if (['turagua_contact_frame', 'turagua_contact_split', 'turagua_contact_compact', 'turagua_contact_dark'].includes(block.layout?.variant)) {
      return <TuraguaContactFrame id={id} block={block} businessName={businessName} businessIdentity={businessIdentity} agentName={agentName} onOpenChat={onOpenChat} builderEditing={builderEditing} />;
    }

    return (
      <section id={id} className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          <ContactFact icon={Phone} label="Telefono" value={businessIdentity.contact?.primaryPhone} />
          <ContactFact icon={MapPin} label="Direccion" value={businessIdentity.locations?.[0]?.addressLine} />
          <ContactFact icon={CalendarClock} label="Horario" value={businessIdentity.commercialHours?.summary || businessIdentity.commercialHours?.weekdays} />
        </div>
      </section>
    );
  }

  if (block.type === 'footer') {
    const variant = block.layout?.variant || 'footer_dark';
    const light = variant === 'footer_light';
    const compact = variant === 'footer_compact';
    return (
      <footer className={`border-t px-4 sm:px-6 ${compact ? 'py-4' : 'py-7'} ${light ? 'border-slate-200 bg-white text-slate-950' : 'border-slate-800 bg-slate-950 text-white'}`}>
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-base font-black">{businessName}</span>
            {!compact ? <p className={`mt-1 text-sm ${light ? 'text-slate-600' : 'text-slate-400'}`}>{businessIdentity.tagline || data.note}</p> : null}
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">© {new Date().getFullYear()} {businessName}</span>
        </div>
      </footer>
    );
  }

  return null;
}

function LandingMotionStyles() {
  return (
    <style jsx global>{`
      [data-landing-renderer-version="turagua-frames-v2"] {
        --motion-instant: 120ms;
        --motion-fast: 180ms;
        --motion-base: 260ms;
        --motion-slow: 420ms;
        --motion-reveal: 600ms;
        --ease-standard: cubic-bezier(0.2, 0, 0, 1);
        --ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1);
        --ease-exit: cubic-bezier(0.4, 0, 1, 1);
        scroll-behavior: smooth;
      }

      [data-landing-motion="dynamic"] {
        --motion-reveal: 520ms;
      }

      [data-landing-motion="signature"] {
        --motion-fast: 170ms;
        --motion-base: 280ms;
        --motion-slow: 520ms;
        --motion-reveal: 760ms;
        --ease-standard: cubic-bezier(0.19, 1, 0.22, 1);
        --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
      }

      [data-landing-motion="none"] {
        scroll-behavior: auto;
      }

      .landing-header,
      .landing-header-inner,
      .landing-logo-image,
      .landing-action,
      .landing-nav-link,
      .landing-promo-card,
      .landing-service-card,
      .landing-feature-card,
      .landing-explore-card,
      .landing-layout-transition {
        transition-duration: var(--motion-base);
        transition-timing-function: var(--ease-standard);
      }

      .landing-header {
        transition-property: background-color, border-color, box-shadow, backdrop-filter;
      }

      .landing-header.is-scrolled {
        border-color: rgb(15 23 42 / 0.12);
        box-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
      }

      .landing-header.is-scrolled .landing-header-inner {
        min-height: 3.5rem;
      }

      .landing-header.is-scrolled .landing-logo-image {
        transform: scale(0.94);
      }

      .landing-logo {
        flex: 0 1 430px;
      }

      .landing-brand-name {
        text-shadow: 0 1px 0 rgb(255 255 255 / 0.55);
      }

      @media (max-width: 767px) {
        .landing-logo-image {
          width: 8.75rem;
          height: 3rem;
        }

        .landing-brand-name {
          max-width: 9rem;
          font-size: 0.95rem;
        }
      }

      .landing-header-progress {
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        transform: scaleX(var(--landing-scroll-progress, 0));
        transform-origin: left center;
        background: linear-gradient(90deg, var(--landing-primary), rgb(15 23 42 / 0.72));
      }

      .landing-nav-link {
        transition-property: color, opacity;
      }

      .landing-nav-link::after {
        position: absolute;
        left: 0;
        right: 0;
        bottom: -0.35rem;
        height: 2px;
        content: "";
        transform: scaleX(0);
        transform-origin: center;
        border-radius: 999px;
        background: var(--landing-primary);
        transition: transform var(--motion-fast) var(--ease-standard);
      }

      .landing-nav-link:hover::after,
      .landing-nav-link:focus-visible::after,
      .landing-nav-link.is-active::after {
        transform: scaleX(1);
      }

      .landing-action {
        position: relative;
        overflow: hidden;
        transition-property: transform, box-shadow, opacity, background-color;
      }

      .landing-signature-cta::before {
        position: absolute;
        inset: 0;
        content: "";
        transform: translateX(-115%) skewX(-16deg);
        background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.32), transparent);
        transition: transform var(--motion-slow) var(--ease-emphasized);
      }

      .landing-signature-cta:hover::before {
        transform: translateX(115%) skewX(-16deg);
      }

      .landing-signature-cta svg {
        transition: transform var(--motion-fast) var(--ease-standard);
      }

      .landing-signature-cta:hover svg {
        transform: translateX(2px);
      }

      .landing-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgb(15 23 42 / 0.14);
      }

      .landing-action:active {
        transform: scale(0.985);
      }

      .landing-reveal,
      .landing-media-reveal {
        animation: landingReveal var(--motion-reveal) var(--ease-emphasized) both;
        animation-delay: var(--landing-stagger, 0ms);
      }

      .landing-media-reveal {
        animation-name: landingMediaReveal;
      }

      .landing-hero-media {
        transform: scale(1.035) translateY(calc(var(--landing-hero-depth, 0) * 18px));
        transform-origin: center;
        animation: landingHeroSettle 1500ms var(--ease-emphasized) 80ms both;
      }

      [data-landing-motion="dynamic"] .landing-hero-media {
        animation-duration: 14s;
      }

      .landing-hero-backdrop {
        transform: translateX(calc(var(--landing-hero-depth, 0) * -40px));
        transition: transform var(--motion-slow) var(--ease-standard);
      }

      .turagua-hero__content {
        width: 100%;
      }

      .turagua-hero__title {
        width: 100%;
        max-width: none;
        margin: 0;
        letter-spacing: 0;
        text-wrap: balance;
      }

      .turagua-hero__description,
      .turagua-hero__supporting-copy {
        width: 100%;
      }

      .turagua-hero__actions {
        width: 100%;
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        .turagua-hero__content {
          width: min(76vw, 860px);
          margin-left: auto;
        }
      }

      @media (min-width: 1024px) {
        .turagua-hero__content {
          width: min(62vw, 1020px);
          margin-left: auto;
          margin-right: clamp(40px, 6vw, 120px);
          align-items: flex-end;
          text-align: right;
        }

        .turagua-hero__description {
          width: min(100%, 760px);
          margin-left: auto;
        }

        .turagua-hero__actions {
          justify-content: flex-end;
        }

        .turagua-hero__supporting-copy {
          width: min(100%, 720px);
          margin-left: auto;
        }
      }

      @media (max-width: 767px) {
        .turagua-hero__content {
          align-items: flex-start;
          text-align: left;
        }

        .turagua-hero__title,
        .turagua-hero__description,
        .turagua-hero__supporting-copy {
          width: 100%;
        }
      }

      .landing-title-line-wrap {
        overflow: hidden;
      }

      .landing-title-line {
        transform: translateY(105%) skewY(2deg);
        animation: landingTitleLock var(--motion-reveal) var(--ease-emphasized) both;
        animation-delay: var(--landing-stagger, 0ms);
      }

      .landing-title-highlight {
        position: relative;
        color: var(--landing-primary);
      }

      [data-landing-motion="none"] .landing-reveal,
      [data-landing-motion="none"] .landing-media-reveal,
      [data-landing-motion="none"] .landing-hero-media {
        animation: none;
      }

      .landing-promo-card,
      .landing-service-card,
      .landing-feature-card,
      .landing-explore-card {
        transition-property: transform, border-color, box-shadow, background-color, opacity;
      }

      .landing-promo-card:hover,
      .landing-service-card:hover,
      .landing-feature-card:hover,
      .landing-explore-card:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 18px 36px rgb(15 23 42 / 0.14);
      }

      .landing-promo-card {
        position: relative;
      }

      .landing-promo-card::before {
        position: absolute;
        inset: 12px auto 12px 0;
        width: 3px;
        content: "";
        border-radius: 999px;
        background: var(--landing-primary);
        transform: scaleY(0.42);
        transform-origin: bottom;
        transition: transform var(--motion-base) var(--ease-standard);
      }

      .landing-promo-card:hover {
        transform: translateX(5px) translateY(-4px) scale(1.015);
      }

      .landing-promo-card:hover::before {
        transform: scaleY(1);
      }

      .landing-promo-dock:hover .landing-promo-card:not(:hover),
      .landing-service-grid:hover .landing-service-card:not(:hover),
      .landing-feature-grid:hover .landing-feature-card:not(:hover) {
        opacity: 0.74;
      }

      .landing-service-card::after {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        content: "";
        transform: scaleX(0);
        transform-origin: left center;
        background: var(--landing-primary);
        transition: transform var(--motion-base) var(--ease-emphasized);
      }

      .landing-service-card:hover::after {
        transform: scaleX(1);
      }

      .landing-service-title,
      .landing-service-description,
      .landing-service-icon {
        transition: transform var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
      }

      .landing-service-card:hover .landing-service-title {
        transform: translateX(4px);
      }

      .landing-service-card:hover .landing-service-description {
        display: block;
        -webkit-line-clamp: unset;
      }

      .landing-service-card:hover .landing-service-icon {
        transform: rotate(6deg) scale(1.08);
      }

      .landing-about-frame .landing-media-reveal {
        clip-path: inset(0 0 0 0);
      }

      [data-landing-motion="signature"] .landing-about-frame .landing-media-reveal {
        animation-name: landingImageMaskReveal;
      }

      .landing-about-connector {
        position: absolute;
        left: 43%;
        top: 50%;
        width: 15%;
        height: 1px;
        transform: scaleX(0);
        transform-origin: left center;
        background: linear-gradient(90deg, var(--landing-primary), transparent);
        animation: landingConnector 720ms var(--ease-emphasized) 520ms both;
      }

      .landing-contact-frame::before {
        position: absolute;
        inset: 0;
        content: "";
        opacity: 0.42;
        background-image:
          linear-gradient(rgb(0 174 239 / 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgb(0 174 239 / 0.08) 1px, transparent 1px);
        background-size: 56px 56px;
        transform: translateY(calc(var(--landing-hero-depth, 0) * -18px));
      }

      .landing-contact-fact {
        position: relative;
        transition: transform var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard), background-color var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard);
      }

      .landing-contact-fact::before {
        position: absolute;
        inset: 12px auto 12px 0;
        width: 3px;
        content: "";
        border-radius: 999px;
        background: var(--landing-primary);
        transform: scaleY(0);
        transform-origin: center;
        transition: transform var(--motion-base) var(--ease-emphasized);
      }

      .landing-contact-fact:hover {
        transform: translateX(5px);
        border-color: rgb(0 174 239 / 0.42);
        background: white;
        box-shadow: 0 14px 28px rgb(15 23 42 / 0.08);
      }

      .landing-contact-fact:hover::before {
        transform: scaleY(1);
      }

      .landing-step-card span {
        display: inline-block;
        animation: landingStepNumber 420ms var(--ease-emphasized) both;
        animation-delay: var(--landing-stagger, 0ms);
      }

      .landing-scroll-cue span:last-child span {
        animation: landingScrollCue 1.8s var(--ease-standard) infinite;
      }

      .landing-contact-cta {
        animation: landingSoftHalo 760ms var(--ease-standard) 900ms 1 both;
      }

      .landing-layout-transition {
        transition-property: transform;
      }

      [data-landing-motion="none"] .landing-contact-cta,
      [data-landing-motion="none"] .landing-step-card span,
      [data-landing-motion="none"] .landing-scroll-cue span:last-child span {
        animation: none;
      }

      .landing-modal-backdrop {
        animation: landingFadeIn 220ms var(--ease-standard) both;
      }

      .landing-modal-surface {
        animation: landingModalIn 260ms var(--ease-emphasized) both;
      }

      [data-landing-motion="none"] .landing-modal-backdrop,
      [data-landing-motion="none"] .landing-modal-surface {
        animation: none;
      }

      .landing-iris-launcher,
      .landing-iris-push {
        animation: landingIrisEnter 320ms var(--ease-emphasized) both;
      }

      .landing-iris-chat {
        animation: landingChatOpen 260ms var(--ease-emphasized) both;
      }

      .landing-chat-message {
        animation: landingMessageIn 180ms var(--ease-standard) both;
      }

      [data-landing-motion="none"] .landing-iris-launcher,
      [data-landing-motion="none"] .landing-iris-push,
      [data-landing-motion="none"] .landing-iris-chat,
      [data-landing-motion="none"] .landing-chat-message {
        animation: none;
      }

      @keyframes landingReveal {
        from {
          opacity: 0;
          transform: translateY(18px);
          filter: blur(3px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      @keyframes landingMediaReveal {
        from {
          opacity: 0;
          transform: scale(0.985);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes landingHeroSettle {
        from {
          opacity: 0.72;
          transform: scale(1.045) translateY(10px);
          filter: saturate(0.92) contrast(0.94);
        }
        to {
          opacity: 1;
          transform: scale(1.012) translateY(calc(var(--landing-hero-depth, 0) * 18px));
          filter: saturate(1.08) contrast(1.04);
        }
      }

      @keyframes landingTitleLock {
        from {
          transform: translateY(105%) skewY(2deg);
          opacity: 0;
        }
        72% {
          transform: translateY(-3%) skewY(0deg);
          opacity: 1;
        }
        to {
          transform: translateY(0) skewY(0deg);
          opacity: 1;
        }
      }

      @keyframes landingImageMaskReveal {
        from {
          opacity: 0;
          clip-path: inset(0 18% 0 0);
          transform: translateX(-16px) scale(1.015);
        }
        to {
          opacity: 1;
          clip-path: inset(0 0 0 0);
          transform: translateX(0) scale(1);
        }
      }

      @keyframes landingConnector {
        from { transform: scaleX(0); opacity: 0; }
        to { transform: scaleX(1); opacity: 1; }
      }

      @keyframes landingStepNumber {
        from {
          opacity: 0;
          transform: scale(0.92);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes landingSoftHalo {
        0% { box-shadow: 0 0 0 0 rgb(0 174 239 / 0.28); }
        100% { box-shadow: 0 0 0 12px rgb(0 174 239 / 0); }
      }

      @keyframes landingScrollCue {
        0% {
          transform: translateY(-100%);
          opacity: 0;
        }
        35% {
          opacity: 1;
        }
        100% {
          transform: translateY(250%);
          opacity: 0;
        }
      }

      @keyframes landingFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes landingModalIn {
        from {
          opacity: 0;
          transform: scale(0.98) translateY(8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes landingIrisEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes landingChatOpen {
        from {
          opacity: 0;
          transform: scale(0.98) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes landingMessageIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }

        [data-landing-renderer-version="turagua-frames-v2"] *,
        [data-agent-intro-push="iris"],
        button[aria-label="Abrir chat con Iris"] {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 1ms !important;
        }

        .landing-hero-media,
        .landing-title-line,
        .landing-about-connector,
        .landing-scroll-cue span:last-child span,
        .landing-contact-cta {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function TuraguaLegacyHero({ data, businessName, businessIdentity = {}, agentName, logoUrl, onOpenChat, builderEditing }) {
  const mediaUrl = data.heroMediaUrl || data.imageUrl;
  const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(mediaUrl || '');
  const stats = Array.isArray(data.stats) ? data.stats.filter((item) => item?.visible !== false) : [];
  const promotions = Array.isArray(data.promotions) ? data.promotions.filter((promo) => promo?.visible !== false) : [];
  const inlinePromotions = promotions.filter((promo) => !promo.position || promo.position === 'bottom-left');
  const floatingPromotions = promotions.filter((promo) => promo.position && promo.position !== 'bottom-left');
  const mediaOpacity = Math.max(0.76, 1 - (Math.min(90, Math.max(0, Number(data.overlay ?? 55))) / 260));
  const align = data.align || 'right';
  const alignmentClass = align === 'left' ? 'items-start text-left lg:items-start lg:text-left' : align === 'center' ? 'items-start text-left lg:items-center lg:text-center' : 'items-start text-left lg:items-end lg:text-right';
  const editing = builderEditing?.enabled;
  const customBrand = data.brandMode === 'custom';
  const brandName = customBrand && data.brandName ? data.brandName : businessIdentity.displayName || businessName;
  const brandTagline = customBrand && data.brandTagline ? data.brandTagline : businessIdentity.tagline || 'Proteccion & estetica automotriz';
  const backdropText = customBrand && data.backdropText ? data.backdropText : brandName;
  const updateHeroText = (key) => (value) => builderEditing?.onHeroDataChange?.({ [key]: value });
  const handleBusinessClick = (event, action) => {
    if (editing) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    action?.();
  };

  return (
    <section id="inicio" className="landing-hero relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#e8e8ee] lg:h-[calc(100vh-4rem)]">
      {isVideo ? (
        <video
          className="landing-hero-media absolute inset-0 h-full w-full object-cover object-center"
          style={{ opacity: mediaOpacity }}
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : mediaUrl ? (
        <img src={mediaUrl} alt={businessName} className="landing-hero-media absolute inset-0 h-full w-full object-cover object-center" style={{ opacity: mediaOpacity }} />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08)_38%,rgba(255,255,255,0.54)_70%,rgba(255,255,255,0.82))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/62" />
      <div className="landing-hero-backdrop absolute -inset-x-12 top-20 select-none text-center text-[12vw] font-black uppercase tracking-wide text-sky-200/16">
        {backdropText.replace(/\s+/g, '')}
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1320px] gap-6 px-[clamp(24px,5vw,72px)] py-[clamp(44px,7vh,76px)] lg:h-full lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
        <div className="landing-promo-dock order-2 grid content-end gap-3 self-end sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:pb-10">
          {inlinePromotions.slice(0, 2).map((promo, index) => (
            <HeroPromotionCard key={promo.title} promo={promo} index={index} onOpenChat={onOpenChat} builderEditing={builderEditing} />
          ))}
        </div>

        <div className={`turagua-hero__content order-1 flex flex-col lg:order-2 ${alignmentClass}`}>
          {logoUrl ? <img src={logoUrl} alt={`${brandName} logo`} className="landing-reveal mb-5 h-16 w-44 rounded-lg border border-sky-200 bg-slate-950 object-contain p-1 shadow-lg lg:hidden" style={{ '--landing-stagger': '0ms' }} /> : null}
          <div className="turagua-hero__brand-signature landing-reveal mb-4 inline-flex flex-col border-r-2 border-[var(--landing-primary)] bg-white/54 px-4 py-2 text-right shadow-sm backdrop-blur max-lg:border-l-2 max-lg:border-r-0 max-lg:text-left" style={{ '--landing-stagger': '40ms' }}>
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--landing-primary)]">{brandName}</span>
            <span className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#4a393d]/80">{brandTagline}</span>
          </div>
          <HeroSignatureTitle
            title={data.title}
            highlight={data.titleHighlight}
            editing={editing}
            onTitleChange={updateHeroText('title')}
            onHighlightChange={updateHeroText('titleHighlight')}
          />
          <p className="turagua-hero__description landing-reveal mt-4 text-base font-bold leading-7 text-[#4a393d]/85" style={{ '--landing-stagger': '160ms' }}>
            <EditableCanvasText value={data.subtitle} enabled={editing} onChange={updateHeroText('subtitle')} multiline />
          </p>
          <div className="turagua-hero__actions landing-reveal mt-6 flex flex-col gap-3 sm:flex-row" style={{ '--landing-stagger': '240ms' }}>
            <Button as="a" variant="secondary" onClick={(event) => handleBusinessClick(event, () => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' }))} className="landing-action landing-signature-cta">
              <EditableCanvasText value={data.secondaryCta || 'Ver servicios'} enabled={editing} onChange={updateHeroText('secondaryCta')} />
            </Button>
            <Button type="button" onClick={(event) => handleBusinessClick(event, onOpenChat)} className="landing-action landing-signature-cta bg-[var(--landing-primary)] px-7 text-white">
              <MessageCircle className="h-4 w-4" />
              <EditableCanvasText value={data.primaryCta || `Agendar con ${agentName}`} enabled={editing} onChange={updateHeroText('primaryCta')} />
            </Button>
          </div>
          {stats.length ? (
            <div className="landing-reveal mt-5 grid w-full max-w-2xl grid-cols-3 gap-2" style={{ '--landing-stagger': '320ms' }}>
              {stats.slice(0, 3).map((item, index) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="border-l-2 border-[var(--landing-primary)] bg-white/60 px-3 py-2 text-left shadow-sm backdrop-blur"
                  data-landing-canvas-selectable={editing ? 'Estadistica' : undefined}
                  onClick={(event) => {
                    if (!editing) return;
                    event.stopPropagation();
                    builderEditing?.onSelectElement?.({ blockType: 'stats', label: `Estadistica ${index + 1}` });
                  }}
                >
                  <div className="text-lg font-black text-[#4a393d]">
                    <EditableCanvasText
                      value={item.value}
                      enabled={editing}
                      onChange={(value) => {
                        const nextStats = [...stats];
                        nextStats[index] = { ...nextStats[index], value };
                        builderEditing?.onHeroDataChange?.({ stats: nextStats });
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wide text-[#4a393d]/60">
                    <EditableCanvasText
                      value={item.label}
                      enabled={editing}
                      onChange={(label) => {
                        const nextStats = [...stats];
                        nextStats[index] = { ...nextStats[index], label };
                        builderEditing?.onHeroDataChange?.({ stats: nextStats });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <p className="turagua-hero__supporting-copy landing-reveal mt-5 text-sm font-semibold leading-6 text-[#4a393d]/75 lg:text-base" style={{ '--landing-stagger': '400ms' }}>
            <EditableCanvasText value={data.supportingText} enabled={editing} onChange={updateHeroText('supportingText')} multiline />
          </p>
        </div>
      </div>

      <FloatingHeroPromotions promotions={floatingPromotions} onOpenChat={onOpenChat} builderEditing={builderEditing} />

      <a href="#servicios" className="landing-scroll-cue absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#4a393d]/60 lg:flex">
        <span>Servicios</span>
        <span className="h-10 w-px overflow-hidden bg-[#4a393d]/20">
          <span className="block h-4 w-px bg-[var(--landing-primary)]" />
        </span>
      </a>

    </section>
  );
}

function HeroPromotionCard({ promo, onOpenChat, compact = false, builderEditing = null, index = 0 }) {
  const editing = builderEditing?.enabled;
  return (
    <button
      type="button"
      onClick={(event) => {
        if (editing) {
          event.preventDefault();
          event.stopPropagation();
          builderEditing?.onSelectElement?.({ blockType: 'hero', label: `Promocion: ${promo.title || 'sin titulo'}` });
          return;
        }
        onOpenChat();
      }}
      data-landing-canvas-selectable={editing ? 'Promocion' : undefined}
      className={`landing-promo-card landing-reveal rounded-lg border border-white/10 bg-slate-950/88 text-left text-white shadow-xl shadow-slate-900/25 backdrop-blur transition hover:bg-slate-900 ${editing ? 'ring-2 ring-transparent hover:ring-[var(--landing-primary)]' : ''} ${compact ? 'p-3' : 'p-4'}`}
      style={{ '--landing-stagger': `${420 + index * 100}ms` }}
    >
      <span className="inline-flex rounded bg-[var(--landing-primary)] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
        {promo.eyebrow}
      </span>
      <h3 className={`${compact ? 'mt-2 text-sm' : 'mt-3 min-h-12 text-base lg:text-lg'} font-black leading-tight`}>{promo.title}</h3>
      <span className={`${compact ? 'mt-3 h-8' : 'mt-4 h-9'} flex items-center justify-center rounded-lg bg-[var(--landing-primary)] text-xs font-black uppercase tracking-wide`}>
        {promo.cta || 'Obtener'}
      </span>
    </button>
  );
}

function HeroSignatureTitle({ title = '', highlight = '', editing = false, onTitleChange, onHighlightChange }) {
  if (editing) {
    return (
      <h1 className="turagua-hero__title landing-reveal text-4xl font-black uppercase leading-[0.98] text-[#4a393d] sm:text-5xl lg:text-5xl xl:text-6xl" style={{ '--landing-stagger': '80ms' }}>
        <EditableCanvasText value={title} enabled={editing} onChange={onTitleChange} />
        <EditableCanvasText as="span" className="block text-[var(--landing-primary)]" value={highlight} enabled={editing} onChange={onHighlightChange} />
      </h1>
    );
  }

  const normalizedTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const canonical = normalizedTitle.toLowerCase().includes('tu vehiculo')
    ? ['TU VEHICULO', 'PROTEGIDO,', 'RESTAURADO Y LISTO', 'PARA EXIGIR']
    : normalizedTitle.split(/,\s*|\.\s*|\n/).map((line) => line.trim().toUpperCase()).filter(Boolean).slice(0, 4);
  const lines = canonical.length ? canonical : ['TU VEHICULO', 'PROTEGIDO,', 'RESTAURADO Y LISTO', 'PARA EXIGIR'];

  return (
    <h1 className="turagua-hero__title landing-signature-title text-4xl font-black uppercase leading-[0.98] text-[#4a393d] sm:text-5xl lg:text-5xl xl:text-6xl">
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="landing-title-line-wrap block">
          <span className="landing-title-line block" style={{ '--landing-stagger': `${80 + index * 82}ms` }}>{line}</span>
        </span>
      ))}
      {highlight ? (
        <span className="landing-title-line-wrap landing-title-highlight-wrap block">
          <span className="landing-title-line landing-title-highlight block" style={{ '--landing-stagger': `${80 + lines.length * 82}ms` }}>{highlight}</span>
        </span>
      ) : null}
    </h1>
  );
}

function EditableCanvasText({ as: Tag = 'span', value = '', enabled = false, onChange, className = '', multiline = false }) {
  if (!enabled) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={`${className} rounded outline-none ring-2 ring-transparent transition hover:ring-[var(--landing-primary)]/40 focus:ring-[var(--landing-primary)]`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label="Editar texto"
      data-landing-canvas-editable="text"
      onKeyDown={(event) => {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => {
        const next = event.currentTarget.textContent || '';
        if (next !== value) onChange?.(next);
      }}
    >
      {value}
    </Tag>
  );
}

function FloatingHeroPromotions({ promotions, onOpenChat, builderEditing = null }) {
  if (!promotions.length) return null;

  const groups = promotions.reduce((acc, promo) => {
    const position = promo.placement?.desktop?.anchor || promo.position || 'bottom-left';
    acc[position] = [...(acc[position] || []), promo];
    return acc;
  }, {});

  const positionClass = {
    'top-left': 'left-6 top-24',
    'top-right': 'right-6 top-24',
    'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-24 right-6',
    'side-right': 'right-6 top-1/2 -translate-y-1/2',
  };

  return (
    <>
      {Object.entries(groups).map(([position, items]) => (
        <div
          key={position}
          className={`absolute z-20 hidden w-56 gap-3 lg:grid ${positionClass[position] || positionClass['top-right']}`}
        >
          {items.slice(0, 2).map((promo, index) => (
            <div
              key={promo.title}
              className="landing-layout-transition"
              style={{
                transform: `translate(${Number(promo.placement?.desktop?.offsetX || 0)}px, ${Number(promo.placement?.desktop?.offsetY || 0)}px)`,
              }}
            >
              <HeroPromotionCard promo={promo} onOpenChat={onOpenChat} compact builderEditing={builderEditing} index={index} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function TuraguaCatalogFrame({ id, block, offerings, businessName, agentName, onOpenChat, builderEditing = null }) {
  const data = block.data || {};
  const editing = builderEditing?.enabled;
  const updateData = (patch) => builderEditing?.onBlockDataChange?.(block.type, patch);
  const variant = block.layout?.variant || 'turagua_catalog_frame';
  const compact = variant === 'turagua_catalog_compact';
  const showcase = variant === 'turagua_catalog_showcase';
  const services = offerings.length ? offerings : fallbackTuraguaServices;
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const openChatFromCatalog = () => {
    setSelectedService(null);
    setCatalogOpen(false);
    onOpenChat();
  };
  const categories = data.categories?.length ? data.categories : ['Todos'];
  const filtered = services.filter((service) => {
    const name = service.name || service.title || service.nombre || '';
    const description = service.description || service.summary || service.descripcion || '';
    const category = service.category || service.categoria || 'Servicio';
    const matchesQuery = `${name} ${description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <section
      id={id}
      data-landing-frame="TuraguaCatalogFrame"
      data-landing-renderer-version="turagua-frames-v2"
      className={`landing-section relative overflow-hidden scroll-mt-16 ${compact ? 'bg-slate-50 py-10' : showcase ? 'min-h-[calc(100vh-4rem)] bg-white py-[clamp(56px,8vh,92px)]' : 'min-h-[calc(100vh-4rem)] bg-[#eef2ff] py-[clamp(48px,7vh,80px)]'}`}
      onClick={() => editing && builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label: 'Catalogo de servicios' })}
    >
      <div className="pointer-events-none absolute -right-24 top-16 text-[12vw] font-black uppercase tracking-tight text-white/55">Servicios</div>
      <div className={`relative mx-auto grid max-w-[1320px] gap-8 px-[clamp(24px,5vw,72px)] ${compact ? 'lg:grid-cols-[0.28fr_0.72fr] lg:items-start' : showcase ? 'min-h-[calc(100vh-13rem)] lg:grid-cols-[0.44fr_0.56fr] lg:items-center' : 'min-h-[calc(100vh-12rem)] lg:grid-cols-[0.34fr_0.66fr] lg:items-center'}`}>
        <aside className={`landing-reveal border border-slate-200 bg-white/94 p-6 backdrop-blur ${showcase ? 'shadow-2xl shadow-slate-200' : 'shadow-lg shadow-slate-200/70'}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--landing-primary)]">{data.eyebrow || 'Servicios Turagua'}</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#3f3436]">
            <EditableCanvasText value={data.title || 'Nuestros servicios'} enabled={editing} onChange={(title) => updateData({ title })} />
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            <EditableCanvasText value={data.subtitle} enabled={editing} multiline onChange={(subtitle) => updateData({ subtitle })} />
          </p>
          <div className={`mt-6 grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-3 lg:grid-cols-1'}`}>
            {['Elige', `${agentName} coordina`, 'Box reservado'].map((step, index) => (
              <div key={step} className="landing-reveal landing-step-card border border-slate-200 bg-slate-50 p-3" style={{ '--landing-stagger': `${120 + index * 80}ms` }}>
                <span className="text-lg font-black text-[var(--landing-primary)]">0{index + 1}</span>
                <p className="mt-1 text-xs font-black text-slate-700">{step}</p>
              </div>
            ))}
          </div>
          <Button type="button" onClick={(event) => {
            if (editing) {
              event.preventDefault();
              event.stopPropagation();
              builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label: 'Boton explorar servicios' });
              return;
            }
            setCatalogOpen(true);
          }} className="landing-action mt-6 w-full bg-[var(--landing-primary)] px-7">
            <Search className="h-4 w-4" />
            Explorar servicios
          </Button>
        </aside>

        <div className="min-w-0">
          <ServiceGrid services={services.slice(0, compact ? 8 : showcase ? 9 : 6)} onSelect={setSelectedService} variant={variant} />
        </div>
      </div>

      {catalogOpen ? (
        <CatalogModal
          data={data}
          businessName={businessName}
          agentName={agentName}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          query={query}
          onQueryChange={setQuery}
          services={filtered}
          onClose={() => setCatalogOpen(false)}
          onSelect={setSelectedService}
          onOpenChat={openChatFromCatalog}
        />
      ) : null}

      {selectedService ? (
        <ServiceDetailModal
          service={selectedService}
          businessName={businessName}
          agentName={agentName}
          onClose={() => setSelectedService(null)}
          onOpenChat={openChatFromCatalog}
        />
      ) : null}
    </section>
  );
}

function ServiceGrid({ services, onSelect, variant = 'turagua_catalog_frame' }) {
  const compact = variant === 'turagua_catalog_compact';
  const showcase = variant === 'turagua_catalog_showcase';
  return (
    <div className={`landing-service-grid grid gap-4 ${compact ? 'md:grid-cols-2 xl:grid-cols-4' : showcase ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {services.map((service, index) => (
          <button
            key={service._id || service.name || service.nombre}
            type="button"
            onClick={() => onSelect(service)}
            className={`landing-service-card landing-reveal relative flex flex-col justify-between overflow-hidden border border-slate-200 bg-white/95 text-left shadow-sm transition hover:border-sky-300 ${compact ? 'min-h-36 p-4' : showcase ? 'min-h-56 p-6' : 'min-h-48 p-5'}`}
            style={{ '--landing-stagger': `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`landing-service-index font-black leading-none text-[var(--landing-primary)] ${showcase ? 'text-4xl' : 'text-2xl'}`}>0{index + 1}</span>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{service.category || service.categoria || 'Especialidad'}</p>
              </div>
              <Wrench className="landing-service-icon h-5 w-5 shrink-0 text-[var(--landing-primary)]" />
            </div>
            <div className="mt-5">
              <h3 className="landing-service-title line-clamp-2 text-base font-black leading-tight text-[#3f3436]">{service.name || service.title || service.nombre}</h3>
              <p className="landing-service-description mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{service.description || service.summary || service.descripcion || 'Servicio disponible para el negocio.'}</p>
            </div>
            <span className="landing-service-foot mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>Ficha tecnica</span>
              <span className="h-1.5 w-8 rounded-full bg-[var(--landing-primary)]/70" />
            </span>
          </button>
      ))}
    </div>
  );
}

function CatalogModal({ data, businessName, agentName, categories, activeCategory, onCategoryChange, query, onQueryChange, services, onClose, onSelect, onOpenChat }) {
  return (
    <div className="landing-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="landing-modal-surface relative flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto px-5 pb-7 pt-12 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Servicios {businessName}</p>
            <h2 className="mt-3 text-3xl font-black text-[#3f3436]">{data.modalTitle || 'Catalogo de servicios'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{data.modalSubtitle}</p>
          </div>
          <div className="my-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex h-12 w-full items-center gap-3 border border-slate-200 px-4 text-slate-500 lg:max-w-sm">
              <Search className="h-5 w-5" />
              <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={data.searchPlaceholder || 'Buscar'} className="w-full bg-transparent text-sm outline-none" />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryChange(category)}
                  className={`shrink-0 border px-4 py-2 text-sm font-black ${activeCategory === category ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service._id || service.name || service.nombre} className="flex min-h-52 flex-col border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{service.category || service.categoria || 'Especialidad'}</p>
                <h3 className="mt-3 text-xl font-black leading-tight text-[#3f3436]">{service.name || service.title || service.nombre}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{service.description || service.summary || service.descripcion}</p>
                <button type="button" onClick={() => onSelect(service)} className="mt-auto flex h-11 items-center justify-center border border-slate-200 text-sm font-black text-[#3f3436] hover:bg-slate-50">
                  Ver detalle
                </button>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4 border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <HeadphonesIcon className="hidden h-8 w-8 text-slate-500 sm:block" />
              <div>
                <h3 className="text-xl font-black text-[#3f3436]">{data.helperTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{data.helperBody}</p>
              </div>
            </div>
            <Button type="button" onClick={onOpenChat} className="bg-[#3f3436]">
              Hablar con {agentName}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceDetailModal({ service, businessName, agentName, onClose, onOpenChat }) {
  return (
    <div className="landing-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="landing-modal-surface relative w-full max-w-lg bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
          <X className="h-5 w-5" />
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--landing-primary)]">Detalle de servicio</p>
        <h3 className="mt-3 pr-10 text-2xl font-black text-[#3f3436]">{service.name || service.title || service.nombre}</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">{service.description || service.summary || service.descripcion || 'Servicio disponible para el negocio.'}</p>
        <div className="mt-5 border border-sky-100 bg-sky-50 p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-sky-700">
            <CheckCircle2 className="h-4 w-4" />
            Ideal para
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">Cuando quieres evaluar, proteger o restaurar tu vehiculo con acompanamiento de {businessName}.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={onOpenChat} className="bg-[var(--landing-primary)]">
            Solicitar servicio
          </Button>
          <Button type="button" variant="secondary" onClick={onOpenChat}>
            Hablar con {agentName}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TuraguaAboutFrame({ id, block, builderEditing = null }) {
  const data = block.data || {};
  const editing = builderEditing?.enabled;
  const updateData = (patch) => builderEditing?.onBlockDataChange?.(block.type, patch);
  const select = (label) => builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label });
  const variant = block.layout?.variant || 'turagua_about_frame';
  const dark = variant === 'turagua_about_dark';
  const clean = variant === 'turagua_about_clean';
  return (
    <section id={id} className={`landing-about-frame landing-section relative overflow-hidden py-[clamp(52px,7vh,84px)] scroll-mt-16 ${dark ? 'min-h-[calc(100vh-4rem)] bg-slate-950 text-white' : clean ? 'bg-slate-50' : 'min-h-[calc(100vh-4rem)] bg-white'}`} onClick={() => editing && select('Sobre nosotros')}>
      {!clean ? <div className="pointer-events-none absolute -left-10 bottom-8 h-32 w-1/2 border-l-4 border-[var(--landing-primary)]/20 bg-gradient-to-r from-sky-50/70 to-transparent" /> : null}
      {!clean ? <div className="landing-about-connector" aria-hidden="true" /> : null}
      <div className={`relative mx-auto grid max-w-[1320px] gap-10 px-[clamp(24px,5vw,72px)] ${clean ? 'lg:grid-cols-1' : 'min-h-[calc(100vh-12rem)] lg:grid-cols-[0.48fr_0.52fr] lg:items-center'}`}>
        {!clean ? (
        <div className={`landing-media-reveal relative min-h-[460px] overflow-hidden bg-slate-950 shadow-2xl ${dark ? 'shadow-sky-950/40' : 'shadow-slate-300/50'}`}>
          {data.imageUrl ? <img src={data.imageUrl} alt={data.title || 'Turagua'} className={`absolute inset-0 h-full w-full object-cover ${dark ? 'opacity-55' : 'opacity-85'}`} /> : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent p-5">
            <div className="inline-flex rounded bg-[var(--landing-primary)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">Detalle Turagua</div>
          </div>
        </div>
        ) : null}
        <div className={clean ? 'mx-auto max-w-5xl text-center' : ''}>
          <p className="landing-reveal text-xs font-black uppercase tracking-[0.24em] text-[var(--landing-primary)]">
            <EditableCanvasText value={data.eyebrow} enabled={editing} onChange={(eyebrow) => updateData({ eyebrow })} />
          </p>
          <h2 className={`landing-reveal mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl ${dark ? 'text-white' : 'text-[#3f3436]'} ${clean ? 'mx-auto' : ''}`} style={{ '--landing-stagger': '80ms' }}>
            <EditableCanvasText value={data.title} enabled={editing} onChange={(title) => updateData({ title })} />
          </h2>
          <p className={`landing-reveal mt-5 max-w-3xl text-lg leading-8 ${dark ? 'text-slate-300' : 'text-slate-600'} ${clean ? 'mx-auto' : ''}`} style={{ '--landing-stagger': '160ms' }}>
            <EditableCanvasText value={data.body} enabled={editing} multiline onChange={(body) => updateData({ body, highlight: body })} />
          </p>
          <div className="landing-feature-grid mt-7 grid gap-3 md:grid-cols-3">
            {(data.features || []).map((feature, index) => (
              <div
                key={feature.title}
                className={`landing-feature-card landing-reveal border p-4 ${dark ? 'border-white/10 bg-white/8' : clean ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'} ${editing ? 'transition hover:border-[var(--landing-primary)] hover:ring-2 hover:ring-[var(--landing-primary)]/20' : ''}`}
                style={{ '--landing-stagger': `${240 + index * 80}ms` }}
                data-landing-canvas-selectable={editing ? 'Feature' : undefined}
                onClick={(event) => {
                  if (!editing) return;
                  event.stopPropagation();
                  select(`Feature: ${feature.title || index + 1}`);
                }}
              >
                <FeatureIcon name={feature.icon} />
                <h3 className={`mt-4 text-sm font-black ${dark ? 'text-white' : 'text-[#3f3436]'}`}>
                  <EditableCanvasText
                    value={feature.title}
                    enabled={editing}
                    onChange={(title) => {
                      const features = [...(data.features || [])];
                      features[index] = { ...features[index], title };
                      updateData({ features });
                    }}
                  />
                </h3>
                <p className={`mt-2 text-xs leading-5 ${dark ? 'text-slate-300' : 'text-slate-500'}`}>
                  <EditableCanvasText
                    value={feature.body || feature.description}
                    enabled={editing}
                    multiline
                    onChange={(body) => {
                      const features = [...(data.features || [])];
                      features[index] = { ...features[index], body, description: body };
                      updateData({ features });
                    }}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TuraguaExploreFrame({ id, block, onOpenChat, builderEditing = null }) {
  const data = block.data || {};
  const editing = builderEditing?.enabled;
  const updateData = (patch) => builderEditing?.onBlockDataChange?.(block.type, patch);
  const handleAction = (event, label) => {
    if (editing) {
      event.preventDefault();
      event.stopPropagation();
      builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label });
      return;
    }
    onOpenChat();
  };
  return (
    <section id={id} className="landing-section bg-[#f4f5ff] py-10 scroll-mt-16" onClick={() => editing && builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label: 'Explorar servicios' })}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="landing-reveal text-3xl font-black text-[#3f3436]">
              <EditableCanvasText value={data.title} enabled={editing} onChange={(title) => updateData({ title })} />
            </h2>
            <p className="landing-reveal mt-2 text-sm text-slate-600" style={{ '--landing-stagger': '80ms' }}>
              <EditableCanvasText value={data.subtitle} enabled={editing} multiline onChange={(subtitle) => updateData({ subtitle })} />
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={(event) => handleAction(event, 'Boton de explorar')} className="landing-action">Cotizar</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data.items || []).map((item, index) => (
            <button key={item.title} type="button" onClick={(event) => handleAction(event, `Card: ${item.title}`)} className="landing-explore-card landing-reveal relative flex aspect-[4/3] items-end overflow-hidden bg-slate-950 p-5 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ '--landing-stagger': `${120 + index * 70}ms` }}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-70" /> : null}
              <span className="relative z-10 text-xl font-black">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TuraguaContactFrame({ id, block, businessName, businessIdentity = {}, agentName, onOpenChat, builderEditing = null }) {
  const data = block.data || {};
  const display = data.display || {};
  const content = data.content || {};
  const editing = builderEditing?.enabled;
  const updateData = (patch) => builderEditing?.onBlockDataChange?.(block.type, patch);
  const select = (label) => builderEditing?.onSelectElement?.({ blockId: block.id, blockType: block.type, label });
  const variant = block.layout?.variant || 'turagua_contact_frame';
  const split = variant === 'turagua_contact_split';
  const compact = variant === 'turagua_contact_compact';
  const dark = variant === 'turagua_contact_dark';
  const selectedLocation = (businessIdentity.locations || []).find((location) => location.id === display.locationId) || businessIdentity.locations?.[0] || {};
  const email = businessIdentity.contact?.email || '';
  const phone = businessIdentity.contact?.primaryPhone || '';
  const hours = businessIdentity.commercialHours || {};
  const maps = {
    enabled: display.showMap,
    mode: display.mapStyle || 'editorial',
    zoom: display.mapZoom || selectedLocation.zoom || '15',
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    label: selectedLocation.name,
    caption: selectedLocation.addressLine,
    directionsUrl: selectedLocation.directionsUrl,
    showDirectionsButton: display.showDirectionsButton !== false,
  };
  const socials = Array.isArray(businessIdentity.socials) ? businessIdentity.socials.filter((item) => item?.label && item?.url) : [];
  const locationLines = [
    selectedLocation.addressLine,
    selectedLocation.reference,
    [selectedLocation.district, selectedLocation.city, selectedLocation.country].filter(Boolean).join(', '),
  ].filter(Boolean);
  const locationText = locationLines.join('\n') || 'Ubicacion por confirmar';
  const hoursLines = [
    hours.weekdays ? `Lunes a viernes: ${hours.weekdays}` : '',
    hours.saturday ? `Sabados: ${hours.saturday}` : '',
    hours.sunday ? `Domingos: ${hours.sunday}` : '',
  ].filter(Boolean);
  const hoursText = hoursLines.length ? hoursLines.join('\n') : hours.summary;
  const handleChat = (event) => {
    if (editing) {
      event.preventDefault();
      event.stopPropagation();
      select('Boton de contacto');
      return;
    }
    onOpenChat();
  };
  return (
    <section id={id} className={`landing-contact-frame landing-section relative overflow-hidden scroll-mt-16 ${compact ? 'bg-white py-10' : dark ? 'min-h-[calc(100vh-4rem)] bg-slate-950 py-[clamp(52px,7vh,84px)] text-white' : split ? 'min-h-[calc(100vh-4rem)] bg-white py-[clamp(52px,7vh,84px)]' : 'min-h-[calc(100vh-4rem)] bg-[#f5f7fb] py-[clamp(52px,7vh,84px)]'}`} onClick={() => editing && select('Contacto')}>
      {!compact ? <div className={`pointer-events-none absolute inset-0 ${dark ? 'bg-[radial-gradient(circle_at_20%_30%,rgba(0,174,239,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_55%)]' : 'bg-[radial-gradient(circle_at_20%_30%,rgba(0,174,239,0.12),transparent_32%),linear-gradient(135deg,rgba(17,24,39,0.04),transparent_55%)]'}`} /> : null}
      {!compact ? <div className={`pointer-events-none absolute bottom-10 left-[8vw] text-[10vw] font-black uppercase tracking-tight ${dark ? 'text-white/5' : 'text-white/70'}`}>Contacto</div> : null}
      <div className={`relative mx-auto grid max-w-[1320px] gap-8 px-[clamp(24px,5vw,72px)] ${compact ? 'lg:grid-cols-[0.7fr_0.3fr] lg:items-start' : split ? 'min-h-[calc(100vh-12rem)] lg:grid-cols-2 lg:items-stretch' : 'min-h-[calc(100vh-12rem)] lg:grid-cols-[0.56fr_0.44fr] lg:items-center'}`}>
        <div className="landing-reveal">
          <p className="landing-reveal text-xs font-black uppercase tracking-[0.24em] text-[var(--landing-primary)]">{content.eyebrow || data.eyebrow || 'Contacto & Atencion'}</p>
          <h2 className={`landing-reveal mt-4 font-black ${compact ? 'text-3xl' : 'text-5xl'} ${dark ? 'text-white' : 'text-[#3f3436]'}`} style={{ '--landing-stagger': '80ms' }}>
            <EditableCanvasText value={content.title || data.title || 'Contacto'} enabled={editing} onChange={(title) => updateData({ content: { ...content, title } })} />
          </h2>
          <p className={`landing-reveal mt-4 max-w-2xl leading-8 ${compact ? 'text-base' : 'text-lg'} ${dark ? 'text-slate-300' : 'text-slate-600'}`} style={{ '--landing-stagger': '160ms' }}>
            <EditableCanvasText value={content.description || data.body} enabled={editing} multiline onChange={(description) => updateData({ content: { ...content, description } })} />
          </p>

          <div className={`mt-7 grid gap-3 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            {(display.showAddress !== false) ? (
              <ContactFact icon={MapPin} label={data.addressLabel || 'Ubicacion del taller'} value={locationText} editable={false} onSelect={() => select('Direccion')} />
            ) : null}
            {(display.showPhone !== false && phone) ? (
              <ContactFact icon={Phone} label={data.phoneLabel || 'Atencion telefonica'} value={phone} editable={false} onSelect={() => select('Telefono')} />
            ) : null}
            {(display.showEmail !== false && email) ? (
              <ContactFact icon={Mail} label={data.emailLabel || 'Correo electronico'} value={email} editable={false} onSelect={() => select('Correo electronico')} />
            ) : null}
            {(display.showHours !== false && hoursText) ? (
              <ContactFact icon={Clock3} label={data.hoursLabel || 'Horarios de atencion'} value={hoursText} editable={false} onSelect={() => select('Horario publico')} />
            ) : null}
          </div>

          {socials.length ? (
            <div className="landing-reveal mt-5 flex flex-wrap gap-2" style={{ '--landing-stagger': '260ms' }}>
              {socials.map((social) => (
                <a key={social.url} href={social.url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition hover:border-[var(--landing-primary)] hover:text-[var(--landing-primary)] ${dark ? 'border-white/10 bg-white/10 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-600'}`}>
                  {social.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`landing-contact-panel landing-reveal rounded-2xl border p-6 backdrop-blur ${dark ? 'border-white/10 bg-white/8 shadow-2xl shadow-sky-950/20' : split ? 'border-slate-200 bg-slate-50 shadow-xl shadow-slate-200/60' : 'border-slate-200 bg-white/94 shadow-2xl shadow-slate-300/40'}`} style={{ '--landing-stagger': '120ms' }}>
          <div className={`rounded-xl p-5 text-white ${dark ? 'bg-white/10' : 'bg-slate-950'}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--landing-primary)]/18 text-[var(--landing-primary)]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">{content.agendaEyebrow || 'Agenda digital'}</p>
                <h3 className="mt-1 text-2xl font-black leading-tight">{content.agendaTitle || 'Agenda tu cita al instante'}</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              {content.agendaDescription || `Conversa con ${agentName} para resolver dudas sobre servicios, disponibilidad y coordinar tu cita rapidamente.`}
            </p>
            <Button type="button" onClick={handleChat} className="landing-action landing-contact-cta mt-6 w-full bg-[var(--landing-primary)] px-7 text-white">
              <MessageCircle className="h-4 w-4" />
              {content.agendaButtonLabel || data.cta || 'Agendar ahora'}
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${dark ? 'border-white/10 bg-white/8 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--landing-primary)]" />
              <span>{content.trustMessage || 'Proteccion, restauracion y estetica automotriz con seguimiento desde el primer contacto.'}</span>
            </div>
            <div className={`rounded-xl border p-4 ${dark ? 'border-sky-400/20 bg-sky-400/10' : 'border-sky-100 bg-sky-50/80'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">{content.processTitle || 'Proceso Turagua'}</p>
              <div className="mt-3 grid gap-2 text-sm font-bold text-[#3f3436]">
                {(content.processSteps || [
                  { id: 'need', text: 'Cuentas que necesita tu vehiculo' },
                  { id: 'iris', text: 'Iris orienta y confirma disponibilidad' },
                  { id: 'visit', text: 'Coordinamos tu visita al taller' },
                ]).map((step, index) => (
                  <span key={step.id || step.text}>{String(index + 1).padStart(2, '0')}. {step.text}</span>
                ))}
              </div>
            </div>
            {(display.showMap !== false) ? (
              <ContactLocationModule
                maps={maps}
                locationText={locationText}
                businessName={selectedLocation.name || businessName}
                editing={editing}
                onSelect={() => select('Mapa de ubicacion')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactLocationModule({ maps = {}, locationText, businessName, editing = false, onSelect }) {
  const hasCoordinates = maps.latitude && maps.longitude;
  const enabled = maps.enabled !== false && hasCoordinates;
  const label = maps.label || businessName;
  const caption = maps.caption || locationText;
  const query = hasCoordinates ? `${maps.latitude},${maps.longitude}` : locationText;
  const directionsUrl = maps.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || businessName)}`;

  return (
    <div
      className="landing-location-module overflow-hidden rounded-xl border border-slate-200 bg-white"
      data-landing-canvas-selectable={editing ? 'Mapa de ubicacion' : undefined}
      onClick={(event) => {
        if (!editing) return;
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <div className={`relative min-h-40 ${enabled ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <div className="absolute inset-0 opacity-70" style={{
          backgroundImage: 'linear-gradient(rgba(0,174,239,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,239,.14) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_48%,rgba(0,174,239,0.22),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent)]" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--landing-primary)] text-white shadow-xl shadow-sky-900/30">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="mt-2 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm">{enabled ? 'Taller' : 'Ubicacion'}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-black text-[#3f3436]">{label}</p>
        <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">{caption}</p>
        {(maps.showDirectionsButton !== false) ? (
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800">
            Como llegar
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

const fallbackTuraguaServices = [
  { _id: 'fallback-diagnostico', name: 'Diagnostico general', description: 'Revision integral del vehiculo.', category: 'Diagnostico' },
  { _id: 'fallback-mantenimiento', name: 'Mantenimiento preventivo', description: 'Servicio programado por kilometraje.', category: 'Mantenimiento' },
  { _id: 'fallback-lavado', name: 'Lavado premium', description: 'Limpieza profunda interior y exterior.', category: 'Estetica' },
  { _id: 'fallback-undercoating', name: 'Arenado + Undercoating', description: 'Proteccion inferior contra oxido y desgaste.', category: 'Proteccion' },
];

function FeatureIcon({ name }) {
  const Icon = name === 'trophy' ? Trophy : name === 'wrench' ? Wrench : Sparkles;
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[var(--landing-primary)]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function ContactFact({ icon: Icon, label, value, editable = false, onChange, onSelect }) {
  const normalized = String(label || '').toLowerCase();
  const href = !editable && value && normalized.includes('telefon')
    ? `tel:${String(value).replace(/[^\d+]/g, '')}`
    : !editable && value && normalized.includes('correo')
      ? `mailto:${value}`
      : !editable && value && (normalized.includes('direccion') || normalized.includes('ubicacion'))
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
      : '';
  const content = <EditableCanvasText value={value || 'Por confirmar'} enabled={editable} onChange={onChange} />;
  return (
    <div
      className={`landing-contact-fact rounded-lg border border-slate-200 bg-slate-50 p-5 ${editable ? 'transition hover:border-[var(--landing-primary)] hover:ring-2 hover:ring-[var(--landing-primary)]/20' : ''}`}
      data-landing-canvas-selectable={editable ? label : undefined}
      onClick={(event) => {
        if (!editable) return;
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <Icon className="mb-4 h-5 w-5 text-[var(--landing-primary)]" />
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 whitespace-pre-line text-base font-bold text-slate-950">
        {href ? <a href={href} target={normalized.includes('direccion') || normalized.includes('ubicacion') ? '_blank' : undefined} rel={normalized.includes('direccion') || normalized.includes('ubicacion') ? 'noreferrer' : undefined}>{content}</a> : content}
      </div>
    </div>
  );
}
