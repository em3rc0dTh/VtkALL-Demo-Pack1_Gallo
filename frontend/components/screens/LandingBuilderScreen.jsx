'use client';

import { useMemo, useState } from 'react';
import { Eye, LayoutTemplate, Monitor, Palette, RotateCcw, Save, SlidersHorizontal, Smartphone } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { adminMutationRepository } from '@/lib/admin/adminMutationRepository';
import { demoTestQueryKeys } from '@/lib/query/queryKeys';
import { defaultLandingConfig, getLandingConfig } from '@/lib/landing/landingConfig';

const joinList = (items = []) => items.join(', ');
const splitList = (value = '') => value.split(',').map((item) => item.trim()).filter(Boolean);

export function LandingBuilderScreen() {
  const { profile } = useBusinessProfile();
  const initialConfig = useMemo(() => getLandingConfig(profile), [profile]);
  const profileConfigKey = useMemo(() => JSON.stringify({
    id: profile?._id || profile?.businessSlug,
    landing: profile?.landing || null,
  }), [profile]);

  return (
    <LandingBuilderEditor
      key={profileConfigKey}
      profile={profile}
      initialConfig={initialConfig}
    />
  );
}

function LandingBuilderEditor({ profile, initialConfig }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialConfig);
  const [visualChipsText, setVisualChipsText] = useState(joinList(initialConfig.visual.chips));
  const [galleryItemsText, setGalleryItemsText] = useState(joinList(initialConfig.sections.galleryItems));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');

  const update = (section, key, value) => {
    setMessage('');
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const updateList = (section, key, value, setText) => {
    setText(value);
    update(section, key, splitList(value));
  };

  const save = async () => {
    if (!profile?._id) {
      setMessage('No se puede guardar: el BusinessProfile no tiene _id activo.');
      return;
    }

    setSaving(true);
    setMessage('');
    const queryKey = demoTestQueryKeys.businessProfile({ businessSlug: profile.businessSlug });
    try {
      const updatedProfile = await adminMutationRepository.updateBusinessProfile({
        profileId: profile._id,
        patch: { landing: form },
      });

      queryClient.setQueryData(queryKey, (current) => {
        if (!current?.businessProfile) return current;
        return {
          ...current,
          businessProfile: {
            ...current.businessProfile,
            ...(updatedProfile || {}),
            landing: updatedProfile?.landing || form,
          },
        };
      });
      await queryClient.invalidateQueries({ queryKey });
      setMessage('Landing guardada en BusinessProfile.');
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar la landing.');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    const defaults = defaultLandingConfig(profile);
    setForm(defaults);
    setVisualChipsText(joinList(defaults.visual.chips));
    setGalleryItemsText(joinList(defaults.sections.galleryItems));
    setMessage('Valores base cargados. Guarda para persistirlos.');
  };

  return (
    <div className="relative grid h-full min-h-0 gap-5 overflow-hidden rounded-xl bg-[#271f1f] p-4 text-white xl:grid-cols-[0.98fr_1.02fr]">
      <div className="col-span-full flex min-h-16 items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900 px-5 py-4 shadow-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Constructor visual</h2>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-slate-400">Arquitectura real: edita y guarda en BusinessProfile.landing.</p>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-500/30 bg-slate-800 px-4 text-sm font-bold text-white hover:border-sky-400 hover:bg-slate-700"
        >
          <Palette className="h-4 w-4 text-sky-400" />
          Valores base
        </button>
      </div>

      <section className="min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4 pb-28">
          <EditorSection title="Seccion Principal (Hero)" code="<HeroBlock />" active>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Eyebrow" value={form.hero.eyebrow} onChange={(value) => update('hero', 'eyebrow', value)} />
              <TextInput label="Titulo principal" value={form.hero.title} onChange={(value) => update('hero', 'title', value)} />
              <TextAreaInput className="md:col-span-2" label="Subtitulo descriptivo" value={form.hero.subtitle} onChange={(value) => update('hero', 'subtitle', value)} />
              <TextInput label="Texto del boton primario" value={form.hero.primaryCta} onChange={(value) => update('hero', 'primaryCta', value)} />
              <TextInput label="Texto del boton secundario" value={form.hero.secondaryCta} onChange={(value) => update('hero', 'secondaryCta', value)} />
            </div>
          </EditorSection>

          <EditorSection title="Visual operativo" code="<VisualBlock />">
            <TextInput label="Titulo visual" value={form.visual.title} onChange={(value) => update('visual', 'title', value)} />
            <TextAreaInput label="Chips separados por coma" value={visualChipsText} onChange={(value) => updateList('visual', 'chips', value, setVisualChipsText)} />
          </EditorSection>

          <EditorSection title="Catalogo de Servicios" code="<ServicesBlock />" active>
            <TextInput label="Titulo de la seccion" value={form.sections.servicesTitle} onChange={(value) => update('sections', 'servicesTitle', value)} />
            <TextAreaInput label="Subtitulo descriptivo" value={form.sections.servicesDescription} onChange={(value) => update('sections', 'servicesDescription', value)} />
          </EditorSection>

          <EditorSection title="Sobre Nosotros" code="<SobreNosotrosBlock />">
            <TextInput label="Titulo de la seccion" value={form.sections.aboutTitle} onChange={(value) => update('sections', 'aboutTitle', value)} />
            <TextAreaInput label="Texto institucional" value={form.sections.aboutBody} onChange={(value) => update('sections', 'aboutBody', value)} />
          </EditorSection>

          <EditorSection title="Galeria" code="<GalleryBlock />">
            <TextInput label="Titulo galeria" value={form.sections.galleryTitle} onChange={(value) => update('sections', 'galleryTitle', value)} />
            <TextAreaInput label="Items galeria separados por coma" value={galleryItemsText} onChange={(value) => updateList('sections', 'galleryItems', value, setGalleryItemsText)} />
          </EditorSection>

          <EditorSection title="Contacto y Horarios" code="<ContactoBlock />">
            <TextInput label="Titulo contacto" value={form.sections.contactTitle} onChange={(value) => update('sections', 'contactTitle', value)} />
            <TextAreaInput label="Texto contacto" value={form.sections.contactBody} onChange={(value) => update('sections', 'contactBody', value)} />
          </EditorSection>
        </div>
      </section>

      <section className="relative min-h-0">
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white">
            <Monitor className="h-4 w-4 text-sky-400" />
            Canvas en vivo
          </span>
          <div className="flex rounded-xl bg-slate-950 p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-black uppercase ${previewMode === 'desktop' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Web
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-black uppercase ${previewMode === 'mobile' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Movil
            </button>
          </div>
        </div>

        <div className={`mx-auto flex h-[calc(100%-3.25rem)] min-h-0 flex-col overflow-hidden border border-slate-700 bg-black shadow-2xl ${previewMode === 'mobile' ? 'max-w-[380px] rounded-[2rem] border-[8px] border-slate-800' : 'w-full rounded-xl'}`}>
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 px-4">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <div className="mx-auto flex h-7 w-2/3 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-500">
              demo-test.local
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#05070b] p-4">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-base font-black italic tracking-tight text-white">DEMO<span className="text-sky-400">TEST</span></span>
              <div className="hidden gap-5 text-xs font-bold text-slate-300 sm:flex">
                <span>Inicio</span>
                <span>Servicios</span>
                <span className="rounded-md bg-sky-500 px-3 py-1 text-white">Agendar</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#213f97] p-8 text-right shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
              <Badge estado={form.hero.eyebrow} variant="info" className="mb-4 bg-sky-100 text-blue-800" />
              <h2 className="ml-auto max-w-3xl text-3xl font-black leading-tight text-white md:text-4xl">{form.hero.title}</h2>
              <p className="ml-auto mt-5 max-w-xl text-sm leading-7 text-blue-50">{form.hero.subtitle}</p>
              <div className="mt-7 flex justify-end gap-3">
                <button type="button" className="rounded-lg bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg">{form.hero.primaryCta}</button>
                <button type="button" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-black text-white">{form.hero.secondaryCta}</button>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-black/70 p-6 text-center">
              <h3 className="text-xl font-black text-white">{form.sections.servicesTitle}</h3>
              <p className="mx-auto mt-3 max-w-3xl text-xs leading-6 text-slate-400">{form.sections.servicesDescription}</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <PreviewPanel title={form.visual.title} items={form.visual.chips} />
                <PreviewPanel title={form.sections.galleryTitle} items={form.sections.galleryItems} />
                <div className="rounded-xl bg-white p-5 text-left text-slate-950">
                  <h4 className="font-black">{form.sections.aboutTitle}</h4>
                  <p className="mt-3 text-xs leading-6 text-slate-600">{form.sections.aboutBody}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        {message && <span className="max-w-sm rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 shadow-xl">{message}</span>}
        <Button icon={Save} loading={saving} onClick={save} className="min-h-14 rounded-2xl bg-sky-500 px-7 text-base font-black shadow-[0_18px_50px_rgba(14,165,233,0.45)] hover:bg-sky-400">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function EditorSection({ title, code, active = false, children }) {
  return (
    <section className={`overflow-hidden rounded-2xl border ${active ? 'border-sky-500/25 bg-slate-900' : 'border-slate-700/70 bg-slate-950/70'}`}>
      <div className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-800/80 px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-white">{title}</h3>
            {active && <span className="rounded-full bg-sky-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300">Editando</span>}
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden min-h-9 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-[11px] font-black uppercase tracking-wider text-slate-300 sm:inline-flex">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Personalizar
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="space-y-4 p-6">
        {children}
      </div>
    </section>
  );
}

function TextInput({ label, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel className="text-[11px] text-slate-400">{label}</FieldLabel>
      <Input className="border-slate-700 bg-[#050914] text-white focus:border-sky-400 focus:ring-sky-400" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaInput({ label, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel className="text-[11px] text-slate-400">{label}</FieldLabel>
      <Textarea className="border-slate-700 bg-[#050914] text-white focus:border-sky-400 focus:ring-sky-400" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PreviewPanel({ title, items }) {
  return (
    <div className="rounded-xl bg-white p-5 text-left text-slate-950">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items || []).map((item) => <Badge key={item} estado={item} variant="neutral" />)}
      </div>
    </div>
  );
}
