'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Monitor,
  Plus,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
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

const sceneLabelByVariant = {
  gallo_workshop_hero: 'Inicio / Hero',
  gallo_partners_scene: 'Confianza · Marcas + Aseguradoras',
  gallo_services_scene: 'Servicios',
  gallo_diagnostic_scene: 'Diagnóstico',
  gallo_process_scene: 'Proceso',
  gallo_experience_scene: 'Nosotros / +25 años',
  gallo_evidence_scene: 'Evidencia',
  gallo_contact_scene: 'Contacto / Solicitar cita',
};

const copy = (value) => JSON.parse(JSON.stringify(value));
const sorted = (blocks = []) => [...blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
const variantFor = (block) => block?.layout?.variant || block?.data?.variant || '';
const labelFor = (block) => sceneLabelByVariant[variantFor(block)] || block?.data?.title || block?.id || 'Sección';

function InputField({ label, value = '', onChange, placeholder = '' }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1741ff] focus:ring-2 focus:ring-[#1741ff]/10"
      />
    </label>
  );
}

function TextAreaField({ label, value = '', onChange, rows = 3 }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <textarea
        value={value ?? ''}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium leading-6 text-slate-900 outline-none transition focus:border-[#1741ff] focus:ring-2 focus:ring-[#1741ff]/10"
      />
    </label>
  );
}

function SelectField({ label, value = '', onChange, options }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1741ff]"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function TinyButton({ children, onClick, disabled = false, danger = false, title }) {
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

