'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Database,
  Eye,
  EyeOff,
  GripVertical,
  Layers3,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Save,
  Send,
  Smartphone,
  Sparkles,
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
import {
  DEFAULT_SERVICE_PRESENTATION,
  DEPTH_PRESETS,
  MOTION_PRESETS,
  SECTION_TEMPLATE_REGISTRY,
  SERVICE_COLUMN_OPTIONS,
  SERVICE_DISPLAY_MODES,
  createSectionFromTemplate,
  normalizeServicePresentation,
} from '@/lib/landing/galloPresentationRegistry';
import {
  REPEATABLE_SECTION_TEMPLATES,
  createRepeatableSection,
  repeatableTemplateByKey,
  sectionInstanceFor,
  withSectionInstance,
} from '@/lib/landing/galloSectionInstances';

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin';
const copy = (value) => JSON.parse(JSON.stringify(value));
const sorted = (blocks = []) => [...blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
const variantFor = (block) => block?.layout?.variant || block?.data?.variant || '';
const isVideo = (value = '') => /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(value);

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: 1440, height: 900, icon: Monitor },
  tablet: { label: 'Tablet', width: 834, height: 1112, icon: Tablet },
  mobile: { label: 'Móvil', width: 390, height: 844, icon: Smartphone },
};

const GALLO_THEME = { primary: '#1741FF', accent: '#FFD400', surface: '#F7F8FC', text: '#080B19' };
const CATALOG_CATEGORIES = [
  { value: 'mecanica_mantenimiento', label: 'Mecánica & mantenimiento' },
  { value: 'diagnostico_seguridad', label: 'Diagnóstico & seguridad' },
  { value: 'carroceria_cuidado', label: 'Carrocería & cuidado' },
];
const SCENE_LABELS = {
  gallo_workshop_hero: 'Inicio / Hero', gallo_partners_scene: 'Confianza · Marcas + Aseguradoras', gallo_services_scene: 'Servicios',
  gallo_diagnostic_scene: 'Diagnóstico', gallo_process_scene: 'Proceso', gallo_experience_scene: 'Nosotros / +25 años',
  gallo_evidence_scene: 'Evidencia', gallo_contact_scene: 'Contacto / Solicitar cita', gallo_repeatable_split: 'Texto + media',
  gallo_repeatable_editorial: 'Editorial', gallo_repeatable_cards: 'Cards / Beneficios', gallo_repeatable_gallery: 'Galería', gallo_repeatable_cta: 'CTA / Banner',
};

function Field({ label, value = '', onChange, textarea = false, rows = 3, placeholder = '' }) {
  const className = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1741ff] focus:ring-2 focus:ring-[#1741ff]/10';
  return <label className="grid gap-1.5"><span className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span>{textarea ? <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${className} resize-y`} /> : <input value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={className} />}</label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label className="grid gap-1.5"><span className="text-[11px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1741ff]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Toggle({ label, checked, onChange, help = '' }) {
  return <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"><span><span className="block text-sm font-black text-slate-800">{label}</span>{help ? <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{help}</span> : null}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-[#1741ff]" /></label>;
}

function SmallButton({ children, onClick, disabled = false, danger = false, title }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:border-[#1741ff]/35 hover:text-[#1741ff]'}`}>{children}</button>;
}

function reorder(items, index, direction) {
  const next = [...items]; const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]]; return next;
}

function AuthorityCard({ title, source, children }) {
  return <div className="rounded-xl border border-[#1741ff]/20 bg-[#1741ff]/[.045] p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#1741ff]"><Database className="h-3.5 w-3.5" />Fuente de autoridad</div><div className="mt-1 text-sm font-black text-slate-900">{title}</div><div className="mt-0.5 text-xs font-semibold text-slate-500">{source}</div><div className="mt-3 text-sm leading-6 text-slate-700">{children}</div><div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-[11px] font-semibold leading-5 text-slate-500">Solo lectura desde Landing Builder.</div></div>;
}

async function uploadLandingAsset(file) {
  const form = new FormData(); form.append('file', file);
  const response = await fetch('/api/v1/admin/landing-assets', { method: 'POST', headers: { 'X-Demo-Test-Admin-Token': ADMIN_TOKEN }, body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error?.message || payload?.message || 'No se pudo subir el archivo.');
  return payload?.data || payload;
}

function MediaField({ label, value = '', onChange }) {
  const inputRef = useRef(null); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  const upload = async (file) => {
    if (!file) return; setUploading(true); setError('');
    try { const asset = await uploadLandingAsset(file); onChange(asset.url); } catch (uploadError) { setError(uploadError.message || 'No se pudo subir.'); } finally { setUploading(false); }
  };
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-[11px] font-black uppercase tracking-[.12em] text-slate-500">{label}</div>{value ? <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">{isVideo(value) ? <video src={value} className="h-28 w-full object-cover" controls muted /> : <img src={value} alt="" className="h-28 w-full object-cover" />}</div> : null}<input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /><div className="flex flex-wrap gap-2"><SmallButton onClick={() => inputRef.current?.click()}><UploadCloud className="h-3.5 w-3.5" />{uploading ? 'Subiendo...' : value ? 'Reemplazar' : 'Subir media'}</SmallButton>{value ? <SmallButton danger onClick={() => onChange('')}><Trash2 className="h-3.5 w-3.5" />Quitar</SmallButton> : null}</div>{error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}</div>;
}

