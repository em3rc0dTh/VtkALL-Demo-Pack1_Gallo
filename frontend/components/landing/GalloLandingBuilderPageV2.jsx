'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UploadCloud,
} from 'lucide-react';
import { landingRepository } from '@/lib/landing/landingRepository';
import { cloneLandingContent } from '@/lib/landing/landingContract';
import {
  formatGalloAddress,
  galloHoursLines,
  inferGalloCatalogCategory,
  projectGalloBusinessProfile,
} from '@/lib/landing/galloAuthorityProjection';

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin';

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: 1440, height: 900, icon: Monitor },
  tablet: { label: 'Tablet', width: 834, height: 1112, icon: Tablet },
  mobile: { label: 'Móvil', width: 390, height: 844, icon: Smartphone },
};

const GALLO_THEME = {
  primary: '#1741FF',
  accent: '#FFD400',
  surface: '#F7F8FC',
  text: '#080B19',
};

const CATALOG_CATEGORIES = [
  { value: 'mecanica_mantenimiento', label: 'Mecánica & mantenimiento' },
  { value: 'diagnostico_seguridad', label: 'Diagnóstico & seguridad' },
  { value: 'carroceria_cuidado', label: 'Carrocería & cuidado' },
];

const SCENE_META = {
  gallo_workshop_hero: { label: 'Inicio / Hero', type: 'hero' },
  gallo_partners_scene: { label: 'Confianza · Marcas + Aseguradoras', type: 'structured_content' },
  gallo_services_scene: { label: 'Servicios', type: 'catalog' },
  gallo_diagnostic_scene: { label: 'Diagnóstico', type: 'structured_content' },
  gallo_process_scene: { label: 'Proceso', type: 'structured_content' },
  gallo_experience_scene: { label: 'Nosotros / +25 años', type: 'about' },
  gallo_evidence_scene: { label: 'Evidencia', type: 'testimonials' },
  gallo_contact_scene: { label: 'Contacto / Solicitar cita', type: 'contact' },
};

const SCENE_TEMPLATES = [
  {
    variant: 'gallo_partners_scene',
    block: {
      type: 'structured_content', frameHeight: 'viewport',
      layout: { variant: 'gallo_partners_scene', align: 'center' },
      data: { eyebrow: 'Confianza que nos respalda', title: 'Marcas y aseguradoras', subtitle: '', brands: [], insurers: [] },
    },
  },
  {
    variant: 'gallo_services_scene',
    block: {
      type: 'catalog', frameHeight: 'viewport',
      layout: { variant: 'gallo_services_scene', align: 'left', density: 'comfortable' },
      data: {
        eyebrow: 'Workshop', title: 'Servicios', subtitle: 'La oferta visible viene del Catálogo de Servicios de Gallo.',
        serviceGroups: [
          { title: 'Mecánica & mantenimiento', description: '', category: 'mecanica_mantenimiento', imageUrl: '' },
          { title: 'Diagnóstico & seguridad', description: '', category: 'diagnostico_seguridad', imageUrl: '' },
          { title: 'Carrocería & cuidado', description: '', category: 'carroceria_cuidado', imageUrl: '' },
        ],
      },
    },
  },
  {
    variant: 'gallo_diagnostic_scene',
    block: {
      type: 'structured_content', frameHeight: 'viewport',
      layout: { variant: 'gallo_diagnostic_scene', align: 'left', media: 'side' },
      data: { eyebrow: 'Diagnóstico', title: 'Diagnóstico antes que suposición', subtitle: '', imageUrl: '', steps: [] },
    },
  },
  {
    variant: 'gallo_process_scene',
    block: {
      type: 'structured_content', frameHeight: 'viewport',
      layout: { variant: 'gallo_process_scene', align: 'center' },
      data: { eyebrow: 'Así trabaja Gallo', title: 'Proceso', steps: [] },
    },
  },
  {
    variant: 'gallo_experience_scene',
    block: {
      type: 'about', frameHeight: 'viewport',
      layout: { variant: 'gallo_experience_scene', align: 'left', media: 'background' },
      data: { eyebrow: 'Gallo Autos', title: 'Más de 25 años de taller.', body: '', imageUrl: '', features: [] },
    },
  },
  {
    variant: 'gallo_evidence_scene',
    block: {
      type: 'testimonials', frameHeight: 'viewport',
      layout: { variant: 'gallo_evidence_scene', align: 'left' },
      data: { eyebrow: 'Resultados que hablan', title: 'Evidencia', subtitle: '', imageUrl: '' },
    },
  },
  {
    variant: 'gallo_contact_scene',
    block: {
      type: 'contact', frameHeight: 'viewport',
      layout: { variant: 'gallo_contact_scene', align: 'left' },
      data: {
        eyebrow: 'Tu próximo paso', title: 'Cuéntanos qué está pasando con tu auto.', subtitle: '', primaryCta: 'Contactar a Gallo',
        note: 'Solicitud enviada ≠ cita confirmada.',
      },
    },
  },
];