function StringListEditor({ title, items = [], onChange, addLabel = 'Agregar' }) {
  const values = Array.isArray(items) ? items.map((item) => typeof item === 'string' ? item : item?.name || '') : [];
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{title}</div>
        <TinyButton onClick={() => onChange([...values, addLabel])}><Plus className="h-3.5 w-3.5" /> Agregar</TinyButton>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
            <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
            <input
              value={item}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm font-bold text-slate-800 outline-none"
            />
            <TinyButton title="Subir" disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3.5 w-3.5" /></TinyButton>
            <TinyButton title="Bajar" disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3.5 w-3.5" /></TinyButton>
            <TinyButton danger title="Eliminar" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" /></TinyButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectListEditor({ title, items = [], fields, onChange, createItem }) {
  const values = Array.isArray(items) ? items : [];
  const updateItem = (index, key, value) => {
    const next = copy(values);
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{title}</div>
        <TinyButton onClick={() => onChange([...values, createItem()])}><Plus className="h-3.5 w-3.5" /> Agregar</TinyButton>
      </div>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={`${item?.title || item?.number || title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Elemento {index + 1}</span>
              <div className="flex gap-1">
                <TinyButton disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3.5 w-3.5" /></TinyButton>
                <TinyButton disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3.5 w-3.5" /></TinyButton>
                <TinyButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" /></TinyButton>
              </div>
            </div>
            <div className="grid gap-3">
              {fields.map((field) => field.multiline ? (
                <TextAreaField key={field.key} label={field.label} value={item?.[field.key] || ''} rows={2} onChange={(value) => updateItem(index, field.key, value)} />
              ) : (
                <InputField key={field.key} label={field.label} value={item?.[field.key] || ''} onChange={(value) => updateItem(index, field.key, value)} />
              ))}
            </div>
          </div>
        ))}
      </div>
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(value || '');

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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      {value ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          {isVideo ? <video src={value} className="h-32 w-full object-cover" controls muted /> : <img src={value} alt="" className="h-32 w-full object-cover" />}
        </div>
      ) : (
        <div className="mb-3 grid h-24 place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400"><ImagePlus className="h-6 w-6" /></div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <TinyButton onClick={() => inputRef.current?.click()}><UploadCloud className="h-3.5 w-3.5" /> {uploading ? 'Subiendo...' : value ? 'Reemplazar' : 'Subir media'}</TinyButton>
        {value ? <TinyButton danger onClick={() => onChange('')}><Trash2 className="h-3.5 w-3.5" /> Quitar</TinyButton> : null}
      </div>
      {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
    </div>
  );
}

function LayoutEditor({ block, onChange }) {
  const layout = block.layout || {};
  return (
    <div className="grid gap-3 rounded-2xl border border-[#1741ff]/15 bg-[#1741ff]/[0.035] p-3 sm:grid-cols-3">
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

function HeroEditor({ block, updateData }) {
  const data = block.data || {};
  const stats = Array.isArray(data.stats) ? data.stats : [];
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta superior" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título principal" value={data.title} rows={4} onChange={(title) => updateData({ title })} />
      <InputField label="Frase de confianza" value={data.titleHighlight} onChange={(titleHighlight) => updateData({ titleHighlight })} />
      <TextAreaField label="Descripción" value={data.subtitle} onChange={(subtitle) => updateData({ subtitle })} />
      <InputField label="Texto de soporte" value={data.supportingText} onChange={(supportingText) => updateData({ supportingText })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="CTA principal" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} />
        <InputField label="CTA secundario" value={data.secondaryCta} onChange={(secondaryCta) => updateData({ secondaryCta })} />
      </div>
      <MediaField label="Imagen o video del Hero" value={data.heroMediaUrl || ''} onChange={(heroMediaUrl) => updateData({ heroMediaUrl })} />
      <ObjectListEditor
        title="Datos destacados"
        items={stats}
        onChange={(next) => updateData({ stats: next })}
        fields={[{ key: 'value', label: 'Valor' }, { key: 'label', label: 'Etiqueta' }]}
        createItem={() => ({ value: '+25', label: 'Dato' })}
      />
    </div>
  );
}

function PartnersEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta superior" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Descripción" value={data.subtitle} onChange={(subtitle) => updateData({ subtitle })} />
      <StringListEditor title="Marcas de vehículos" items={data.brands || []} addLabel="Nueva marca" onChange={(brands) => updateData({ brands })} />
      <StringListEditor title="Aseguradoras" items={data.insurers || []} addLabel="Nueva aseguradora" onChange={(insurers) => updateData({ insurers })} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
        Los logos visuales se resuelven por identidad de marca en esta iteración. El listado, orden y visibilidad editorial viven aquí; los assets locales curados serán el siguiente endurecimiento del mismo componente.
      </div>
    </div>
  );
}

function ServicesEditor({ block, updateData }) {
  const data = block.data || {};
  const groups = Array.isArray(data.serviceGroups) ? data.serviceGroups : [];
  const updateGroupMedia = (index, imageUrl) => {
    const next = copy(groups);
    next[index] = { ...next[index], imageUrl };
    updateData({ serviceGroups: next });
  };
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Descripción" value={data.subtitle} onChange={(subtitle) => updateData({ subtitle })} />
      <ObjectListEditor
        title="Familias de servicio"
        items={groups}
        onChange={(serviceGroups) => updateData({ serviceGroups })}
        fields={[{ key: 'title', label: 'Nombre' }, { key: 'description', label: 'Descripción', multiline: true }]}
        createItem={() => ({ title: 'Nueva familia', description: 'Describe el servicio.', imageUrl: '' })}
      />
      {groups.map((group, index) => <MediaField key={`${group.title}-${index}`} label={`Media · ${group.title || `Servicio ${index + 1}`}`} value={group.imageUrl || ''} onChange={(url) => updateGroupMedia(index, url)} />)}
    </div>
  );
}

function DiagnosticEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Descripción" value={data.subtitle} onChange={(subtitle) => updateData({ subtitle })} />
      <MediaField label="Media de diagnóstico" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
      <StringListEditor title="Secuencia corta" items={data.steps || []} addLabel="Nuevo paso" onChange={(steps) => updateData({ steps })} />
    </div>
  );
}

function ProcessEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <ObjectListEditor
        title="Pasos del proceso"
        items={data.steps || []}
        onChange={(steps) => updateData({ steps: steps.map((step, index) => ({ ...step, number: String(index + 1).padStart(2, '0') })) })}
        fields={[{ key: 'title', label: 'Paso' }, { key: 'body', label: 'Explicación', multiline: true }]}
        createItem={() => ({ number: '00', title: 'Nuevo paso', body: 'Explica qué ocurre aquí.' })}
      />
    </div>
  );
}

function AboutEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Historia / cuerpo" value={data.body} rows={4} onChange={(body) => updateData({ body })} />
      <MediaField label="Imagen de nosotros" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
      <ObjectListEditor
        title="Pilares de confianza"
        items={data.features || []}
        onChange={(features) => updateData({ features })}
        fields={[{ key: 'title', label: 'Título' }, { key: 'body', label: 'Descripción', multiline: true }]}
        createItem={() => ({ title: 'Nuevo pilar', body: 'Describe por qué importa.' })}
      />
    </div>
  );
}

function EvidenceEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Descripción" value={data.subtitle} rows={4} onChange={(subtitle) => updateData({ subtitle })} />
      <MediaField label="Imagen de evidencia" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} />
      <div className="rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/5 px-3 py-2 text-xs font-semibold leading-5 text-slate-700">La presentación es editable; la evidencia de cliente debe seguir siendo real y verificable.</div>
    </div>
  );
}

function ContactEditor({ block, updateData }) {
  const data = block.data || {};
  return (
    <div className="grid gap-4">
      <InputField label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} />
      <TextAreaField label="Título" value={data.title} rows={3} onChange={(title) => updateData({ title })} />
      <TextAreaField label="Descripción" value={data.subtitle} onChange={(subtitle) => updateData({ subtitle })} />
      <InputField label="Dirección visible" value={data.address} onChange={(address) => updateData({ address })} />
      <StringListEditor title="Horarios" items={data.hours || []} addLabel="Nuevo horario" onChange={(hours) => updateData({ hours })} />
      <TextAreaField label="Nota operativa" value={data.note} onChange={(note) => updateData({ note })} />
    </div>
  );
}

function SceneEditor({ block, onBlockChange }) {
  if (!block) return <div className="p-6 text-sm font-semibold text-slate-500">Selecciona una escena.</div>;
  const variant = variantFor(block);
  const updateData = (patch) => onBlockChange({ ...block, data: { ...(block.data || {}), ...patch } });
  const updateLayout = (layout) => onBlockChange({ ...block, layout });

  let editor = <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Este bloque todavía usa edición genérica.</div>;
  if (variant === 'gallo_workshop_hero') editor = <HeroEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_partners_scene') editor = <PartnersEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_services_scene') editor = <ServicesEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_diagnostic_scene') editor = <DiagnosticEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_process_scene') editor = <ProcessEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_experience_scene') editor = <AboutEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_evidence_scene') editor = <EvidenceEditor block={block} updateData={updateData} />;
  if (variant === 'gallo_contact_scene') editor = <ContactEditor block={block} updateData={updateData} />;

  return (
    <div className="grid gap-4">
      <LayoutEditor block={block} onChange={updateLayout} />
      {editor}
    </div>
  );
}

function PreviewCanvas({ payload, viewport }) {
  const iframeRef = useRef(null);
  const activeViewport = VIEWPORTS[viewport] || VIEWPORTS.desktop;
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin);
  }, [payload, viewport]);
  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#e9edf8] p-5">
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl" style={{ width: activeViewport.width, minWidth: activeViewport.width, height: activeViewport.height }}>
        <iframe
          ref={iframeRef}
          title="Preview Gallo Autos"
          src={`/admin/landing/preview?viewport=${viewport}`}
          width={activeViewport.width}
          height={activeViewport.height}
          className="block border-0"
          onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin)}
        />
      </div>
    </div>
  );
}

export function GalloLandingBuilderPage() {
  const [source, setSource] = useState(null);
  const [draft, setDraft] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState('');
  const [viewport, setViewport] = useState('desktop');
  const [status, setStatus] = useState('Cargando landing...');
  const [busy, setBusy] = useState(false);
  const [draggedId, setDraggedId] = useState('');

  const load = async () => {
    setStatus('Cargando landing...');
    try {
      const data = await landingRepository.getAdminLandingPage({ businessSlug: 'gallo', pageSlug: 'home' });
      const content = cloneLandingContent(data?.landingPage?.draft || data?.landingPage?.published || data?.content);
      setSource(data);
      setDraft(content);
      setActiveBlockId((current) => current || sorted(content?.blocks || [])[0]?.id || '');
      setStatus(`Draft cargado · publicada v${data?.landingPage?.publishedVersion || 0}`);
    } catch (error) {
      setStatus(error.message || 'No se pudo cargar la landing.');
    }
  };

  useEffect(() => { load(); }, []);

  const blocks = useMemo(() => sorted(draft?.blocks || []), [draft]);
  const activeBlock = blocks.find((block) => block.id === activeBlockId) || blocks[0];
  const payload = useMemo(() => draft ? {
    landingPage: { ...(source?.landingPage || {}), businessSlug: 'gallo', pageSlug: 'home', published: draft, draft },
    content: draft,
    businessProfile: source?.businessProfile || { businessSlug: 'gallo', businessName: 'Gallo Autos', brand: { displayName: 'Gallo Autos' } },
    catalogOfferings: source?.catalogOfferings || [],
  } : null, [draft, source]);

  const commitBlocks = (nextBlocks) => setDraft((current) => ({ ...current, blocks: nextBlocks.map((block, index) => ({ ...block, order: (index + 1) * 10 })) }));

  const replaceBlock = (nextBlock) => {
    setDraft((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === nextBlock.id ? nextBlock : block) }));
  };

  const moveBlock = (blockId, direction) => {
    const list = blocks;
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

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setStatus('Guardando draft...');
    try {
      await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft });
      setStatus('Draft guardado en MongoDB.');
      await load();
    } catch (error) {
      setStatus(error.message || 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    if (!window.confirm('Publicar la versión actual de Gallo Autos Workshop?')) return;
    setBusy(true);
    setStatus('Guardando y publicando...');
    try {
      await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft });
      await landingRepository.publish({ businessSlug: 'gallo', pageSlug: 'home' });
      setStatus('Landing publicada correctamente.');
      await load();
    } catch (error) {
      setStatus(error.message || 'No se pudo publicar.');
    } finally {
      setBusy(false);
    }
  };

  if (!draft || !payload) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f6fb] p-6 text-center text-sm font-bold text-slate-600">{status}</div>;
  }

  return (
    <main className="flex h-[100dvh] min-h-[720px] flex-col overflow-hidden bg-[#f4f6fb] text-[#080b19]">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1741ff] text-sm font-black text-white">GA</div>
              <div>
                <h1 className="text-lg font-black tracking-[-0.02em]">Landing Builder · Gallo Autos</h1>
                <p className="text-xs font-semibold text-slate-500">Landing Workshop · edición visual conectada a MongoDB</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{status}</span>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {Object.entries(VIEWPORTS).map(([key, config]) => {
                const Icon = config.icon;
                return <button key={key} type="button" onClick={() => setViewport(key)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black ${viewport === key ? 'bg-white text-[#1741ff] shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{config.label}</button>;
              })}
            </div>
            <button type="button" disabled={busy} onClick={save} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-[#1741ff]/30 hover:text-[#1741ff] disabled:opacity-50"><Save className="h-4 w-4" /> Guardar</button>
            <button type="button" disabled={busy} onClick={publish} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ffd400] px-4 text-sm font-black text-[#05070f] shadow-[0_8px_25px_rgba(255,212,0,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50"><Send className="h-4 w-4" /> Publicar</button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(380px,460px)_minmax(0,1fr)] overflow-hidden">
        <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
          <div className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Escenas · arrastra para ordenar</div>
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
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-slate-800">{labelFor(block)}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">#{String(index + 1).padStart(2, '0')}</div>
                  </div>
                </button>
                <div className="mt-2 flex gap-1 pl-6">
                  <TinyButton disabled={index === 0} onClick={() => moveBlock(block.id, -1)}><ArrowUp className="h-3 w-3" /></TinyButton>
                  <TinyButton disabled={index === blocks.length - 1} onClick={() => moveBlock(block.id, 1)}><ArrowDown className="h-3 w-3" /></TinyButton>
                  <TinyButton onClick={() => replaceBlock({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</TinyButton>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/5 p-3 text-xs font-semibold leading-5 text-slate-600">
            El orden se persiste como <code>block.order</code>. Ocultar una escena no la borra: queda en el draft y puede volver a activarse.
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1741ff]">Editando escena</div>
            <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-900">{labelFor(activeBlock)}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Los cambios aparecen en el canvas sin publicar.</p>
          </div>
          <SceneEditor block={activeBlock} onBlockChange={replaceBlock} />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
            <div className="text-sm font-black">Canvas vivo · {VIEWPORTS[viewport].label}</div>
            <div className="text-xs font-semibold text-slate-500">Draft local → iframe Gallo</div>
          </div>
          <PreviewCanvas payload={payload} viewport={viewport} />
        </section>
      </div>
    </main>
  );
}