function StringList({ title, items = [], onChange, placeholder = 'Nuevo elemento' }) {
  const values = Array.isArray(items) ? items : [];
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-black">{title}</div><SmallButton onClick={() => onChange([...values, placeholder])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton></div><div className="space-y-2">{values.map((item, index) => <div key={`${title}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"><input value={typeof item === 'string' ? item : ''} onChange={(event) => { const next = [...values]; next[index] = event.target.value; onChange(next); }} className="min-w-0 flex-1 bg-transparent px-1 text-sm font-bold outline-none" /><SmallButton disabled={index === 0} onClick={() => onChange(reorder(values, index, -1))}><ArrowUp className="h-3 w-3" /></SmallButton><SmallButton disabled={index === values.length - 1} onClick={() => onChange(reorder(values, index, 1))}><ArrowDown className="h-3 w-3" /></SmallButton><SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" /></SmallButton></div>)}</div></div>;
}

function CardsEditor({ items = [], onChange }) {
  const values = Array.isArray(items) ? items : [];
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-black">Cards</div><SmallButton onClick={() => onChange([...values, { title: 'Nueva card', body: '' }])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton></div><div className="space-y-3">{values.map((item, index) => <div key={`card-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><div className="grid gap-2"><Field label="Título" value={item.title || ''} onChange={(title) => { const next = copy(values); next[index] = { ...next[index], title }; onChange(next); }} /><Field label="Texto" value={item.body || ''} textarea onChange={(body) => { const next = copy(values); next[index] = { ...next[index], body }; onChange(next); }} /></div><div className="mt-2 flex justify-end"><SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" />Quitar</SmallButton></div></div>)}</div></div>;
}

function GalleryEditor({ items = [], onChange }) {
  const values = Array.isArray(items) ? items : [];
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-black">Galería</div><SmallButton onClick={() => onChange([...values, { mediaUrl: '', caption: 'Nuevo elemento' }])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton></div><div className="space-y-3">{values.map((item, index) => <div key={`gallery-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><MediaField label="Imagen o video" value={item.mediaUrl || ''} onChange={(mediaUrl) => { const next = copy(values); next[index] = { ...next[index], mediaUrl }; onChange(next); }} /><div className="mt-2"><Field label="Caption" value={item.caption || ''} onChange={(caption) => { const next = copy(values); next[index] = { ...next[index], caption }; onChange(next); }} /></div><div className="mt-2 flex justify-end"><SmallButton danger onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" />Quitar</SmallButton></div></div>)}</div></div>;
}

function CatalogGroupEditor({ groups = [], catalogOfferings = [], onChange }) {
  const values = Array.isArray(groups) ? groups : [];
  const update = (index, patch) => { const next = copy(values); next[index] = { ...(next[index] || {}), ...patch }; onChange(next); };
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-black">Grupos visuales</div><div className="text-xs font-semibold text-slate-500">Agrupan CatalogOffering sin copiarlo.</div></div><SmallButton onClick={() => onChange([...values, { title: 'Nuevo grupo', description: '', category: '', imageUrl: '' }])}><Plus className="h-3.5 w-3.5" />Agregar</SmallButton></div><div className="space-y-3">{values.map((group, index) => { const category = inferGalloCatalogCategory(group); const count = catalogOfferings.filter((offering) => offering?.active !== false && offering?.publicVisible !== false && String(offering?.category || '') === category).length; return <div key={`${group.title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><div className="mb-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Grupo {index + 1} · {count} ofertas</div><div className="grid gap-3"><SelectField label="Categoría fuente" value={category} onChange={(value) => update(index, { category: value })} options={[{ value: '', label: 'Sin categoría' }, ...CATALOG_CATEGORIES]} /><Field label="Título visual" value={group.title || ''} onChange={(title) => update(index, { title })} /><Field label="Texto editorial" value={group.description || ''} textarea onChange={(description) => update(index, { description })} /><MediaField label="Media" value={group.imageUrl || ''} onChange={(imageUrl) => update(index, { imageUrl })} /></div></div>; })}</div></div>;
}