const copy = (value) => JSON.parse(JSON.stringify(value));
const sorted = (blocks = []) => [...blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
const variantFor = (block) => block?.layout?.variant || block?.data?.variant || '';
const labelFor = (block) => SCENE_META[variantFor(block)]?.label || block?.data?.title || block?.id || 'Sección';
const isVideo = (value = '') => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(value);

function Field({ label, value = '', onChange, textarea = false, rows = 3, placeholder = '' }) {
  const className = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1741ff] focus:ring-2 focus:ring-[#1741ff]/10';
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {textarea ? (
        <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${className} resize-y`} />
      ) : (
        <input value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1741ff]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function SmallButton({ children, onClick, disabled = false, danger = false, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:border-[#1741ff]/35 hover:text-[#1741ff]'}`}
    >
      {children}
    </button>
  );
}

function reorder(items, index, direction) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function AuthorityCard({ title, source, children, actionLabel, actionHint }) {
  return (
    <div className="rounded-xl border border-[#1741ff]/20 bg-[#1741ff]/[0.045] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1741ff]"><Database className="h-3.5 w-3.5" />Fuente de autoridad</div>
          <div className="mt-1 text-sm font-black text-slate-900">{title}</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">{source}</div>
        </div>
        {actionLabel ? <span title={actionHint || ''} className="inline-flex items-center gap-1 rounded-lg border border-[#1741ff]/15 bg-white px-2.5 py-1.5 text-[10px] font-black text-[#1741ff]"><ExternalLink className="h-3 w-3" />{actionLabel}</span> : null}
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
      <div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-[11px] font-semibold leading-5 text-slate-500">Solo lectura desde este Builder. Cambia el dato en su superficie propietaria.</div>
    </div>
  );
}

async function uploadLandingAsset(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/v1/admin/landing-assets', {
    method: 'POST',
    headers: { 'X-Demo-Test-Admin-Token': ADMIN_TOKEN },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message || payload?.message || 'No se pudo subir el archivo.');
  }
  return payload?.data || payload;
}

function MediaField({ label, value = '', onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const asset = await uploadLandingAsset(file);
      onChange(asset.url);
    } catch (uploadError) {
      setError(uploadError.message || 'No se pudo subir.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      {value ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          {isVideo(value) ? <video src={value} className="h-32 w-full object-cover" controls muted /> : <img src={value} alt="" className="h-32 w-full object-cover" />}
        </div>
      ) : null}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <SmallButton onClick={() => inputRef.current?.click()}><UploadCloud className="h-3.5 w-3.5" />{uploading ? 'Subiendo...' : value ? 'Reemplazar' : 'Subir media'}</SmallButton>
        {value ? <SmallButton danger onClick={() => onChange('')}><Trash2 className="h-3.5 w-3.5" />Quitar</SmallButton> : null}
      </div>
      {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
    </div>
  );
}

