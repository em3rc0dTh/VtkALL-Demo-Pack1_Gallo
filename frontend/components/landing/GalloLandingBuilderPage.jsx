'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
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
      type: 'structured_content',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_partners_scene', align: 'center' },
      data: { eyebrow: 'Confianza que nos respalda', title: 'Marcas y aseguradoras', subtitle: '', brands: [], insurers: [] },
    },
  },
  {
    variant: 'gallo_services_scene',
    block: {
      type: 'catalog',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_services_scene', align: 'left', density: 'comfortable' },
      data: { eyebrow: 'Workshop', title: 'Servicios', subtitle: '', serviceGroups: [] },
    },
  },
  {
    variant: 'gallo_diagnostic_scene',
    block: {
      type: 'structured_content',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_diagnostic_scene', align: 'left', media: 'side' },
      data: { eyebrow: 'Diagnóstico', title: 'Diagnóstico antes que suposición', subtitle: '', imageUrl: '', steps: [] },
    },
  },
  {
    variant: 'gallo_process_scene',
    block: {
      type: 'structured_content',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_process_scene', align: 'center' },
      data: { eyebrow: 'Así trabaja Gallo', title: 'Proceso', steps: [] },
    },
  },
  {
    variant: 'gallo_experience_scene',
    block: {
      type: 'about',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_experience_scene', align: 'left', media: 'background' },
      data: { eyebrow: 'Gallo Autos', title: 'Más de 25 años de taller.', body: '', imageUrl: '', features: [] },
    },
  },
  {
    variant: 'gallo_evidence_scene',
    block: {
      type: 'testimonials',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_evidence_scene', align: 'left' },
      data: { eyebrow: 'Resultados que hablan', title: 'Evidencia', subtitle: '', imageUrl: '' },
    },
  },
  {
    variant: 'gallo_contact_scene',
    block: {
      type: 'contact',
      frameHeight: 'viewport',
      layout: { variant: 'gallo_contact_scene', align: 'left' },
      data: { eyebrow: 'Tu próximo paso', title: 'Cuéntanos qué está pasando con tu auto.', subtitle: '', primaryCta: 'Contactar a Gallo', address: '', hours: [], note: '' },
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

function LayoutEditor({ block, onChange }) {
  const layout = block.layout || {};
  return (
    <div className="grid gap-3 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/[0.035] p-3 sm:grid-cols-3">
      <SelectField
        label="Alineación"
        value={layout.align || 'left'}
        onChange={(align) => onChange({ ...layout, align })}
        options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]}
      />
      <SelectField
        label="Media"
        value={layout.media || 'background'}
        onChange={(media) => onChange({ ...layout, media })}
        options={[{ value: 'background', label: 'Fondo' }, { value: 'side', label: 'Lateral' }, { value: 'none', label: 'Sin media' }]}
      />
      <SelectField
        label="Densidad"
        value={layout.density || 'comfortable'}
        onChange={(density) => onChange({ ...layout, density })}
        options={[{ value: 'comfortable', label: 'Cómoda' }, { value: 'compact', label: 'Compacta' }]}
      />
    </div>
  );
}

function SceneEditor({ block, onChange }) {
  if (!block) return <div className="p-6 text-sm font-semibold text-slate-500">Selecciona una sección.</div>;
  const data = block.data || {};
  const variant = variantFor(block);
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
        <Field label="Etiqueta superior" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título principal" value={data.title} textarea rows={4} onChange={(title) => updateData({ title })} />
        <Field label="Frase de confianza" value={data.titleHighlight} onChange={(titleHighlight) => updateData({ titleHighlight })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
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
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <StringList title="Marcas de vehículos" items={data.brands || []} placeholder="Nueva marca" onChange={(brands) => updateData({ brands })} />
        <StringList title="Aseguradoras" items={data.insurers || []} placeholder="Nueva aseguradora" onChange={(insurers) => updateData({ insurers })} />
      </div>
    );
  }

  if (variant === 'gallo_services_scene') {
    editor = (
      <div className="grid gap-4">
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <ObjectList
          title="Grupos de servicios"
          items={data.serviceGroups || []}
          onChange={(serviceGroups) => updateData({ serviceGroups })}
          createItem={() => ({ title: 'Nuevo grupo', description: '', imageUrl: '' })}
          fields={[{ key: 'title', label: 'Nombre' }, { key: 'description', label: 'Descripción', textarea: true }, { key: 'imageUrl', label: 'Media', media: true }]}
        />
      </div>
    );
  }

  if (variant === 'gallo_diagnostic_scene') {
    editor = (
      <div className="grid gap-4">
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
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <ObjectList
          title="Pasos del proceso"
          items={data.steps || []}
          onChange={(steps) => updateData({ steps })}
          createItem={() => ({ number: '01', title: 'Nuevo paso', body: '' })}
          fields={[{ key: 'number', label: 'Número' }, { key: 'title', label: 'Título' }, { key: 'body', label: 'Descripción', textarea: true }]}
        />
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
        <ObjectList
          title="Puntos de confianza"
          items={data.features || []}
          onChange={(features) => updateData({ features })}
          createItem={() => ({ title: 'Nuevo punto', body: '' })}
          fields={[{ key: 'title', label: 'Título' }, { key: 'body', label: 'Descripción', textarea: true }]}
        />
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
        <div className="rounded-lg border border-[#1741ff]/15 bg-[#1741ff]/5 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">Solo evidencia real y verificable. El Builder no debe fabricar testimonios ni métricas.</div>
      </div>
    );
  }

  if (variant === 'gallo_contact_scene') {
    editor = (
      <div className="grid gap-4">
        <Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
        <Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} />
        <Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} />
        <Field label="CTA" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} />
        <Field label="Dirección visible" value={data.address} onChange={(address) => updateData({ address })} />
        <StringList title="Horarios" items={data.hours || []} placeholder="Nuevo horario" onChange={(hours) => updateData({ hours })} />
        <Field label="Nota operativa" value={data.note} textarea onChange={(note) => updateData({ note })} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Diseño Gallo · {variant || 'bloque genérico'}</div>
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
        <p className="text-sm leading-6 text-slate-500">Tema editorial de Gallo Autos. Los cambios se aplican al draft y al canvas vivo.</p>
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
  const profile = payload?.businessProfile || {};
  const brand = profile?.brand || profile?.settings?.branding || {};
  const locations = profile?.settings?.locations || profile?.locations || [];
  const hours = profile?.settings?.commercialHours || profile?.commercialHours || {};
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-black text-slate-900">Datos Generales · Gallo Autos</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">La Landing consume identidad pública de Gallo. Los datos maestros de negocio no se duplican dentro del contenido editorial.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Negocio</div><div className="mt-2 font-black text-slate-900">{brand.displayName || profile.businessName || 'Gallo Autos'}</div><div className="mt-1 text-sm text-slate-500">{brand.tagline || 'Diagnóstico. Transparencia. Trabajo bien hecho.'}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Ubicación</div><div className="mt-2 font-black text-slate-900">{locations[0]?.addressLine || 'Av. La Molina 724'}</div><div className="mt-1 text-sm text-slate-500">{hours.summary || hours.weekdays || 'Horario administrado por Gallo'}</div></div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><div><div className="font-black text-slate-900">Versiones</div><div className="text-xs font-semibold text-slate-500">Últimas versiones registradas para Gallo/home</div></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{versions.length}</span></div>
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
    <ObjectList
      title="Estadísticas / datos destacados del Hero"
      items={stats}
      onChange={onChange}
      createItem={() => ({ value: '+25', label: 'Dato' })}
      fields={[{ key: 'value', label: 'Valor' }, { key: 'label', label: 'Etiqueta' }]}
    />
  );
}