function SectionIdentityEditor({ block, index, total, onChange, onMoveTo }) {
  const instance = sectionInstanceFor(block, index);
  const positions = Array.from({ length: total }, (_, itemIndex) => ({ value: String(itemIndex), label: `Posición ${itemIndex + 1}` }));
  const updateInstance = (patch) => onChange(withSectionInstance(block, patch, index));
  return <div className="rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/[.035] p-4"><div className="flex items-center gap-2 text-sm font-black"><Layers3 className="h-4 w-4 text-[#1741ff]" />SectionInstance</div><div className="mt-1 text-xs font-semibold text-slate-500">Identidad estable del componente dentro de esta Landing.</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Etiqueta navegación" value={instance.navLabel} onChange={(navLabel) => updateInstance({ navLabel })} /><Field label="Anchor" value={instance.anchor} onChange={(anchor) => updateInstance({ anchor })} /><SelectField label="Posición" value={String(index)} onChange={(value) => onMoveTo(Number(value))} options={positions} /><SelectField label="Motion" value={instance.motion} onChange={(motion) => updateInstance({ motion })} options={MOTION_PRESETS} /><SelectField label="Depth" value={instance.depth} onChange={(depth) => updateInstance({ depth })} options={DEPTH_PRESETS} /><Toggle label="Mostrar en navegación" checked={instance.showInNavigation} onChange={(showInNavigation) => updateInstance({ showInNavigation })} /></div><div className="mt-3 text-[11px] font-semibold text-slate-500">templateKey: <strong>{instance.templateKey}</strong> · family: <strong>{instance.semanticFamily}</strong> · repeatable: <strong>{instance.repeatable ? 'sí' : 'no'}</strong></div></div>;
}

function ServiceEditor({ block, catalogOfferings, onChange, onApplyPreset }) {
  const data = block.data || {}; const presentation = normalizeServicePresentation(data.presentation || DEFAULT_SERVICE_PRESENTATION);
  const updatePresentation = (patch) => onChange({ ...block, data: { ...data, presentation: normalizeServicePresentation({ ...presentation, ...patch }) } });
  return <><AuthorityCard title="Catálogo de Servicios" source="Servicios / CatalogOffering"><strong>{catalogOfferings.length} ofertas recibidas</strong><div>La lista maestra no se edita aquí.</div></AuthorityCard><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => onChange({ ...block, data: { ...data, eyebrow } })} /><Field label="Título" value={data.title} textarea onChange={(title) => onChange({ ...block, data: { ...data, title } })} /><Field label="Descripción editorial" value={data.subtitle} textarea onChange={(subtitle) => onChange({ ...block, data: { ...data, subtitle } })} /><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 sm:grid-cols-2"><SelectField label="Display" value={presentation.displayMode} onChange={(displayMode) => updatePresentation({ displayMode })} options={SERVICE_DISPLAY_MODES} /><SelectField label="Columnas desktop" value={String(presentation.columns)} onChange={(columns) => updatePresentation({ columns: Number(columns) })} options={SERVICE_COLUMN_OPTIONS} /><SelectField label="Motion interno" value={presentation.motion} onChange={(motion) => updatePresentation({ motion })} options={MOTION_PRESETS} /><SelectField label="Depth interno" value={presentation.depth} onChange={(depth) => updatePresentation({ depth })} options={DEPTH_PRESETS} /></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Toggle label="Mostrar imagen" checked={presentation.showImage} onChange={(showImage) => updatePresentation({ showImage })} /><Toggle label="Mostrar descripción" checked={presentation.showDescription} onChange={(showDescription) => updatePresentation({ showDescription })} /><Toggle label="Mostrar precio" checked={presentation.showPrice} onChange={(showPrice) => updatePresentation({ showPrice })} help="Solo si existe precio real." /><Toggle label="Mostrar duración" checked={presentation.showDuration} onChange={(showDuration) => updatePresentation({ showDuration })} help="Solo si existe duración real." /></div><div className="mt-3 flex flex-wrap gap-2">{SECTION_TEMPLATE_REGISTRY.filter((template) => template.variant === 'gallo_services_scene').map((template) => <button key={template.key} type="button" onClick={() => onApplyPreset(template)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#1741ff]">{template.label}</button>)}</div></div><CatalogGroupEditor groups={data.serviceGroups || []} catalogOfferings={catalogOfferings} onChange={(serviceGroups) => onChange({ ...block, data: { ...data, serviceGroups } })} /></>;
}