function StringList({ title, items = [], onChange, placeholder = 'Nuevo elemento' }) {
  const values = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{title}</div>
        <SmallButton onClick={() => onChange([...values, placeholder])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
            <input
              value={typeof item === 'string' ? item : ''}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-800 outline-none"
            />
            <SmallButton disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3 w-3" /></SmallButton>
            <SmallButton disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3 w-3" /></SmallButton>
            <SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" /></SmallButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectList({ title, items = [], fields, createItem, onChange }) {
  const values = Array.isArray(items) ? items : [];
  const updateItem = (index, key, value) => {
    const next = copy(values);
    next[index] = { ...(next[index] || {}), [key]: value };
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{title}</div>
        <SmallButton onClick={() => onChange([...values, createItem()])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton>
      </div>
      <div className="space-y-3">
        {values.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Elemento {index + 1}</span>
              <div className="flex gap-1">
                <SmallButton disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3 w-3" /></SmallButton>
                <SmallButton disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3 w-3" /></SmallButton>
                <SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" /></SmallButton>
              </div>
            </div>
            <div className="grid gap-3">
              {fields.map((field) => field.media ? (
                <MediaField key={field.key} label={field.label} value={item?.[field.key] || ''} onChange={(value) => updateItem(index, field.key, value)} />
              ) : (
                <Field key={field.key} label={field.label} value={item?.[field.key] || ''} textarea={field.textarea} rows={field.rows || 2} onChange={(value) => updateItem(index, field.key, value)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogGroupEditor({ groups = [], catalogOfferings = [], onChange }) {
  const values = Array.isArray(groups) ? groups : [];
  const update = (index, patch) => {
    const next = copy(values);
    next[index] = { ...(next[index] || {}), ...patch };
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-900">Presentación del catálogo</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">Elige qué categoría alimenta cada grupo visual. Los servicios se editan en Servicios.</div>
        </div>
        <SmallButton onClick={() => onChange([...values, { title: 'Nuevo grupo', description: '', category: '', imageUrl: '' }])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton>
      </div>
      <div className="space-y-3">
        {values.map((group, index) => {
          const category = inferGalloCatalogCategory(group);
          const count = catalogOfferings.filter((offering) => offering?.active !== false && offering?.publicVisible !== false && String(offering?.category || '') === category).length;
          return (
            <div key={`${group.title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Grupo {index + 1} · {count} ofertas</span>
                <div className="flex gap-1">
                  <SmallButton disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3 w-3" /></SmallButton>
                  <SmallButton disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3 w-3" /></SmallButton>
                  <SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" /></SmallButton>
                </div>
              </div>
              <div className="grid gap-3">
                <SelectField label="Categoría fuente" value={category} onChange={(value) => update(index, { category: value })} options={[{ value: '', label: 'Sin categoría' }, ...CATALOG_CATEGORIES]} />
                <Field label="Título visual" value={group.title || ''} onChange={(value) => update(index, { title: value })} />
                <Field label="Texto editorial del grupo" value={group.description || ''} textarea onChange={(value) => update(index, { description: value })} />
                <MediaField label="Media del grupo" value={group.imageUrl || ''} onChange={(value) => update(index, { imageUrl: value })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LayoutEditor({ block, onChange }) {
  const layout = block.layout || {};
  return (
    <div className="grid gap-3 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/[0.035] p-3 sm:grid-cols-3">
      <SelectField label="Alineación" value={layout.align || 'left'} onChange={(align) => onChange({ ...layout, align })} options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]} />
      <SelectField label="Media" value={layout.media || 'background'} onChange={(media) => onChange({ ...layout, media })} options={[{ value: 'background', label: 'Fondo' }, { value: 'side', label: 'Lateral' }, { value: 'none', label: 'Sin media' }]} />
      <SelectField label="Densidad" value={layout.density || 'comfortable'} onChange={(density) => onChange({ ...layout, density })} options={[{ value: 'comfortable', label: 'Cómoda' }, { value: 'compact', label: 'Compacta' }]} />
    </div>
  );
}

function SceneEditor({ block, onChange, authority }) {
  if (!block) return <div className="p-6 text-sm font-semibold text-slate-500">Selecciona una sección.</div>;
  const data = block.data || {};
  const variant = variantFor(block);
  const business = projectGalloBusinessProfile(authority?.businessProfile || {});
  const catalogOfferings = Array.isArray(authority?.catalogOfferings) ? authority.catalogOfferings : [];
  const updateData = (patch) => onChange({ ...block, data: { ...data, ...patch } });
  const updateLayout = (layout) => onChange({ ...block, layout });

  let editor = (
    <div className="grid gap-4">
      <Field label="Título" value={data.title || ''} onChange={(title) => updateData({ title })} />
      <Field label="Contenido" value={data.body || data.subtitle || ''} textarea onChange={(body) => updateData({ body, subtitle: body })} />
    </div>
  );

  if (variant === 'gallo_workshop_hero') {
    editor = (
      <div className="grid gap-4">
        <AuthorityCard title="Identidad pública de Gallo" source="Ajustes / BusinessProfile" actionLabel="Administrar en Ajustes">
          <div className="font-black text-slate-900">{business.displayName}</div>
          <div className="mt-1 text-slate-600">{business.tagline || 'Tagline por configurar'}</div>
          <div className="mt-2 text-xs font-semibold text-slate-500">El logo y la frase corporativa del Hero vienen de BusinessProfile y no se duplican aquí.</div>
        </AuthorityCard>
        <Field label="Etiqueta superior" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título principal" value={data.title} textarea rows={4} onChange={(title) => updateData({ title })} />
        <Field label="Descripción editorial" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <Field label="Texto de soporte" value={data.supportingText} onChange={(supportingText) => updateData({ supportingText })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA principal" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} />
          <Field label="CTA secundario" value={data.secondaryCta} onChange={(secondaryCta) => updateData({ secondaryCta })} />
        </div>
        <MediaField label="Imagen o video del Hero" value={data.heroMediaUrl || ''} onChange={(heroMediaUrl) => updateData({ heroMediaUrl })} />
      </div>
    );
  }

  if (variant === 'gallo_partners_scene') {
    editor = (
      <div className="grid gap-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">Marcas y aseguradoras siguen siendo datos editoriales verificados durante B0. Todavía no existe una autoridad operativa adoptada para esas relaciones.</div>
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <StringList title="Marcas de vehículos" items={data.brands || []} placeholder="Nueva marca" onChange={(brands) => updateData({ brands })} />
        <StringList title="Aseguradoras" items={data.insurers || []} placeholder="Nueva aseguradora" onChange={(insurers) => updateData({ insurers })} />
      </div>
    );
  }

  if (variant === 'gallo_services_scene') {
    const publicCount = catalogOfferings.filter((offering) => offering?.active !== false && offering?.publicVisible !== false).length;
    editor = (
      <div className="grid gap-4">
        <AuthorityCard title="Catálogo de Servicios de Gallo" source="Servicios / CatalogOffering" actionLabel="Administrar en Servicios">
          <div className="font-black text-slate-900">{publicCount} ofertas públicas activas</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {catalogOfferings.slice(0, 12).map((offering) => <span key={offering._id} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{offering.displayName || offering.name || offering.title}</span>)}
          </div>
        </AuthorityCard>
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción editorial" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <CatalogGroupEditor groups={data.serviceGroups || []} catalogOfferings={catalogOfferings} onChange={(serviceGroups) => updateData({ serviceGroups })} />
      </div>
    );
  }

  if (variant === 'gallo_diagnostic_scene') {
    editor = (
      <div className="grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">Explicación pública del método; no es el estado de un Case ni una evaluación clínica/operativa en vivo.</div>
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <MediaField label="Media de diagnóstico" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
        <StringList title="Pasos" items={data.steps || []} placeholder="Nuevo paso" onChange={(steps) => updateData({ steps })} />
      </div>
    );
  }

  if (variant === 'gallo_process_scene') {
    editor = (
      <div className="grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">Proceso explicativo. Debe respetar las separaciones canónicas, pero no se conecta directamente a estados individuales de Case/Appointment/Decision.</div>
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <ObjectList title="Pasos del proceso" items={data.steps || []} onChange={(steps) => updateData({ steps })} createItem={() => ({ number: '01', title: 'Nuevo paso', body: '' })} fields={[{ key: 'number', label: 'Número' }, { key: 'title', label: 'Título' }, { key: 'body', label: 'Descripción', textarea: true }]} />
      </div>
    );
  }

  if (variant === 'gallo_experience_scene') {
    editor = (
      <div className="grid gap-4">
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Historia" value={data.body} textarea rows={5} onChange={(body) => updateData({ body })} />
        <MediaField label="Media" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
        <ObjectList title="Puntos de confianza" items={data.features || []} onChange={(features) => updateData({ features })} createItem={() => ({ title: 'Nuevo punto', body: '' })} fields={[{ key: 'title', label: 'Título' }, { key: 'body', label: 'Descripción', textarea: true }]} />
      </div>
    );
  }

  if (variant === 'gallo_evidence_scene') {
    editor = (
      <div className="grid gap-4">
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <MediaField label="Imagen de evidencia" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
        <div className="rounded-lg border border-[#1741ff]/15 bg-[#1741ff]/5 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">Solo evidencia real y verificable. No se proyectan Case, Attachment, TimelineEvent ni datos de cliente directamente a la web.</div>
      </div>
    );
  }

  if (variant === 'gallo_contact_scene') {
    const address = formatGalloAddress(business.primaryLocation) || 'Ubicación por configurar';
    const hours = galloHoursLines(business.commercialHours);
    editor = (
      <div className="grid gap-4">
        <AuthorityCard title="Contacto, ubicación y horarios" source="Ajustes / BusinessProfile" actionLabel="Administrar en Ajustes">
          <div className="font-black text-slate-900">{address}</div>
          <div className="mt-1 text-slate-600">{hours.join(' · ') || 'Horario por configurar'}</div>
          <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500">
            <span>Teléfono: {business.contact?.primaryPhone || '—'}</span>
            <span>WhatsApp: {business.contact?.whatsapp || '—'}</span>
            <span>Email: {business.contact?.email || '—'}</span>
          </div>
        </AuthorityCard>
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción editorial" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <Field label="CTA" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} />
        <Field label="Nota operativa" value={data.note} textarea onChange={(note) => updateData({ note })} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Diseño Gallo · {variant || 'bloque genérico'} · Builder V2 authority-aware</div>
      <LayoutEditor block={block} onChange={updateLayout} />
      {editor}
    </div>
  );
}

function PreviewCanvas({ payload, viewport }) {
  const iframeRef = useRef(null);
  const config = VIEWPORTS[viewport] || VIEWPORTS.desktop;

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin);
  }, [payload, viewport]);

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#e9edf8] p-5">
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl" style={{ width: config.width, minWidth: config.width, height: config.height }}>
        <iframe
          ref={iframeRef}
          title="Canvas vivo Gallo Autos"
          src={`/admin/landing/preview?viewport=${viewport}`}
          width={config.width}
          height={config.height}
          className="block border-0"
          onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin)}
        />
      </div>
    </div>
  );
}

function ThemePanel({ theme, onChange }) {
  const active = { ...GALLO_THEME, ...(theme || {}) };
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-1 flex items-center gap-2 text-lg font-black text-slate-900"><Palette className="h-5 w-5 text-[#1741ff]" />Apariencia Global</div>
        <p className="text-sm leading-6 text-slate-500">Tema editorial de Gallo Autos. Esto pertenece a LandingPage y no altera BusinessProfile ni CatalogOffering.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(active).map(([key, value]) => (
          <label key={key} className="rounded-xl border border-slate-200 bg-white p-3">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{key}</span>
            <div className="grid grid-cols-[44px_1fr] gap-2">
              <input type="color" value={value} onChange={(event) => onChange({ ...active, [key]: event.target.value })} className="h-10 w-11 rounded-lg border border-slate-200 bg-white p-1" />
              <input value={value} onChange={(event) => onChange({ ...active, [key]: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold" />
            </div>
          </label>
        ))}
      </div>
      <button type="button" onClick={() => onChange(GALLO_THEME)} className="w-max rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">Restablecer tema Gallo</button>
    </div>
  );
}

function GeneralPanel({ payload, versions = [], onRestore }) {
  const business = projectGalloBusinessProfile(payload?.businessProfile || {});
  const catalogOfferings = Array.isArray(payload?.catalogOfferings) ? payload.catalogOfferings : [];
  const address = formatGalloAddress(business.primaryLocation) || 'Ubicación por configurar';
  const hours = galloHoursLines(business.commercialHours);
  const publicCatalog = catalogOfferings.filter((offering) => offering?.active !== false && offering?.publicVisible !== false);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-black text-slate-900">Datos Generales · Gallo Autos</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Esta vista muestra las autoridades que alimentan la Landing. Para cambiar un maestro usa Ajustes o Servicios; el Builder controla presentación.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <AuthorityCard title="BusinessProfile" source="Admin → Ajustes" actionLabel="Administrar en Ajustes">
          <div className="font-black text-slate-900">{business.displayName}</div>
          <div className="mt-1 text-slate-600">{business.tagline || 'Tagline por configurar'}</div>
          <div className="mt-2 text-xs font-semibold text-slate-500">{address}</div>
          <div className="text-xs font-semibold text-slate-500">{hours.join(' · ') || 'Horario por configurar'}</div>
        </AuthorityCard>
        <AuthorityCard title="CatalogOffering" source="Admin → Servicios" actionLabel="Administrar en Servicios">
          <div className="font-black text-slate-900">{publicCatalog.length} ofertas públicas activas</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {publicCatalog.slice(0, 10).map((offering) => <span key={offering._id} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{offering.displayName || offering.name || offering.title}</span>)}
          </div>
        </AuthorityCard>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><div><div className="font-black text-slate-900">Versiones de presentación</div><div className="text-xs font-semibold text-slate-500">Versiones de LandingPage Gallo/home; no versionan BusinessProfile ni CatalogOffering.</div></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{versions.length}</span></div>
        <div className="space-y-2">
          {versions.slice(0, 8).map((version) => (
            <div key={version._id || version.version} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <div><div className="text-sm font-black text-slate-800">v{version.version} · {version.action || 'version'}</div><div className="text-xs text-slate-500">{version.title || 'Gallo Autos Workshop'}</div></div>
              <SmallButton onClick={() => onRestore(version.version)}>Restaurar draft</SmallButton>
            </div>
          ))}
          {!versions.length ? <div className="text-sm font-semibold text-slate-500">Sin historial disponible.</div> : null}
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ hero, onChange }) {
  const stats = Array.isArray(hero?.data?.stats) ? hero.data.stats : [];
  if (!hero) return <div className="p-4 text-sm font-semibold text-slate-500">No existe Hero Gallo.</div>;
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">Estos datos son copy editorial. No uses métricas operativas no verificadas.</div>
      <ObjectList title="Datos destacados del Hero" items={stats} onChange={onChange} createItem={() => ({ value: '', label: 'Dato' })} fields={[{ key: 'value', label: 'Valor' }, { key: 'label', label: 'Etiqueta' }]} />
    </div>
  );
}

export function GalloLandingBuilderPageV2() {
  const [source, setSource] = useState(null);
  const [draft, setDraft] = useState(null);
  const [activePanel, setActivePanel] = useState('site');
  const [activeBlockId, setActiveBlockId] = useState('');
  const [viewport, setViewport] = useState('desktop');
  const [status, setStatus] = useState('Cargando landing...');
  const [busy, setBusy] = useState(false);
  const [draggedId, setDraggedId] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const load = async () => {
    setStatus('Cargando landing Gallo + autoridades...');
    try {
      const data = await landingRepository.getAdminLandingPage({ businessSlug: 'gallo', pageSlug: 'home' });
      const content = cloneLandingContent(data?.landingPage?.draft || data?.landingPage?.published || data?.content);
      setSource(data);
      setDraft(content);
      const first = sorted(content?.blocks || [])[0]?.id || '';
      setActiveBlockId((current) => current || first);
      setStatus(`Todos los cambios guardados · presentación publicada v${data?.landingPage?.publishedVersion || 0}`);
    } catch (error) {
      setStatus(error.message || 'No se pudo cargar la landing Gallo.');
    }
  };

  useEffect(() => { load(); }, []);

  const blocks = useMemo(() => sorted(draft?.blocks || []), [draft]);
  const hero = useMemo(() => blocks.find((block) => variantFor(block) === 'gallo_workshop_hero'), [blocks]);
  const activeBlock = blocks.find((block) => block.id === activeBlockId) || blocks[0];
  const isDirty = Boolean(draft && source?.landingPage?.draft && JSON.stringify(draft) !== JSON.stringify(source.landingPage.draft));

  const previewPayload = useMemo(() => draft ? {
    landingPage: { ...(source?.landingPage || {}), businessSlug: 'gallo', pageSlug: 'home', draft, published: draft },
    content: draft,
    businessProfile: source?.businessProfile || { businessSlug: 'gallo', businessName: 'Gallo Autos', brand: { displayName: 'Gallo Autos' } },
    catalogOfferings: source?.catalogOfferings || [],
  } : null, [draft, source]);

  const pushHistory = () => {
    if (!draft) return;
    setUndoStack((stack) => [...stack, copy(draft)].slice(-30));
    setRedoStack([]);
  };

  const commitDraft = (producer) => {
    if (!draft) return;
    pushHistory();
    setDraft((current) => {
      const next = copy(current);
      producer(next);
      return next;
    });
    setStatus('Cambios de presentación sin guardar');
  };

  const commitBlocks = (nextBlocks) => commitDraft((next) => {
    next.blocks = nextBlocks.map((block, index) => ({ ...block, order: (index + 1) * 10 }));
  });

  const replaceBlock = (nextBlock) => commitDraft((next) => {
    next.blocks = next.blocks.map((block) => block.id === nextBlock.id ? nextBlock : block);
  });

  const moveBlock = (blockId, direction) => {
    const list = [...blocks];
    const index = list.findIndex((block) => block.id === blockId);
    if (index < 0) return;
    commitBlocks(reorder(list, index, direction));
  };

  const moveBlockTo = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const list = [...blocks];
    const sourceIndex = list.findIndex((block) => block.id === sourceId);
    const targetIndex = list.findIndex((block) => block.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [item] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, item);
    commitBlocks(list);
  };

  const undo = () => {
    if (!undoStack.length || !draft) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((stack) => [...stack, copy(draft)].slice(-30));
    setUndoStack((stack) => stack.slice(0, -1));
    setDraft(previous);
    setStatus('Cambio deshecho · sin guardar');
  };

  const redo = () => {
    if (!redoStack.length || !draft) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((stack) => [...stack, copy(draft)].slice(-30));
    setRedoStack((stack) => stack.slice(0, -1));
    setDraft(next);
    setStatus('Cambio rehecho · sin guardar');
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setStatus('Guardando presentación...');
    try {
      await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft });
      await load();
    } catch (error) {
      setStatus(error.message || 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    if (!window.confirm('Publicar los cambios de presentación en la Landing pública de Gallo Autos?')) return;
    setBusy(true);
    setStatus('Guardando y publicando presentación...');
    try {
      await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft });
      await landingRepository.publish({ businessSlug: 'gallo', pageSlug: 'home' });
      await load();
      setStatus('Presentación Gallo publicada correctamente.');
    } catch (error) {
      setStatus(error.message || 'No se pudo publicar.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (version) => {
    if (!window.confirm(`Restaurar la versión de presentación v${version} como nuevo draft? Ajustes y Servicios no cambian.`)) return;
    setBusy(true);
    try {
      await landingRepository.restore({ businessSlug: 'gallo', pageSlug: 'home', version });
      await load();
      setStatus(`Presentación v${version} restaurada al draft.`);
    } catch (error) {
      setStatus(error.message || 'No se pudo restaurar la versión.');
    } finally {
      setBusy(false);
    }
  };

  const addScene = (template) => {
    const id = `gallo-${template.variant.replace(/^gallo_|_scene$/g, '').replace(/_/g, '-')}-${Date.now()}`;
    const block = { ...copy(template.block), id, enabled: true, order: (blocks.length + 1) * 10 };
    commitBlocks([...blocks, block]);
    setActiveBlockId(id);
  };

  if (!draft || !source) {
    return <div className="grid min-h-full place-items-center bg-[#f4f6fb] p-6 text-center text-sm font-bold text-slate-600">{status}</div>;
  }

  return (
    <main className="flex h-full min-h-[720px] flex-col overflow-hidden bg-[#f4f6fb] text-[#080b19]">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Landing Builder Gallo Autos</h1>
              <span className="rounded-lg border border-[#1741ff]/20 bg-[#1741ff]/5 px-2.5 py-1 text-[10px] font-black text-[#1741ff]">V2 · authority-aware</span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${isDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{isDirty ? 'Cambios sin guardar' : 'Todos los cambios guardados'}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">LandingPage controla presentación · BusinessProfile y CatalogOffering conservan sus datos maestros.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[{ id: 'general', label: 'Datos Generales' }, { id: 'stats', label: 'Estadísticas' }, { id: 'site', label: 'Sitio Web' }].map((panel) => (
                <button key={panel.id} type="button" onClick={() => setActivePanel(panel.id)} className={`rounded-md px-3 py-2 text-xs font-black ${activePanel === panel.id ? 'bg-white text-[#1741ff] shadow-sm' : 'text-slate-500'}`}>{panel.label}</button>
              ))}
            </div>
            <SmallButton disabled={!undoStack.length} onClick={undo}><Undo2 className="h-3.5 w-3.5" />Deshacer</SmallButton>
            <SmallButton disabled={!redoStack.length} onClick={redo}><Redo2 className="h-3.5 w-3.5" />Rehacer</SmallButton>
            <button type="button" disabled={busy || !isDirty} onClick={save} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-40"><Save className="h-4 w-4" />Guardar cambios</button>
            <button type="button" disabled={busy} onClick={publish} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ffd400] px-4 text-sm font-black text-[#05070f] disabled:opacity-40"><Send className="h-4 w-4" />Publicar</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-bold text-slate-500">{status}</div>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {Object.entries(VIEWPORTS).map(([key, config]) => {
              const Icon = config.icon;
              return <button key={key} type="button" onClick={() => setViewport(key)} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-black ${viewport === key ? 'bg-white text-[#1741ff] shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{config.label}</button>;
            })}
          </div>
        </div>
      </header>

      {activePanel === 'general' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mx-auto max-w-5xl"><GeneralPanel payload={previewPayload} versions={source?.versions || []} onRestore={restore} /></div></div>
      ) : activePanel === 'stats' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mx-auto max-w-3xl"><StatsPanel hero={hero} onChange={(stats) => replaceBlock({ ...hero, data: { ...(hero.data || {}), stats } })} /></div></div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(380px,460px)_minmax(0,1fr)] overflow-hidden">
          <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div><div className="text-sm font-black text-slate-900">Secciones</div><div className="text-xs font-semibold text-slate-400">{blocks.length} secciones</div></div>
              <details className="relative">
                <summary className="list-none cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-[#1741ff]"><span className="inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" />Agregar</span></summary>
                <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {SCENE_TEMPLATES.map((template) => <button key={template.variant} type="button" onClick={() => addScene(template)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50">{SCENE_META[template.variant]?.label || template.variant}</button>)}
                </div>
              </details>
            </div>
            <div className="space-y-2">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => setDraggedId(block.id)}
                  onDragEnd={() => setDraggedId('')}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { moveBlockTo(draggedId, block.id); setDraggedId(''); }}
                  className={`rounded-xl border p-2 transition ${activeBlock?.id === block.id ? 'border-[#1741ff]/45 bg-[#1741ff]/5' : 'border-slate-200 bg-white hover:border-slate-300'} ${draggedId === block.id ? 'opacity-45' : ''}`}
                >
                  <button type="button" onClick={() => setActiveBlockId(block.id)} className="flex w-full items-center gap-2 text-left">
                    <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-slate-800">{labelFor(block)}</div><div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">#{String(index + 1).padStart(2, '0')}</div></div>
                  </button>
                  <div className="mt-2 flex gap-1 pl-6">
                    <SmallButton disabled={index === 0} onClick={() => moveBlock(block.id, -1)}><ArrowUp className="h-3 w-3" /></SmallButton>
                    <SmallButton disabled={index === blocks.length - 1} onClick={() => moveBlock(block.id, 1)}><ArrowDown className="h-3 w-3" /></SmallButton>
                    <SmallButton onClick={() => replaceBlock({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</SmallButton>
                    <SmallButton danger onClick={() => commitBlocks(blocks.filter((item) => item.id !== block.id))}><Trash2 className="h-3 w-3" /></SmallButton>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/5 p-3 text-xs font-semibold leading-5 text-slate-600">Ordenar, ocultar, media, copy y tema sí modifican el draft de presentación. Los maestros de Ajustes y Servicios no se copian al draft.</div>
          </aside>

          <section className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1741ff]">Editando presentación</div>
              <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-900">{labelFor(activeBlock)}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Los cambios de Landing aparecen inmediatamente en el Canvas vivo; las autoridades se muestran en solo lectura.</p>
            </div>
            <SceneEditor block={activeBlock} onChange={replaceBlock} authority={previewPayload} />
            <div className="mt-6 border-t border-slate-100 pt-5"><ThemePanel theme={draft.theme} onChange={(theme) => commitDraft((next) => { next.theme = theme; })} /></div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
              <div className="text-sm font-black">Canvas vivo · {VIEWPORTS[viewport].label} {VIEWPORTS[viewport].width} × {VIEWPORTS[viewport].height}</div>
              <div className="text-xs font-semibold text-slate-500">Landing draft + BusinessProfile + CatalogOffering → preview</div>
            </div>
            <PreviewCanvas payload={previewPayload} viewport={viewport} />
          </section>
        </div>
      )}
    </main>
  );
}