export function GalloLandingBuilderPage() {
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
    setStatus('Cargando landing Gallo...');
    try {
      const data = await landingRepository.getAdminLandingPage({ businessSlug: 'gallo', pageSlug: 'home' });
      const content = cloneLandingContent(data?.landingPage?.draft || data?.landingPage?.published || data?.content);
      setSource(data);
      setDraft(content);
      const first = sorted(content?.blocks || [])[0]?.id || '';
      setActiveBlockId((current) => current || first);
      setStatus(`Todos los cambios guardados · publicada v${data?.landingPage?.publishedVersion || 0}`);
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
    setStatus('Cambios sin guardar');
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
    setStatus('Guardando cambios...');
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
    if (!window.confirm('Estás por publicar los cambios en la página pública de Gallo Autos. ¿Quieres publicar ahora?')) return;
    setBusy(true);
    setStatus('Guardando y publicando...');
    try {
      await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft });
      await landingRepository.publish({ businessSlug: 'gallo', pageSlug: 'home' });
      await load();
      setStatus('Página Gallo publicada correctamente.');
    } catch (error) {
      setStatus(error.message || 'No se pudo publicar.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (version) => {
    if (!window.confirm(`Restaurar la versión v${version} como nuevo draft? La página pública no cambia hasta publicar.`)) return;
    setBusy(true);
    try {
      await landingRepository.restore({ businessSlug: 'gallo', pageSlug: 'home', version });
      await load();
      setStatus(`Versión v${version} restaurada al draft.`);
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
    return <div className="grid min-h-screen place-items-center bg-[#f4f6fb] p-6 text-center text-sm font-bold text-slate-600">{status}</div>;
  }

  return (
    <main className="flex h-[100dvh] min-h-[720px] flex-col overflow-hidden bg-[#f4f6fb] text-[#080b19]">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Landing Builder Gallo Autos</h1>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${isDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{isDirty ? 'Cambios sin guardar' : 'Todos los cambios guardados'}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">Draft, publicación y versiones sobre contratos Pack0 · una sola autoridad para Gallo/home</p>
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
            <div className="mt-4 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/5 p-3 text-xs font-semibold leading-5 text-slate-600">Ordenar y ocultar sí modifica el draft Gallo. Nada llega a la página pública hasta <strong>Publicar</strong>.</div>
          </aside>

          <section className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1741ff]">Editando sección</div>
              <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-900">{labelFor(activeBlock)}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Los cambios aparecen inmediatamente en el Canvas vivo.</p>
            </div>
            <SceneEditor block={activeBlock} onChange={replaceBlock} />
            <div className="mt-6 border-t border-slate-100 pt-5"><ThemePanel theme={draft.theme} onChange={(theme) => commitDraft((next) => { next.theme = theme; })} /></div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
              <div className="text-sm font-black">Canvas vivo · {VIEWPORTS[viewport].label} {VIEWPORTS[viewport].width} × {VIEWPORTS[viewport].height}</div>
              <div className="text-xs font-semibold text-slate-500">Gallo draft → preview</div>
            </div>
            <PreviewCanvas payload={previewPayload} viewport={viewport} />
          </section>
        </div>
      )}
    </main>
  );
}