function SectionEditor({ block, index, total, authority, onChange, onMoveTo, onApplyServicePreset }) {
  if (!block) return <div className="p-6 text-sm font-semibold text-slate-500">Selecciona una sección.</div>;
  const data = block.data || {}; const variant = variantFor(block); const business = projectGalloBusinessProfile(authority?.businessProfile || {}); const catalogOfferings = Array.isArray(authority?.catalogOfferings) ? authority.catalogOfferings : [];
  const updateData = (patch) => onChange({ ...block, data: { ...data, ...patch } });
  const updateLayout = (patch) => onChange({ ...block, layout: { ...(block.layout || {}), ...patch } });
  return <div className="grid gap-4"><SectionIdentityEditor block={block} index={index} total={total} onChange={onChange} onMoveTo={onMoveTo} /><div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4"><SelectField label="Alineación" value={block.layout?.align || 'left'} onChange={(align) => updateLayout({ align })} options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]} /><SelectField label="Media" value={block.layout?.media || 'background'} onChange={(media) => updateLayout({ media })} options={[{ value: 'background', label: 'Fondo' }, { value: 'side', label: 'Lateral' }, { value: 'none', label: 'Sin media' }]} /><SelectField label="Densidad" value={block.layout?.density || 'comfortable'} onChange={(density) => updateLayout({ density })} options={[{ value: 'comfortable', label: 'Cómoda' }, { value: 'compact', label: 'Compacta' }]} /><SelectField label="Altura" value={block.frameHeight || 'viewport'} onChange={(frameHeight) => onChange({ ...block, frameHeight })} options={[{ value: 'viewport', label: 'Pantalla completa' }, { value: 'content', label: 'Contenido' }, { value: 'compact', label: 'Compacta' }]} /></div>

  {variant === 'gallo_workshop_hero' ? <><AuthorityCard title="Identidad pública de Gallo" source="Ajustes / BusinessProfile"><strong>{business.displayName}</strong><div>{business.tagline || 'Tagline por configurar'}</div></AuthorityCard><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea rows={4} onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><Field label="Texto soporte" value={data.supportingText} onChange={(supportingText) => updateData({ supportingText })} /><div className="grid gap-3 sm:grid-cols-2"><Field label="CTA principal" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} /><Field label="CTA secundario" value={data.secondaryCta} onChange={(secondaryCta) => updateData({ secondaryCta })} /></div><MediaField label="Hero media" value={data.heroMediaUrl || ''} onChange={(heroMediaUrl) => updateData({ heroMediaUrl })} /></> : null}
  {variant === 'gallo_partners_scene' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><StringList title="Marcas" items={data.brands || []} onChange={(brands) => updateData({ brands })} placeholder="Nueva marca" /><StringList title="Aseguradoras" items={data.insurers || []} onChange={(insurers) => updateData({ insurers })} placeholder="Nueva aseguradora" /></> : null}
  {variant === 'gallo_services_scene' ? <ServiceEditor block={block} catalogOfferings={catalogOfferings} onChange={onChange} onApplyPreset={onApplyServicePreset} /> : null}
  {variant === 'gallo_diagnostic_scene' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><MediaField label="Media" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} /><StringList title="Pasos" items={data.steps || []} onChange={(steps) => updateData({ steps })} placeholder="Nuevo paso" /></> : null}
  {variant === 'gallo_process_scene' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><CardsEditor items={(data.steps || []).map((item) => ({ title: item.title || '', body: item.body || '', number: item.number }))} onChange={(items) => updateData({ steps: items.map((item, itemIndex) => ({ number: item.number || String(itemIndex + 1).padStart(2, '0'), title: item.title, body: item.body })) })} /></> : null}
  {variant === 'gallo_experience_scene' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Historia" value={data.body} textarea rows={5} onChange={(body) => updateData({ body })} /><MediaField label="Media" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} /><CardsEditor items={data.features || []} onChange={(features) => updateData({ features })} /></> : null}
  {variant === 'gallo_evidence_scene' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><MediaField label="Media" value={data.imageUrl || ''} onChange={(imageUrl) => updateData({ imageUrl })} /></> : null}
  {variant === 'gallo_contact_scene' ? <><AuthorityCard title="Contacto, ubicación y horarios" source="Ajustes / BusinessProfile"><div>{formatGalloAddress(business.primaryLocation) || 'Ubicación por configurar'}</div>{galloHoursLines(business.commercialHours).map((line) => <div key={line}>{line}</div>)}</AuthorityCard><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><Field label="CTA" value={data.primaryCta} onChange={(primaryCta) => updateData({ primaryCta })} /><Field label="Nota" value={data.note} textarea onChange={(note) => updateData({ note })} /></> : null}

  {variant === 'gallo_repeatable_split' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Texto" value={data.body} textarea rows={6} onChange={(body) => updateData({ body })} /><MediaField label="Imagen o video" value={data.mediaUrl || ''} onChange={(mediaUrl) => updateData({ mediaUrl })} /><div className="grid gap-3 sm:grid-cols-2"><Field label="CTA label" value={data.ctaLabel || ''} onChange={(ctaLabel) => updateData({ ctaLabel })} /><Field label="CTA target anchor" value={data.ctaTarget || ''} onChange={(ctaTarget) => updateData({ ctaTarget })} /></div></> : null}
  {variant === 'gallo_repeatable_editorial' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Texto" value={data.body} textarea rows={8} onChange={(body) => updateData({ body })} /><Field label="Frase destacada" value={data.quote || ''} textarea onChange={(quote) => updateData({ quote })} /></> : null}
  {variant === 'gallo_repeatable_cards' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><CardsEditor items={data.cards || []} onChange={(cards) => updateData({ cards })} /></> : null}
  {variant === 'gallo_repeatable_gallery' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><GalleryEditor items={data.items || []} onChange={(items) => updateData({ items })} /></> : null}
  {variant === 'gallo_repeatable_cta' ? <><Field label="Etiqueta" value={data.eyebrow} onChange={(eyebrow) => updateData({ eyebrow })} /><Field label="Título" value={data.title} textarea onChange={(title) => updateData({ title })} /><Field label="Descripción" value={data.subtitle} textarea onChange={(subtitle) => updateData({ subtitle })} /><div className="grid gap-3 sm:grid-cols-2"><Field label="CTA label" value={data.ctaLabel || ''} onChange={(ctaLabel) => updateData({ ctaLabel })} /><Field label="CTA target anchor" value={data.ctaTarget || ''} onChange={(ctaTarget) => updateData({ ctaTarget })} /></div><MediaField label="Fondo" value={data.backgroundUrl || ''} onChange={(backgroundUrl) => updateData({ backgroundUrl })} /></> : null}
  </div>;
}

function PreviewCanvas({ payload, viewport }) {
  const iframeRef = useRef(null); const config = VIEWPORTS[viewport] || VIEWPORTS.desktop;
  useEffect(() => { iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin); }, [payload, viewport]);
  return <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#e9edf8] p-5"><div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl" style={{ width: config.width, minWidth: config.width, height: config.height }}><iframe ref={iframeRef} title="Canvas vivo Gallo Autos" src={`/admin/landing/preview?viewport=${viewport}`} width={config.width} height={config.height} className="block border-0" onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin)} /></div></div>;
}

function TemplateLibrary({ blocks, onAddSingleton, onAddRepeatable, onApplyServicePreset }) {
  const variantsInUse = new Set(blocks.map(variantFor));
  const allTemplates = [...SECTION_TEMPLATE_REGISTRY, ...REPEATABLE_SECTION_TEMPLATES];
  return <div className="mx-auto grid max-w-6xl gap-4 p-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xl font-black"><Sparkles className="h-5 w-5 text-[#1741ff]" />Biblioteca de componentes</div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Las escenas maestras siguen siendo singleton. Las plantillas repeatable pueden agregarse cuantas veces quieras; cada instancia recibe ID y anchor propios.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{allTemplates.map((template) => { const repeatable = template.repeatable === true; const inUse = !repeatable && variantsInUse.has(template.variant); const servicePreset = template.variant === 'gallo_services_scene' && inUse; return <article key={template.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.12em] text-[#1741ff]">{template.family}</div><h3 className="mt-1 text-lg font-black">{template.label}</h3></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${repeatable ? 'bg-violet-100 text-violet-700' : inUse ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{repeatable ? 'Repeatable' : inUse ? 'En uso' : 'Singleton'}</span></div><p className="mt-3 text-sm leading-6 text-slate-500">{template.description}</p><div className="mt-4">{servicePreset ? <button type="button" onClick={() => onApplyServicePreset(template)} className="rounded-lg bg-[#1741ff] px-3 py-2 text-xs font-black text-white">Aplicar preset</button> : repeatable ? <button type="button" onClick={() => onAddRepeatable(template)} className="rounded-lg bg-[#1741ff] px-3 py-2 text-xs font-black text-white">Agregar componente</button> : <button type="button" disabled={inUse} onClick={() => onAddSingleton(template)} className="rounded-lg bg-[#1741ff] px-3 py-2 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500">{inUse ? 'Ya existe' : 'Agregar sección'}</button>}</div></article>; })}</div></div>;
}

function GeneralPanel({ source, draft, onTheme, onRestore }) {
  const business = projectGalloBusinessProfile(source?.businessProfile || {}); const theme = { ...GALLO_THEME, ...(draft?.theme || {}) };
  return <div className="mx-auto grid max-w-5xl gap-4 p-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">Datos Generales · Gallo Autos</h2><p className="mt-2 text-sm text-slate-500">Identidad y contacto vienen de BusinessProfile.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-black text-slate-400">NEGOCIO</div><div className="mt-2 font-black">{business.displayName}</div><div className="text-sm text-slate-500">{business.tagline}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-black text-slate-400">UBICACIÓN</div><div className="mt-2 font-black">{formatGalloAddress(business.primaryLocation) || 'Por configurar'}</div><div className="text-sm text-slate-500">{galloHoursLines(business.commercialHours).join(' · ')}</div></div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-lg font-black"><Palette className="h-5 w-5 text-[#1741ff]" />Apariencia global</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(theme).map(([key, value]) => <label key={key} className="rounded-xl border border-slate-200 p-3"><span className="mb-2 block text-[10px] font-black uppercase text-slate-400">{key}</span><div className="grid grid-cols-[44px_1fr] gap-2"><input type="color" value={value} onChange={(event) => onTheme({ ...theme, [key]: event.target.value })} className="h-10 w-11 rounded-lg border p-1" /><input value={value} onChange={(event) => onTheme({ ...theme, [key]: event.target.value })} className="h-10 rounded-lg border px-3 text-sm font-bold" /></div></label>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="font-black">Versiones</div><div className="mt-3 space-y-2">{(source?.versions || []).slice(0, 8).map((version) => <div key={version._id || version.version} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"><div><div className="text-sm font-black">v{version.version}</div><div className="text-xs text-slate-500">{version.action || 'version'}</div></div><SmallButton onClick={() => onRestore(version.version)}>Restaurar</SmallButton></div>)}</div></div></div>;
}

export function GalloLandingBuilderPageV4() {
  const [source, setSource] = useState(null); const [draft, setDraft] = useState(null); const [activePanel, setActivePanel] = useState('site'); const [activeBlockId, setActiveBlockId] = useState(''); const [viewport, setViewport] = useState('desktop'); const [status, setStatus] = useState('Cargando landing...'); const [busy, setBusy] = useState(false); const [undoStack, setUndoStack] = useState([]); const [redoStack, setRedoStack] = useState([]);

  const load = async () => {
    setStatus('Cargando Landing Gallo...');
    try { const data = await landingRepository.getAdminLandingPage({ businessSlug: 'gallo', pageSlug: 'home' }); const content = cloneLandingContent(data?.landingPage?.draft || data?.landingPage?.published || data?.content); setSource(data); setDraft(content); setActiveBlockId((current) => current || sorted(content?.blocks || [])[0]?.id || ''); setStatus(`Todos los cambios guardados · publicada v${data?.landingPage?.publishedVersion || 0}`); setUndoStack([]); setRedoStack([]); } catch (error) { setStatus(error.message || 'No se pudo cargar Landing Gallo.'); }
  };
  useEffect(() => { load(); }, []);

  const blocks = useMemo(() => sorted(draft?.blocks || []), [draft]);
  const activeIndex = Math.max(0, blocks.findIndex((block) => block.id === activeBlockId));
  const activeBlock = blocks[activeIndex] || blocks[0];
  const isDirty = Boolean(draft && source?.landingPage?.draft && JSON.stringify(draft) !== JSON.stringify(source.landingPage.draft));
  const previewPayload = useMemo(() => draft ? { landingPage: { ...(source?.landingPage || {}), businessSlug: 'gallo', pageSlug: 'home', draft, published: draft }, content: draft, businessProfile: source?.businessProfile || {}, catalogOfferings: source?.catalogOfferings || [] } : null, [draft, source]);

  const commitDraft = (producer) => { if (!draft) return; setUndoStack((stack) => [...stack, copy(draft)].slice(-30)); setRedoStack([]); setDraft((current) => { const next = copy(current); producer(next); return next; }); setStatus('Cambios sin guardar'); };
  const replaceBlock = (nextBlock) => commitDraft((next) => { next.blocks = next.blocks.map((block) => block.id === nextBlock.id ? nextBlock : block); });
  const commitBlocks = (nextBlocks) => commitDraft((next) => { next.blocks = nextBlocks.map((block, index) => ({ ...block, order: (index + 1) * 10 })); });
  const moveBlock = (blockId, direction) => { const index = blocks.findIndex((block) => block.id === blockId); if (index >= 0) commitBlocks(reorder(blocks, index, direction)); };
  const moveBlockTo = (blockId, targetIndex) => { const index = blocks.findIndex((block) => block.id === blockId); if (index < 0 || targetIndex === index) return; const next = [...blocks]; const [item] = next.splice(index, 1); next.splice(Math.max(0, Math.min(next.length, targetIndex)), 0, item); commitBlocks(next); };
  const removeBlock = (block) => { if (!window.confirm(`¿Eliminar la sección “${SCENE_LABELS[variantFor(block)] || block.data?.title || block.id}”?`)) return; commitBlocks(blocks.filter((item) => item.id !== block.id)); setActiveBlockId(blocks.find((item) => item.id !== block.id)?.id || ''); };
  const duplicateBlock = (block, index) => { const instance = sectionInstanceFor(block, index); if (!instance.repeatable) return; const template = repeatableTemplateByKey(instance.templateKey); if (!template) return; const duplicate = createRepeatableSection(template.key, { order: (index + 2) * 10 }); if (!duplicate) return; const nextBlock = { ...copy(block), id: duplicate.id, data: { ...copy(block.data || {}), instance: duplicate.data.instance } }; const next = [...blocks]; next.splice(index + 1, 0, nextBlock); commitBlocks(next); setActiveBlockId(nextBlock.id); };

  const addSingleton = (template) => { const block = createSectionFromTemplate(template.key, { order: (blocks.length + 1) * 10 }); if (!block) return; commitBlocks([...blocks, block]); setActiveBlockId(block.id); setActivePanel('site'); };
  const addRepeatable = (template) => { const block = createRepeatableSection(template.key, { order: (blocks.length + 1) * 10 }); if (!block) return; commitBlocks([...blocks, block]); setActiveBlockId(block.id); setActivePanel('site'); };
  const applyServicePreset = (template) => { const service = blocks.find((block) => variantFor(block) === 'gallo_services_scene'); if (!service) { addSingleton(template); return; } const preset = template.block?.data?.presentation || DEFAULT_SERVICE_PRESENTATION; replaceBlock({ ...service, layout: { ...(service.layout || {}), ...(template.block?.layout || {}), variant: 'gallo_services_scene' }, data: { ...(service.data || {}), presentation: normalizeServicePresentation(preset) } }); setActiveBlockId(service.id); setActivePanel('site'); };

  const undo = () => { if (!undoStack.length || !draft) return; const previous = undoStack[undoStack.length - 1]; setRedoStack((stack) => [...stack, copy(draft)].slice(-30)); setUndoStack((stack) => stack.slice(0, -1)); setDraft(previous); setStatus('Cambio deshecho · sin guardar'); };
  const redo = () => { if (!redoStack.length || !draft) return; const next = redoStack[redoStack.length - 1]; setUndoStack((stack) => [...stack, copy(draft)].slice(-30)); setRedoStack((stack) => stack.slice(0, -1)); setDraft(next); setStatus('Cambio rehecho · sin guardar'); };
  const save = async () => { if (!draft) return; setBusy(true); setStatus('Guardando cambios...'); try { await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft }); await load(); } catch (error) { setStatus(error.message || 'No se pudo guardar.'); } finally { setBusy(false); } };
  const publish = async () => { if (!draft || !window.confirm('¿Publicar los cambios en la Landing pública de Gallo Autos?')) return; setBusy(true); setStatus('Guardando y publicando...'); try { await landingRepository.saveDraft({ businessSlug: 'gallo', pageSlug: 'home', title: 'Gallo Autos Workshop', draft }); await landingRepository.publish({ businessSlug: 'gallo', pageSlug: 'home' }); await load(); setStatus('Landing Gallo publicada correctamente.'); } catch (error) { setStatus(error.message || 'No se pudo publicar.'); } finally { setBusy(false); } };
  const restore = async (version) => { if (!window.confirm(`¿Restaurar v${version} como draft?`)) return; setBusy(true); try { await landingRepository.restore({ businessSlug: 'gallo', pageSlug: 'home', version }); await load(); setStatus(`v${version} restaurada como draft.`); } catch (error) { setStatus(error.message || 'No se pudo restaurar.'); } finally { setBusy(false); } };

  if (!draft || !source) return <div className="grid h-full min-h-[640px] place-items-center bg-[#f4f6fb] text-sm font-bold text-slate-600">{status}</div>;
  const activeInstance = sectionInstanceFor(activeBlock, activeIndex);
  const activeLabel = SCENE_LABELS[variantFor(activeBlock)] || activeInstance.navLabel || activeBlock?.data?.title || activeBlock?.id;

  return <main className="flex h-[100dvh] min-h-[720px] flex-col overflow-hidden bg-[#f4f6fb] text-[#080b19]">
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">Landing Builder Gallo Autos</h1><span className={`rounded-lg px-2.5 py-1 text-xs font-black ${isDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{isDirty ? 'Cambios sin guardar' : 'Todos los cambios guardados'}</span></div><p className="mt-1 text-xs font-semibold text-slate-500">B0.PRESENTATION · SectionInstance composer · una autoridad, muchas expresiones</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">{[{ id: 'general', label: 'Datos Generales' }, { id: 'site', label: 'Sitio Web' }, { id: 'templates', label: 'Plantillas' }].map((panel) => <button key={panel.id} type="button" onClick={() => setActivePanel(panel.id)} className={`rounded-md px-3 py-2 text-xs font-black ${activePanel === panel.id ? 'bg-white text-[#1741ff] shadow-sm' : 'text-slate-500'}`}>{panel.label}</button>)}</div><SmallButton disabled={!undoStack.length} onClick={undo}><Undo2 className="h-3.5 w-3.5" />Deshacer</SmallButton><SmallButton disabled={!redoStack.length} onClick={redo}><Redo2 className="h-3.5 w-3.5" />Rehacer</SmallButton><button type="button" disabled={busy || !isDirty} onClick={save} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black disabled:opacity-40"><Save className="h-4 w-4" />Guardar</button><button type="button" disabled={busy} onClick={publish} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ffd400] px-4 text-sm font-black text-[#05070f] disabled:opacity-40"><Send className="h-4 w-4" />Publicar</button></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className="text-xs font-bold text-slate-500">{status}</div><div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">{Object.entries(VIEWPORTS).map(([key, config]) => { const Icon = config.icon; return <button key={key} type="button" onClick={() => setViewport(key)} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-black ${viewport === key ? 'bg-white text-[#1741ff] shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{config.label}</button>; })}</div></div></header>

    {activePanel === 'general' ? <div className="min-h-0 flex-1 overflow-y-auto"><GeneralPanel source={source} draft={draft} onTheme={(theme) => commitDraft((next) => { next.theme = theme; })} onRestore={restore} /></div> : null}
    {activePanel === 'templates' ? <div className="min-h-0 flex-1 overflow-y-auto"><TemplateLibrary blocks={blocks} onAddSingleton={addSingleton} onAddRepeatable={addRepeatable} onApplyServicePreset={applyServicePreset} /></div> : null}
    {activePanel === 'site' ? <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(410px,500px)_minmax(0,1fr)] overflow-hidden">
      <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-3"><div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-black">Secciones</div><div className="text-xs text-slate-400">{blocks.length} componentes</div></div><button type="button" onClick={() => setActivePanel('templates')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-[#1741ff]"><Plus className="h-3.5 w-3.5" />Agregar</button></div><div className="space-y-2">{blocks.map((block, index) => { const instance = sectionInstanceFor(block, index); const label = SCENE_LABELS[variantFor(block)] || instance.navLabel || block.data?.title || block.id; return <div key={block.id} className={`rounded-xl border p-2 ${activeBlock?.id === block.id ? 'border-[#1741ff]/45 bg-[#1741ff]/5' : 'border-slate-200 bg-white'}`}><button type="button" onClick={() => setActiveBlockId(block.id)} className="flex w-full items-center gap-2 text-left"><GripVertical className="h-4 w-4 text-slate-300" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{label}</div><div className="truncate text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">#{String(index + 1).padStart(2, '0')} · {instance.anchor}</div></div></button><div className="mt-2 flex flex-wrap gap-1 pl-6"><SmallButton disabled={index === 0} onClick={() => moveBlock(block.id, -1)}><ArrowUp className="h-3 w-3" /></SmallButton><SmallButton disabled={index === blocks.length - 1} onClick={() => moveBlock(block.id, 1)}><ArrowDown className="h-3 w-3" /></SmallButton><SmallButton onClick={() => replaceBlock({ ...block, enabled: block.enabled === false })}>{block.enabled === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</SmallButton><SmallButton disabled={!instance.repeatable} onClick={() => duplicateBlock(block, index)} title={instance.repeatable ? 'Duplicar componente' : 'Esta escena es singleton'}><Copy className="h-3 w-3" /></SmallButton><SmallButton danger onClick={() => removeBlock(block)}><Trash2 className="h-3 w-3" /></SmallButton></div></div>; })}</div><div className="mt-4 rounded-xl border border-[#1741ff]/15 bg-[#1741ff]/5 p-3 text-xs font-semibold leading-5 text-slate-600">Arriba/abajo o selector de posición cambian el orden del draft. Componentes repeatable pueden duplicarse; escenas maestras no.</div></aside>
      <section className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-4"><div className="mb-4 border-b border-slate-100 pb-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#1741ff]">Editando componente</div><h2 className="mt-1 text-xl font-black">{activeLabel}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Texto, media, layout, motion y posición → Canvas vivo.</p></div><SectionEditor block={activeBlock} index={activeIndex} total={blocks.length} authority={source} onChange={replaceBlock} onMoveTo={(target) => moveBlockTo(activeBlock.id, target)} onApplyServicePreset={applyServicePreset} /></section>
      <section className="flex min-h-0 flex-col overflow-hidden"><div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4"><div className="text-sm font-black">Canvas vivo · {VIEWPORTS[viewport].label} {VIEWPORTS[viewport].width} × {VIEWPORTS[viewport].height}</div><div className="text-xs font-semibold text-slate-500">Draft Gallo → V7</div></div><PreviewCanvas payload={previewPayload} viewport={viewport} /></section>
    </div> : null}
  </main>;
}
