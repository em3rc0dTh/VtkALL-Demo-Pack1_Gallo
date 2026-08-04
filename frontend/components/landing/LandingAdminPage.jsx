'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
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
  Trash2,
  Undo2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { FieldHint, FieldLabel, Input, Select, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { LANDING_FRAME_HEIGHTS, cloneLandingContent, defaultLandingContent } from '@/lib/landing/landingContract';
import { landingRepository } from '@/lib/landing/landingRepository';
import { resolvePublicAssetUrl } from '@/lib/assets/publicAssetUrl';

const queryKeyFor = (businessSlug, pageSlug) => ['landing-page', 'admin', businessSlug, pageSlug];
const currentTuraguaTheme = {
  primary: '#00AEEF',
  accent: '#111827',
  surface: '#f4f5ff',
  text: '#3f3436',
};

const blockLabels = {
  hero: 'Seccion principal',
  stats: 'Estadisticas del negocio',
  catalog: 'Catalogo de servicios',
  about: 'Sobre nosotros',
  contact: 'Contacto y horarios',
  gallery: 'Explorar servicios',
  agent_call_to_action: 'Iris',
  footer: 'Footer',
  call_to_action: 'Llamado a la accion',
  promotion: 'Promocion',
  structured_content: 'Contenido',
  testimonials: 'Testimonios',
};

const blockDescriptions = {
  hero: 'Titulo, fotos, videos, botones, estadisticas y promociones.',
  catalog: 'Frame publico del catalogo conectado a CatalogOffering.',
  about: 'Historia, experiencia, features y media del taller.',
  contact: 'Datos editoriales de contacto, ubicacion y horarios visibles.',
  gallery: 'Bloque visual para explorar servicios o trabajos.',
  agent_call_to_action: 'Boton compacto conectado con Iris.',
  footer: 'Cierre compacto de la pagina publica.',
};

const addableBlockTypes = ['hero', 'catalog', 'about', 'contact', 'gallery', 'agent_call_to_action', 'footer', 'structured_content'];
const alignments = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
];
const sectionHeightLabels = {
  viewport: 'Pantalla completa',
  compact: 'Compacta',
  content: 'Ajustar al contenido',
};
const promoPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'side-right'];
const promoPositionLabels = {
  'bottom-left': 'Abajo izquierda',
  'bottom-center': 'Abajo centro',
  'bottom-right': 'Abajo derecha',
  'top-left': 'Arriba izquierda',
  'top-right': 'Arriba derecha',
  'side-right': 'Lateral',
};
const defaultStat = { value: '+12', label: 'ANOS DE EXPERIENCIA', visible: true };
const defaultStep = { number: '01', title: 'Elige', description: 'Selecciona un servicio publico del catalogo.', icon: 'sparkles', visible: true };
const PREVIEW_VIEWPORTS = {
  desktop: { label: 'Desktop', width: 1440, height: 900 },
  tablet: { label: 'Tablet', width: 834, height: 1112 },
  mobile: { label: 'Movil', width: 390, height: 844 },
};
const introPushDismissedKey = (businessSlug) => `demo_test_agent_intro_push_dismissed_${businessSlug || 'default'}`;

export function LandingAdminPage({ businessSlug = 'turagua', pageSlug = 'home', embedded = false }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('desktop');
  const [previewZoom, setPreviewZoom] = useState('fit');
  const [activePanel, setActivePanel] = useState('constructor');
  const [activeBlockId, setActiveBlockId] = useState('');
  const [themeOpen, setThemeOpen] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState('');
  const [selectedCanvasElement, setSelectedCanvasElement] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeyFor(businessSlug, pageSlug),
    queryFn: () => landingRepository.getAdminLandingPage({ businessSlug, pageSlug }),
  });
  const [draft, setDraft] = useState(null);

  const landingPage = data?.landingPage;
  const editableDraft = draft || landingPage?.draft || defaultLandingContent;
  const sortedBlocks = useMemo(() => sortBlocks(editableDraft.blocks), [editableDraft.blocks]);
  const heroBlock = sortedBlocks.find((block) => block.type === 'hero');
  const activeBlock = sortedBlocks.find((block) => block.id === activeBlockId) || sortedBlocks[0];
  const isDirty = landingPage?.draft ? !!draft && JSON.stringify(draft) !== JSON.stringify(landingPage.draft) : !!draft;

  const previewPayload = useMemo(() => ({
    landingPage: {
      ...(landingPage || {}),
      businessSlug,
      pageSlug,
      published: editableDraft,
    },
    content: editableDraft,
    businessProfile: data?.businessProfile || {
      businessSlug,
      businessName: 'Turagua Racing Peru',
      brand: { displayName: 'Turagua Racing Peru', logoUrl: '/images/turagua.jpg', tagline: 'Proteccion & estetica automotriz' },
      settings: {
        branding: { displayName: 'Turagua Racing Peru', logoUrl: '/images/turagua.jpg', tagline: 'Proteccion & estetica automotriz' },
        contact: { primaryPhone: '+51 999 555 010', email: '' },
        locations: [{ id: 'turagua-main', name: 'Turagua Racing Peru', addressLine: 'Lima, Peru', reference: 'Visita previa coordinacion.', city: 'Lima', country: 'Peru' }],
        commercialHours: { saturday: '9:00 a 18:00', summary: 'Lunes a sabado, 9:00 a 18:00' },
        socials: [],
      },
      agent: { name: 'Iris' },
    },
    catalogOfferings: [],
  }), [businessSlug, data?.businessProfile, editableDraft, landingPage, pageSlug]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeyFor(businessSlug, pageSlug) });
  };

  const saveMutation = useMutation({
    mutationFn: () => landingRepository.saveDraft({ businessSlug, pageSlug, title: landingPage?.title || 'Turagua Landing', draft: editableDraft }),
    onSuccess: async (page) => {
      setMessage('Cambios guardados.');
      setDraft(page?.draft || editableDraft);
      await refresh();
    },
    onError: (err) => setMessage(err.message || 'No se pudo guardar el draft.'),
  });

  const publishMutation = useMutation({
    mutationFn: () => landingRepository.publish({ businessSlug, pageSlug }),
    onSuccess: async () => {
      setMessage('Pagina publicada.');
      await refresh();
    },
    onError: (err) => setMessage(err.message || 'No se pudo publicar.'),
  });

  const updateContent = (producer) => {
    setMessage('');
    setUndoStack((stack) => [...stack, cloneLandingContent(editableDraft)].slice(-30));
    setRedoStack([]);
    setDraft((current) => {
      const base = cloneLandingContent(current || editableDraft);
      producer(base);
      return normalizeOrders(base);
    });
  };

  const updateBlock = (blockId, patch) => {
    updateContent((base) => {
      base.blocks = base.blocks.map((block) => {
        if (block.id !== blockId) return block;
        const { replaceData, ...rest } = patch;
        return {
          ...block,
          ...rest,
          data: replaceData ? (patch.data || {}) : { ...(block.data || {}), ...(patch.data || {}) },
        };
      });
    });
  };

  const updateTheme = (patch) => {
    updateContent((base) => {
      base.theme = { ...(base.theme || {}), ...patch };
    });
  };

  const addBlock = (type) => {
    updateContent((base) => {
      const order = Math.max(0, ...base.blocks.map((block) => Number(block.order || 0))) + 10;
      const block = {
        id: `${type}_${Date.now()}`,
        type,
        enabled: true,
        order,
        frameHeight: type === 'hero' || type === 'catalog' || type === 'about' || type === 'contact' ? 'viewport' : 'content',
        data: initialDataForType(type),
      };
      base.blocks.push(block);
      setActiveBlockId(block.id);
    });
    setAddPickerOpen(false);
  };

  const duplicateBlock = (blockId) => {
    updateContent((base) => {
      const source = base.blocks.find((block) => block.id === blockId);
      if (!source) return;
      const order = Math.max(0, ...base.blocks.map((block) => Number(block.order || 0))) + 10;
      const copy = { ...cloneLandingContent(source), id: `${source.type}_${Date.now()}`, order };
      base.blocks.push(copy);
      setActiveBlockId(copy.id);
    });
  };

  const removeBlock = (blockId) => {
    updateContent((base) => {
      base.blocks = base.blocks.filter((block) => block.id !== blockId);
      if (activeBlockId === blockId) {
        const next = sortBlocks(base.blocks)[0]?.id || '';
        setActiveBlockId(next);
      }
    });
  };

  const moveBlock = (blockId, direction) => {
    updateContent((base) => {
      const blocks = sortBlocks(base.blocks);
      const index = blocks.findIndex((block) => block.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= blocks.length) return;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      base.blocks = blocks.map((block, blockIndex) => ({ ...block, order: (blockIndex + 1) * 10 }));
    });
  };

  const moveBlockTo = (blockId, targetId) => {
    if (!blockId || !targetId || blockId === targetId) return;
    updateContent((base) => {
      const blocks = sortBlocks(base.blocks);
      const sourceIndex = blocks.findIndex((block) => block.id === blockId);
      const targetIndex = blocks.findIndex((block) => block.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [source] = blocks.splice(sourceIndex, 1);
      blocks.splice(targetIndex, 0, source);
      base.blocks = blocks.map((block, blockIndex) => ({ ...block, order: (blockIndex + 1) * 10 }));
    });
  };

  const updateHeroStats = (stats) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, { data: { stats } });
  };

  const undoChange = () => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((stack) => [...stack, cloneLandingContent(editableDraft)].slice(-30));
    setUndoStack((stack) => stack.slice(0, -1));
    setDraft(previous);
    setMessage('Cambio deshecho.');
  };

  const redoChange = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((stack) => [...stack, cloneLandingContent(editableDraft)].slice(-30));
    setRedoStack((stack) => stack.slice(0, -1));
    setDraft(next);
    setMessage('Cambio rehecho.');
  };

  const publishPage = () => {
    const confirmed = window.confirm('Estas por publicar los cambios en la pagina publica de Turagua. ¿Quieres publicar ahora?');
    if (confirmed) publishMutation.mutate();
  };

  const updateHeroFromCanvas = (patch) => {
    const target = heroBlock?.id;
    if (!target) return;
    updateBlock(target, { data: patch });
    setActivePanel('constructor');
    setActiveBlockId(target);
  };

  const updateCanvasBlockData = (type, patch) => {
    const target = sortedBlocks.find((block) => block.type === type)?.id;
    if (!target) return;
    updateBlock(target, { data: patch });
    setActivePanel('constructor');
    setActiveBlockId(target);
  };

  const selectCanvasElement = (selection) => {
    setSelectedCanvasElement(selection);
    const target = sortedBlocks.find((block) => block.id === selection?.blockId || block.type === selection?.blockType);
    if (target) {
      setActivePanel(selection?.blockType === 'stats' ? 'stats' : 'constructor');
      setActiveBlockId(target.id);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app text-text-secondary">Cargando builder...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app p-6 text-center text-text-secondary">No se pudo cargar el builder.</div>;
  }

  return (
    <main className={`flex flex-col overflow-hidden bg-surface-app text-text-primary ${embedded ? 'h-full min-h-0' : 'h-[100dvh] min-h-[720px]'}`}>
      <WorkbenchToolbar
        landingPage={landingPage}
        message={message}
        isDirty={isDirty}
        preview={preview}
        previewZoom={previewZoom}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onPreviewChange={setPreview}
        onPreviewZoomChange={setPreviewZoom}
        onThemeOpen={() => setThemeOpen(true)}
        onUndo={undoChange}
        onRedo={redoChange}
        onSave={() => saveMutation.mutate()}
        onPublish={publishPage}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        saving={saveMutation.isPending}
        publishing={publishMutation.isPending}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(420px,46%)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col border-r border-border-default bg-surface-panel">
          {activePanel === 'constructor' ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
                <div>
                  <div className="text-sm font-black">Secciones</div>
                  <div className="text-xs text-text-muted">{sortedBlocks.length} secciones</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setAddPickerOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {selectedCanvasElement ? (
                  <div className="mb-3 rounded-lg border border-action-primary/40 bg-surface-subtle p-3 text-sm font-semibold text-text-secondary">
                    Editando: <span className="font-black text-action-primary">{selectedCanvasElement.label}</span>
                  </div>
                ) : null}
                <div className="space-y-3">
                  {sortedBlocks.map((block, index) => (
                    <SectionCard
                      key={block.id}
                      block={block}
                      index={index}
                      total={sortedBlocks.length}
                      expanded={activeBlock?.id === block.id}
                      dirty={isDirty}
                      dragging={draggedBlockId === block.id}
                      onSelect={() => setActiveBlockId(block.id)}
                      onChange={(patch) => updateBlock(block.id, patch)}
                      onMove={(direction) => moveBlock(block.id, direction)}
                      onDragStart={() => setDraggedBlockId(block.id)}
                      onDragEnd={() => setDraggedBlockId('')}
                      onDrop={() => {
                        moveBlockTo(draggedBlockId, block.id);
                        setDraggedBlockId('');
                      }}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onRemove={() => removeBlock(block.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : activePanel === 'stats' ? (
            <StatsBlockEditor stats={heroBlock?.data?.stats || []} onChange={updateHeroStats} />
          ) : activePanel === 'general' ? (
            <GeneralPanel
              content={editableDraft}
              onThemeOpen={() => setThemeOpen(true)}
              onMotionChange={(motion) => updateContent((base) => {
                base.motion = motion;
              })}
            />
          ) : (
            <IrisPanel
              agent={editableDraft.agent}
              businessSlug={businessSlug}
              businessName={previewPayload?.businessProfile?.brand?.displayName || previewPayload?.businessProfile?.businessName || 'Turagua Racing Peru'}
              onChange={(agent) => updateContent((base) => {
                base.agent = { ...(base.agent || {}), ...agent };
              })}
            />
          )}
        </section>

        <LiveCanvas
          preview={preview}
          previewZoom={previewZoom}
          payload={previewPayload}
          onHeroDataChange={updateHeroFromCanvas}
          onBlockDataChange={updateCanvasBlockData}
          onSelectElement={selectCanvasElement}
        />
      </div>

      {addPickerOpen ? <AddBlockModal onClose={() => setAddPickerOpen(false)} onAdd={addBlock} /> : null}
      {themeOpen ? <AppearanceModal theme={editableDraft.theme || {}} onChange={updateTheme} onClose={() => setThemeOpen(false)} /> : null}
    </main>
  );
}

function WorkbenchToolbar({
  landingPage,
  message,
  isDirty,
  preview,
  previewZoom,
  activePanel,
  onPanelChange,
  onPreviewChange,
  onPreviewZoomChange,
  onThemeOpen,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  canUndo,
  canRedo,
  saving,
  publishing,
}) {
  const panels = [
    { id: 'general', label: 'Datos Generales' },
    { id: 'iris', label: 'Iris' },
    { id: 'stats', label: 'Estadisticas' },
    { id: 'constructor', label: 'Sitio Web' },
  ];

  return (
    <header className="shrink-0 border-b border-border-default bg-surface-panel">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight">Landing Builder Turagua</h1>
            <Badge
              estado={saving ? 'Guardando...' : isDirty ? 'Cambios sin guardar' : 'Todos los cambios guardados'}
              variant={isDirty ? 'warning' : 'success'}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {panels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => onPanelChange(panel.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${activePanel === panel.id ? 'bg-action-primary text-white' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}`}
              >
                {panel.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {message ? <span className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-bold text-text-secondary">{message}</span> : null}
          <Button variant="secondary" onClick={onThemeOpen}>
            <Palette className="h-4 w-4" />
            Apariencia Global
          </Button>
          <Button variant="secondary" disabled={!canUndo} onClick={onUndo} title="Deshacer ultimo cambio">
            <Undo2 className="h-4 w-4" />
            Deshacer
          </Button>
          <Button variant="secondary" disabled={!canRedo} onClick={onRedo} title="Rehacer cambio">
            <Redo2 className="h-4 w-4" />
            Rehacer
          </Button>
          <div className="inline-flex rounded-lg border border-border-default bg-surface-subtle p-1">
            <button
              type="button"
              onClick={() => onPreviewChange('desktop')}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-bold ${preview === 'desktop' ? 'bg-surface-panel text-action-primary shadow-sm' : 'text-text-secondary'}`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => onPreviewChange('tablet')}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-bold ${preview === 'tablet' ? 'bg-surface-panel text-action-primary shadow-sm' : 'text-text-secondary'}`}
            >
              <Monitor className="h-4 w-4" />
              Tablet
            </button>
            <button
              type="button"
              onClick={() => onPreviewChange('mobile')}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-bold ${preview === 'mobile' ? 'bg-surface-panel text-action-primary shadow-sm' : 'text-text-secondary'}`}
            >
              <Smartphone className="h-4 w-4" />
              Movil
            </button>
          </div>
          <div className="inline-flex rounded-lg border border-border-default bg-surface-subtle p-1">
            {['fit', 'actual'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPreviewZoomChange(mode)}
                className={`min-h-9 rounded-md px-3 text-sm font-bold ${previewZoom === mode ? 'bg-surface-panel text-action-primary shadow-sm' : 'text-text-secondary'}`}
              >
                {mode === 'fit' ? 'Ajustar' : '100%'}
              </button>
            ))}
          </div>
          <Button variant="secondary" loading={saving} onClick={onSave}>
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
          <Button loading={publishing} onClick={onPublish}>
            <Send className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>
    </header>
  );
}

function SectionCard({ block, index, total, expanded, dirty, dragging, onSelect, onChange, onMove, onDragStart, onDragEnd, onDrop, onDuplicate, onRemove }) {
  const label = blockLabels[block.type] || titleForType(block.type);
  const canRemove = !['hero', 'catalog'].includes(block.type);

  return (
    <article
      data-landing-builder-block={block.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`rounded-lg border bg-surface-panel shadow-sm ${expanded ? 'border-action-primary/60' : 'border-border-default'} ${dragging ? 'opacity-60' : ''}`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 px-3 py-3 text-left">
        <GripVertical className="h-4 w-4 shrink-0 text-text-muted" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-black">{label}</h2>
            <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-text-muted">Seccion</span>
            {dirty && expanded ? <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-black text-action-primary">Cambios</span> : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-text-muted">{blockDescriptions[block.type] || block.id}</p>
        </div>
        {block.enabled === false ? <EyeOff className="h-4 w-4 text-text-muted" /> : <Eye className="h-4 w-4 text-status-success" />}
        <ChevronDown className={`h-4 w-4 text-text-muted transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded ? (
        <div className="border-t border-border-subtle p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <IconButton label={block.enabled === false ? 'Mostrar' : 'Ocultar'} onClick={() => onChange({ enabled: block.enabled === false })}>
              {block.enabled === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </IconButton>
            <IconButton label="Subir" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></IconButton>
            <IconButton label="Bajar" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></IconButton>
            <IconButton label="Duplicar" onClick={onDuplicate}><Copy className="h-4 w-4" /></IconButton>
          </div>

          <FrameControls block={block} onChange={onChange} />
          <SemanticBlockEditor block={block} onChange={onChange} />

          <div className="mt-4 flex justify-end">
            <Button variant="danger-outline" size="sm" disabled={!canRemove} onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function FrameControls({ block, onChange }) {
  const updateLayoutField = (key, value) => onChange({ layout: { ...(block.layout || {}), [key]: value || undefined } });
  const setAlign = (value) => {
    updateLayoutField('align', value);
    if (block.type === 'hero') onChange({ data: { align: value } });
  };
  const designOptions = designOptionsForBlock(block.type);

  return (
    <div className="mb-4 rounded-lg border border-border-subtle bg-surface-subtle p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <FieldLabel>Altura de la seccion</FieldLabel>
          <Select data-landing-builder-field="frameHeight" value={block.frameHeight || 'content'} onChange={(event) => onChange({ frameHeight: event.target.value })}>
            {LANDING_FRAME_HEIGHTS.map((height) => <option key={height} value={height}>{sectionHeightLabels[height] || height}</option>)}
          </Select>
        </label>
        <label>
          <FieldLabel>Diseno</FieldLabel>
          <Select data-landing-builder-field="layoutVariant" value={block.layout?.variant || block.data?.variant || ''} onChange={(event) => {
            updateLayoutField('variant', event.target.value);
            if (block.type === 'hero') onChange({ data: { variant: event.target.value } });
          }}>
            {designOptions.map((option) => (
              <option key={option.value || 'basic'} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
      </div>
      <div className="mt-3">
        <FieldLabel>Alineacion</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {alignments.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setAlign(item.value)}
              className={`min-h-9 rounded-lg border px-3 text-sm font-bold ${block.layout?.align === item.value ? 'border-action-primary bg-action-primary text-white' : 'border-border-default bg-surface-panel text-text-secondary'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function designOptionsForBlock(type) {
  if (type === 'hero') {
    return [
      { value: 'turagua_legacy', label: 'Turagua visual' },
      { value: 'hero_split_clean', label: 'Hero split limpio' },
      { value: 'hero_dark_panel', label: 'Hero oscuro' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'stats') {
    return [
      { value: 'stats_cards', label: 'Metricas en cards' },
      { value: 'stats_strip', label: 'Franja compacta' },
      { value: 'stats_dark', label: 'Metricas oscuras' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'catalog') {
    return [
      { value: 'turagua_catalog_frame', label: 'Servicios visuales' },
      { value: 'turagua_catalog_compact', label: 'Catalogo compacto' },
      { value: 'turagua_catalog_showcase', label: 'Catalogo amplio' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'about') {
    return [
      { value: 'turagua_about_frame', label: 'Historia con imagen' },
      { value: 'turagua_about_dark', label: 'Historia oscura' },
      { value: 'turagua_about_clean', label: 'Historia limpia' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'structured_content') {
    return [
      { value: 'turagua_about_frame', label: 'Historia con imagen' },
      { value: 'turagua_about_dark', label: 'Historia oscura' },
      { value: 'turagua_about_clean', label: 'Historia limpia' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'gallery' || type === 'promotion') {
    return [
      { value: 'turagua_explore_services', label: 'Explorar visual' },
      { value: 'gallery_mosaic', label: 'Mosaico' },
      { value: 'gallery_strip', label: 'Franja horizontal' },
      { value: 'gallery_dark', label: 'Galeria oscura' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'testimonials') {
    return [
      { value: 'testimonials_cards', label: 'Testimonios cards' },
      { value: 'testimonials_quote_wall', label: 'Muro de citas' },
      { value: 'testimonials_dark', label: 'Testimonios oscuro' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'agent_call_to_action' || type === 'call_to_action') {
    return [
      { value: 'cta_band', label: 'Banda CTA' },
      { value: 'cta_panel', label: 'Panel centrado' },
      { value: 'cta_dark', label: 'CTA oscuro' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'contact') {
    return [
      { value: 'turagua_contact_frame', label: 'Contacto visual' },
      { value: 'turagua_contact_split', label: 'Contacto split' },
      { value: 'turagua_contact_compact', label: 'Contacto compacto' },
      { value: 'turagua_contact_dark', label: 'Contacto oscuro' },
      { value: '', label: 'Basico' },
    ];
  }

  if (type === 'footer') {
    return [
      { value: 'footer_dark', label: 'Footer oscuro' },
      { value: 'footer_light', label: 'Footer claro' },
      { value: 'footer_compact', label: 'Footer compacto' },
      { value: '', label: 'Basico' },
    ];
  }

  return [
    { value: '', label: 'Basico' },
  ];
}

function SemanticBlockEditor({ block, onChange }) {
  if (block.type === 'hero') return <HeroBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'catalog') return <CatalogBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'about') return <AboutBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'contact') return <ContactBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'gallery') return <ExploreBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'footer') return <FooterBlockEditor block={block} onChange={onChange} />;
  return <GenericBlockEditor block={block} onChange={onChange} />;
}

function HeroBlockEditor({ block, onChange }) {
  const data = block.data || {};
  const promotions = Array.isArray(data.promotions) ? data.promotions : [];
  const updateData = (patch) => onChange({ data: patch });
  const updatePromotion = (index, patch) => {
    const next = [...promotions];
    next[index] = { ...next[index], ...patch };
    updateData({ promotions: next });
  };
  const movePromotion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= promotions.length) return;
    const next = [...promotions];
    [next[index], next[target]] = [next[target], next[index]];
    updateData({ promotions: next });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
          <FieldLabel>Marca visible</FieldLabel>
          <label className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
            <input type="checkbox" checked={data.brandMode === 'custom'} onChange={(event) => updateData({ brandMode: event.target.checked ? 'custom' : 'business' })} />
            Personalizar solo para esta pagina
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nombre de marca" value={data.brandName} onChange={(value) => updateData({ brandName: value, brandMode: 'custom' })} />
            <TextField label="Subtitulo de marca" value={data.brandTagline} onChange={(value) => updateData({ brandTagline: value, brandMode: 'custom' })} />
          </div>
          <FieldHint>Por defecto usa los datos de Ajustes Generales. Activa personalizacion si esta pagina necesita otro lockup.</FieldHint>
        </div>
        <TextField label="Titulo" value={data.title} onChange={(value) => updateData({ title: value })} marker="title" />
        <TextField label="Texto resaltado" value={data.titleHighlight} onChange={(value) => updateData({ titleHighlight: value })} />
        <TextField label="Etiqueta superior" value={data.eyebrow} onChange={(value) => updateData({ eyebrow: value })} marker="eyebrow" />
        <AreaField label="Subtitulo" value={data.subtitle} onChange={(value) => updateData({ subtitle: value })} marker="text" />
        <AreaField label="Texto de soporte" value={data.supportingText} onChange={(value) => updateData({ supportingText: value })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Boton principal" value={data.primaryCta} onChange={(value) => updateData({ primaryCta: value, cta: value })} marker="primaryCta" />
        <TextField label="Boton secundario" value={data.secondaryCta} onChange={(value) => updateData({ secondaryCta: value })} marker="secondaryCta" />
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MediaUploadField
            label="Imagen o video"
            value={data.heroMediaUrl || data.imageUrl}
            accept="image/*,video/mp4,video/webm,video/ogg"
            onChange={(value) => updateData({ heroMediaUrl: value, imageUrl: value })}
            marker="mediaUrl"
          />
          <MediaUploadField
            label="Logo"
            value={data.logoUrl}
            accept="image/*"
            onChange={(value) => updateData({ logoUrl: value })}
            marker="logoUrl"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <FieldLabel>Fondo</FieldLabel>
            <Select data-landing-builder-field="layoutMedia" value={block.layout?.media || 'background'} onChange={(event) => onChange({ layout: { ...(block.layout || {}), media: event.target.value } })}>
              <option value="background">Fondo</option>
              <option value="side">Lateral</option>
              <option value="none">Sin media</option>
            </Select>
          </label>
          <SliderField label="Oscurecer fondo" min="0" max="90" value={Number(data.overlay || 55)} onChange={(value) => updateData({ overlay: value })} suffix="%" />
        </div>
        <FieldHint>El archivo se guarda como asset publico del builder. La URL queda disponible por si necesitas reemplazarla manualmente.</FieldHint>
      </div>

      <PromotionsEditor
        promotions={promotions}
        onChange={updatePromotion}
        onMove={movePromotion}
        onReset={(index) => updatePromotion(index, { position: 'bottom-left', placement: undefined, offsetX: 0, offsetY: 0 })}
      />

      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function PromotionsEditor({ promotions, onChange, onMove, onReset }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const dropPromotion = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onMove(draggedIndex, targetIndex - draggedIndex);
    setDraggedIndex(null);
  };

  return (
    <div data-landing-builder-promotion-workbench className="rounded-lg border border-border-default bg-surface-panel p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <FieldLabel className="mb-0">Ubicacion de promociones</FieldLabel>
          <p className="text-xs text-text-muted">El contenido se administra en Promociones. Aqui solo defines visibilidad, orden y posicion en el Hero.</p>
        </div>
      </div>
      <div className="grid gap-3">
        {promotions.map((promo, index) => (
          <div
            key={`${promo.title || 'promo'}-${index}`}
            data-landing-builder-promotion={index}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropPromotion(index)}
            className="rounded-lg border border-border-subtle bg-surface-subtle p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-text-muted">Promo {index + 1}</span>
              <div className="flex gap-1">
                <IconButton label="Subir" disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                <IconButton label="Bajar" disabled={index === promotions.length - 1} onClick={() => onMove(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border border-border-default bg-surface-panel p-3">
                <div className="text-[10px] font-black uppercase tracking-wide text-text-muted">{promo.eyebrow || 'Promocion'}</div>
                <div className="mt-1 text-sm font-black text-text-primary">{promo.title || 'Promocion sin titulo'}</div>
                <div className="mt-1 text-xs font-semibold text-text-secondary">Boton: {promo.cta || 'Obtener'}</div>
              </div>
              <div className="grid gap-3">
                <label>
                  <FieldLabel>Visible</FieldLabel>
                  <Select value={promo.visible === false ? 'hidden' : 'visible'} onChange={(event) => onChange(index, { visible: event.target.value === 'visible' })}>
                    <option value="visible">Visible</option>
                    <option value="hidden">Oculta</option>
                  </Select>
                </label>
              </div>
              <div>
                <FieldLabel>Zona del Hero</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {promoPositions.map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => onChange(index, { position, placement: { desktop: { anchor: position, order: index, offsetX: 0, offsetY: 0 }, mobile: { anchor: 'flow', order: index } } })}
                      className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${promo.position === position ? 'border-action-primary bg-action-primary text-white' : 'border-border-default bg-surface-panel text-text-secondary'}`}
                    >
                      {promoPositionLabels[position] || position}
                    </button>
                  ))}
                </div>
              </div>
              <details className="rounded-lg border border-border-subtle bg-surface-panel p-3">
                <summary className="cursor-pointer text-sm font-black text-text-secondary">Ajuste fino</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SliderField label="Horizontal" min="-24" max="24" value={Number(promo.placement?.desktop?.offsetX || 0)} onChange={(value) => onChange(index, { placement: withPromoOffset(promo, { offsetX: value }, index) })} suffix="px" />
                  <SliderField label="Vertical" min="-24" max="24" value={Number(promo.placement?.desktop?.offsetY || 0)} onChange={(value) => onChange(index, { placement: withPromoOffset(promo, { offsetY: value }, index) })} suffix="px" />
                </div>
              </details>
              <div className="flex justify-between gap-2">
                <Button size="sm" variant="secondary" onClick={() => onReset(index)}>Restablecer posicion</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsBlockEditor({ stats, onChange }) {
  const normalizedStats = Array.isArray(stats) ? stats : [];
  const [draggedIndex, setDraggedIndex] = useState(null);
  const updateItem = (index, patch) => {
    const next = [...normalizedStats];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= normalizedStats.length) return;
    const next = [...normalizedStats];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const dropItem = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const next = [...normalizedStats];
    const [item] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, item);
    onChange(next);
    setDraggedIndex(null);
  };

  return (
    <div data-landing-builder-stats-panel className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Estadisticas del negocio</h2>
          <p className="text-sm text-text-muted">Panel logico: se publica embebido en Hero, no como bloque publico separado.</p>
        </div>
        <Button size="sm" onClick={() => onChange([...normalizedStats, { ...defaultStat }])}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
      <div className="space-y-3">
        {normalizedStats.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropItem(index)}
            className="rounded-lg border border-border-default bg-surface-panel p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide text-text-muted">Dato {index + 1}</span>
              <div className="flex gap-1">
                <IconButton label="Subir" disabled={index === 0} onClick={() => moveItem(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                <IconButton label="Bajar" disabled={index === normalizedStats.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Valor" value={item.value} onChange={(value) => updateItem(index, { value })} />
              <TextField label="Etiqueta" value={item.label} onChange={(value) => updateItem(index, { label: value })} />
            </div>
            <div className="mt-3 flex justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
                <input type="checkbox" checked={item.visible !== false} onChange={(event) => updateItem(index, { visible: event.target.checked })} />
                Visible
              </label>
              <Button size="sm" variant="danger-outline" onClick={() => onChange(normalizedStats.filter((_, itemIndex) => itemIndex !== index))}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogBlockEditor({ block, onChange }) {
  const data = block.data || {};
  const steps = Array.isArray(data.bookingSteps) ? data.bookingSteps : [];
  const updateData = (patch) => onChange({ data: patch });

  return (
    <div data-landing-builder-catalog-editor className="space-y-4">
      <TextField label="Titulo" value={data.title} onChange={(value) => updateData({ title: value })} marker="title" />
      <AreaField label="Subtitulo" value={data.subtitle} onChange={(value) => updateData({ subtitle: value })} marker="text" />
      <TextField label="Texto Como reservar" value={data.bookingTitle} onChange={(value) => updateData({ bookingTitle: value })} />
      <RepeatableTextItems
        title="Pasos de reserva"
        items={steps}
        defaultItem={defaultStep}
        fields={['number', 'title', 'description', 'icon']}
        onChange={(next) => updateData({ bookingSteps: next })}
      />
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function AboutBlockEditor({ block, onChange }) {
  const data = block.data || {};
  const updateData = (patch) => onChange({ data: patch });
  return (
    <div data-landing-builder-about-editor className="space-y-4">
      <TextField label="Etiqueta superior" value={data.eyebrow} onChange={(value) => updateData({ eyebrow: value })} />
      <TextField label="Titulo" value={data.title} onChange={(value) => updateData({ title: value })} />
      <TextField label="Anos de experiencia" value={data.experience} onChange={(value) => updateData({ experience: value })} />
      <AreaField label="Texto destacado" value={data.highlight || data.body} onChange={(value) => updateData({ highlight: value, body: value })} />
      <AreaField label="Descripcion" value={data.description || data.subtitle} onChange={(value) => updateData({ description: value, subtitle: value })} />
      <MediaUploadField label="Media" value={data.imageUrl || data.mediaUrl} accept="image/*,video/mp4,video/webm,video/ogg" onChange={(value) => updateData({ imageUrl: value, mediaUrl: value })} />
      <RepeatableTextItems title="Features" items={data.features || []} defaultItem={{ title: 'Feature', description: '', visible: true }} fields={['title', 'description']} onChange={(next) => updateData({ features: next })} />
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function ContactBlockEditor({ block, onChange }) {
  const data = block.data || {};
  const content = data.content || {};
  const display = data.display || {};
  const updateData = (patch) => onChange({ data: patch });
  const updateContent = (patch) => updateData({ content: { ...content, ...patch } });
  const updateDisplay = (patch) => updateData({ display: { ...display, ...patch } });
  return (
    <div data-landing-builder-contact-editor className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
        <FieldLabel>Fuente de datos</FieldLabel>
        <p className="text-sm leading-6 text-text-secondary">Telefono, correo, ubicacion, coordenadas y horarios vienen de Ajustes Generales. Aqui decides como se muestran.</p>
        <TextField label="Location ID" value={data.locationId} onChange={(value) => updateData({ locationId: value })} />
        <FieldHint>Dejalo vacio para usar la primera sede activa del negocio.</FieldHint>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
        <FieldLabel>Copy editorial</FieldLabel>
        <div className="grid gap-3">
          <TextField label="Etiqueta superior" value={content.eyebrow || data.eyebrow} onChange={(value) => updateContent({ eyebrow: value })} />
          <TextField label="Titulo" value={content.title || data.title} onChange={(value) => updateContent({ title: value })} />
          <AreaField label="Descripcion" value={content.description || data.body} onChange={(value) => updateContent({ description: value })} />
          <TextField label="Agenda eyebrow" value={content.agendaEyebrow} onChange={(value) => updateContent({ agendaEyebrow: value })} />
          <TextField label="Agenda titulo" value={content.agendaTitle} onChange={(value) => updateContent({ agendaTitle: value })} />
          <AreaField label="Agenda descripcion" value={content.agendaDescription} onChange={(value) => updateContent({ agendaDescription: value })} />
          <TextField label="Boton agenda" value={content.agendaButtonLabel || data.cta} onChange={(value) => updateContent({ agendaButtonLabel: value })} />
          <AreaField label="Mensaje de confianza" value={content.trustMessage} onChange={(value) => updateContent({ trustMessage: value })} />
          <TextField label="Titulo proceso" value={content.processTitle} onChange={(value) => updateContent({ processTitle: value })} />
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
        <FieldLabel>Visibilidad y mapa</FieldLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['showPhone', 'Mostrar telefono'],
            ['showEmail', 'Mostrar correo'],
            ['showAddress', 'Mostrar ubicacion'],
            ['showHours', 'Mostrar horarios'],
            ['showMap', 'Mostrar mapa'],
            ['showDirectionsButton', 'Boton Como llegar'],
          ].map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
              <input type="checkbox" checked={display[key] !== false} onChange={(event) => updateDisplay({ [key]: event.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <FieldLabel>Estilo de mapa</FieldLabel>
            <Select value={display.mapStyle || 'editorial'} onChange={(event) => updateDisplay({ mapStyle: event.target.value })}>
              <option value="editorial">Editorial</option>
              <option value="interactive">Interactivo</option>
            </Select>
          </label>
          <TextField label="Zoom visual" value={display.mapZoom} onChange={(value) => updateDisplay({ mapZoom: value })} />
        </div>
      </div>
      <FieldHint>Para cambiar telefono, direccion, coordenadas u horarios, usa Ajustes Generales. El Landing Builder solo define presentacion.</FieldHint>
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function ExploreBlockEditor({ block, onChange }) {
  const data = block.data || {};
  return (
    <div className="space-y-4">
      <TextField label="Titulo" value={data.title} onChange={(value) => onChange({ data: { title: value } })} />
      <AreaField label="Descripcion" value={data.body || data.subtitle} onChange={(value) => onChange({ data: { body: value, subtitle: value } })} />
      <MediaUploadField label="Media" value={data.imageUrl} accept="image/*,video/mp4,video/webm,video/ogg" onChange={(value) => onChange({ data: { imageUrl: value } })} />
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function FooterBlockEditor({ block, onChange }) {
  const data = block.data || {};
  return (
    <div className="space-y-4">
      <TextField label="Titulo" value={data.title} onChange={(value) => onChange({ data: { title: value } })} />
      <AreaField label="Texto auxiliar" value={data.body} onChange={(value) => onChange({ data: { body: value } })} />
      <TextField label="Boton" value={data.cta} onChange={(value) => onChange({ data: { cta: value } })} />
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function GenericBlockEditor({ block, onChange }) {
  const data = block.data || {};
  return (
    <div className="space-y-4">
      <TextField label="Titulo" value={data.title} onChange={(value) => onChange({ data: { title: value } })} />
      <AreaField label="Texto" value={data.body || data.subtitle} onChange={(value) => onChange({ data: { body: value, subtitle: value } })} />
      <AdvancedJson block={block} onChange={onChange} />
    </div>
  );
}

function LiveCanvas({ preview, previewZoom, payload, onHeroDataChange, onBlockDataChange, onSelectElement }) {
  const shellRef = useRef(null);
  const iframeRef = useRef(null);
  const [availableSize, setAvailableSize] = useState({ width: 0, height: 0 });
  const [previewMetrics, setPreviewMetrics] = useState(null);
  const viewport = PREVIEW_VIEWPORTS[preview] || PREVIEW_VIEWPORTS.desktop;
  const previewUrl = `/admin/landing/preview?mode=draft&viewport=${preview}`;
  const previewScale = previewZoom === 'actual'
    ? 1
    : Math.min(
      availableSize.width ? availableSize.width / viewport.width : 1,
      availableSize.height ? availableSize.height / viewport.height : 1,
      1
    );
  const scaledWidth = Math.ceil(viewport.width * previewScale);
  const scaledHeight = Math.ceil(viewport.height * previewScale);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return undefined;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setAvailableSize({ width: Math.max(0, rect.width - 32), height: Math.max(0, rect.height - 32) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const { type } = event.data || {};
      if (type === 'landing-preview:ready') {
        if (event.data.metrics) setPreviewMetrics(event.data.metrics);
        iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin);
      }
      if (type === 'landing-preview:element-selected') onSelectElement(event.data.selection);
      if (type === 'landing-preview:hero-data-change') onHeroDataChange(event.data.patch);
      if (type === 'landing-preview:block-data-change') onBlockDataChange(event.data.blockType, event.data.patch);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBlockDataChange, onHeroDataChange, onSelectElement, payload]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin);
  }, [payload, preview]);

  return (
    <section className="hidden min-h-0 flex-col bg-surface-subtle xl:flex">
      <div className="flex min-h-11 items-center justify-between border-b border-border-default bg-surface-panel px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black">Canvas vivo</span>
          <span className="rounded-md bg-surface-subtle px-2 py-1 text-[11px] font-black text-text-muted">
            {viewport.label} {viewport.width} x {viewport.height} · {previewZoom === 'actual' ? '100%' : `${Math.round(previewScale * 100)}%`}
          </span>
          {previewMetrics ? (
            <span className="rounded-md bg-surface-subtle px-2 py-1 text-[11px] font-bold text-text-muted">
              iframe {previewMetrics.innerWidth}px · sin overflow X: {previewMetrics.scrollWidth <= previewMetrics.clientWidth ? 'si' : 'no'}
            </span>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Check className="h-4 w-4 text-status-success" />
          Haz clic en un texto para editarlo.
        </span>
      </div>
      <div ref={shellRef} className="min-h-0 flex-1 overflow-auto p-4">
        <div
          className={`mx-auto ${preview === 'desktop' ? '' : 'rounded-[24px] bg-slate-950/5 p-2 shadow-xl'}`}
          style={{ width: scaledWidth || viewport.width, height: scaledHeight || viewport.height }}
        >
          <div
            data-landing-preview-mode="draft"
            data-landing-renderer-version="turagua-frames-v2"
            className="origin-top-left overflow-hidden rounded-lg border border-border-default bg-white shadow-xl"
            style={{
              width: viewport.width,
              height: viewport.height,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              contain: 'layout paint size',
            }}
          >
            <iframe
              ref={iframeRef}
              title="Vista previa de la landing"
              src={previewUrl}
              width={viewport.width}
              height={viewport.height}
              onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'landing-preview:update', payload }, window.location.origin)}
              className="block h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function GeneralPanel({ content, onThemeOpen, onMotionChange }) {
  const navigation = Array.isArray(content?.navigation) ? content.navigation : [];
  const motion = content?.motion || 'signature';
  return (
    <div data-landing-builder-general-panel className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="rounded-lg border border-border-default bg-surface-panel p-4">
        <h2 className="text-lg font-black">Datos Generales</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Identidad, navegacion y apariencia se editan como configuracion editorial del sitio. Los datos operativos siguen fuera del Landing Builder.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
            <FieldLabel>Navegacion publica</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <span key={`${item.label}-${item.href}`} className="rounded-lg bg-surface-panel px-3 py-1.5 text-xs font-bold text-text-secondary">
                  {item.label} / {item.href}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
            <FieldLabel>Tema activo</FieldLabel>
            <div className="flex gap-2">
              {['primary', 'accent', 'surface', 'text'].map((key) => (
                <span key={key} title={key} className="h-8 w-8 rounded-lg border border-border-default" style={{ background: content?.theme?.[key] || currentTuraguaTheme[key] }} />
              ))}
            </div>
          </div>
          <Button variant="secondary" onClick={onThemeOpen}>
            <Palette className="h-4 w-4" />
            Abrir Apariencia Global
          </Button>
          <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
            <FieldLabel>Movimiento de la pagina</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                { value: 'signature', label: 'Signature' },
                { value: 'soft', label: 'Suave' },
                { value: 'dynamic', label: 'Dinamico' },
                { value: 'none', label: 'Sin animaciones' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onMotionChange(item.value)}
                  className={`min-h-10 rounded-lg border px-3 text-sm font-black transition ${motion === item.value ? 'border-action-primary bg-action-primary text-white' : 'border-border-default bg-surface-panel text-text-secondary hover:border-action-primary/60'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <FieldHint>Controla la intensidad de las animaciones publicas sin mostrar detalles tecnicos.</FieldHint>
          </div>
        </div>
      </div>
    </div>
  );
}

function IrisPanel({ agent = {}, businessSlug, businessName, onChange }) {
  const activeAgent = {
    name: 'Iris',
    avatarUrl: 'https://i.ibb.co/84r9sJc/imagen-2026-06-08-153923818.png',
    bannerUrl: '/images/turagua.jpg',
    welcomeMessage: `¡Hola! 👋 Soy Iris, del equipo de ${businessName}. ¿En qué te puedo ayudar hoy?`,
    nameColor: '#0f172a',
    avatarAlignment: 'left',
    ...agent,
  };
  const avatarPositionClass = activeAgent.avatarAlignment === 'center' ? 'left-1/2 -translate-x-1/2' : activeAgent.avatarAlignment === 'right' ? 'right-4' : 'left-4';
  const statusPositionClass = activeAgent.avatarAlignment === 'center' ? 'justify-center' : activeAgent.avatarAlignment === 'right' ? 'mr-24 justify-end' : 'ml-24 justify-start';
  const resetIntroPush = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(introPushDismissedKey(businessSlug));
    window.dispatchEvent(new CustomEvent('demo-test-agent:intro-push-reset', { detail: { businessSlug } }));
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid gap-4">
        <div className="rounded-lg border border-border-default bg-surface-panel p-4">
          <h2 className="text-lg font-black">Iris</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Configura como se presenta Iris en el chat publico del landing. Esto cambia la experiencia web; las instrucciones internas de Hermes siguen fuera del Landing Builder.
          </p>
        </div>

        <div className="rounded-lg border border-border-default bg-surface-panel p-4">
          <FieldLabel>Vista previa</FieldLabel>
          <div className="mt-2 overflow-hidden rounded-[22px] border border-border-default bg-white shadow-sm">
            <div className="relative h-24 bg-slate-950">
              {activeAgent.bannerUrl ? <img src={activeAgent.bannerUrl} alt="Banner de Iris" className="h-full w-full object-cover" /> : null}
              <div className={`absolute top-12 ${avatarPositionClass}`}>
                <img src={activeAgent.avatarUrl} alt={activeAgent.name} className="h-16 w-16 rounded-full border-4 border-white bg-white object-cover shadow-lg" />
                <div className="mx-auto -mt-1 w-max rounded-md bg-white px-2 py-0.5 text-[11px] font-black shadow-sm" style={{ color: activeAgent.nameColor }}>{activeAgent.name}</div>
              </div>
            </div>
            <div className={`flex h-14 items-center gap-2 ${statusPositionClass}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-slate-500">Activo ahora</span>
            </div>
            <div className="border-t border-slate-100 bg-white p-4">
              <div className="max-w-[82%] rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-5 text-slate-700 shadow-sm">
                {activeAgent.welcomeMessage}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border-default bg-surface-panel p-4">
          <div className="grid gap-4">
            <label>
              <FieldLabel>Nombre visible</FieldLabel>
              <Input value={activeAgent.name} onChange={(event) => onChange({ name: event.target.value })} />
            </label>
            <label>
              <FieldLabel>Mensaje de bienvenida</FieldLabel>
              <Textarea rows={3} value={activeAgent.welcomeMessage} onChange={(event) => onChange({ welcomeMessage: event.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaUploadField label="Avatar" value={activeAgent.avatarUrl} accept="image/*" onChange={(avatarUrl) => onChange({ avatarUrl })} />
              <MediaUploadField label="Banner del chat" value={activeAgent.bannerUrl} accept="image/*" onChange={(bannerUrl) => onChange({ bannerUrl })} />
            </div>
            <div className="rounded-lg border border-border-default bg-surface-subtle p-3">
              <button type="button" onClick={resetIntroPush} className="text-xs font-black text-action-primary hover:underline">
                Restablecer aviso de Iris
              </button>
              <FieldHint>Accion QA del builder: limpia el aviso de esta sesion sin publicarse en el landing.</FieldHint>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <FieldLabel>Color del nombre</FieldLabel>
                <div className="flex gap-2">
                  <input type="color" value={activeAgent.nameColor} onChange={(event) => onChange({ nameColor: event.target.value })} className="h-11 w-12 rounded-lg border border-border-default bg-surface-panel p-1" />
                  <Input value={activeAgent.nameColor} onChange={(event) => onChange({ nameColor: event.target.value })} />
                </div>
              </label>
              <label>
                <FieldLabel>Alineacion del avatar</FieldLabel>
                <Select value={activeAgent.avatarAlignment} onChange={(event) => onChange({ avatarAlignment: event.target.value })}>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </Select>
              </label>
            </div>
            <FieldHint>Guarda y publica para que estos cambios salgan en el landing publico.</FieldHint>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceModal({ theme, onChange, onClose }) {
  const activeTheme = { ...currentTuraguaTheme, ...theme };
  const presets = [{ name: 'Tema actual', ...currentTuraguaTheme }];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
      <div data-landing-builder-appearance-modal className="w-full max-w-2xl rounded-xl border border-border-default bg-surface-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-lg font-black">Apariencia Global</h2>
            <p className="text-sm text-text-muted">Presets, colores y preview seguro antes de publicar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-surface-subtle">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset)}
                className="rounded-lg border border-border-default bg-surface-subtle p-3 text-left transition hover:border-action-primary"
              >
                <div className="mb-3 flex gap-1">
                  <span className="h-6 w-6 rounded" style={{ background: preset.primary }} />
                  <span className="h-6 w-6 rounded" style={{ background: preset.accent }} />
                  <span className="h-6 w-6 rounded border" style={{ background: preset.surface }} />
                </div>
                <div className="text-sm font-black">{preset.name}</div>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorField label="Primario" value={activeTheme.primary} onChange={(value) => onChange({ primary: value, primaryForeground: safeForeground(value) })} />
            <ColorField label="Secundario" value={activeTheme.accent} onChange={(value) => onChange({ accent: value, accentForeground: safeForeground(value) })} />
            <ColorField label="Fondo" value={activeTheme.surface} onChange={(value) => onChange({ surface: value })} />
            <ColorField label="Texto" value={activeTheme.text} onChange={(value) => onChange({ text: value })} />
          </div>
          <div className="rounded-lg border border-border-subtle p-4" style={{ background: activeTheme.surface, color: activeTheme.text }}>
            <span className="inline-flex rounded px-3 py-2 text-sm font-black" style={{ background: activeTheme.primary, color: activeTheme.primaryForeground || safeForeground(activeTheme.primary) }}>
              Preview instantaneo
            </span>
            <p className="mt-3 text-sm font-semibold">El foreground seguro se calcula al seleccionar color de accion.</p>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => onChange(currentTuraguaTheme)}>Restablecer</Button>
            <Button onClick={onClose}>Guardar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBlockModal({ onClose, onAdd }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border-default bg-surface-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="text-lg font-black">Agregar seccion</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-surface-subtle">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {addableBlockTypes.map((type) => (
            <button key={type} type="button" onClick={() => onAdd(type)} className="rounded-lg border border-border-default bg-surface-subtle p-4 text-left transition hover:border-action-primary hover:bg-surface-panel">
              <div className="text-sm font-black">{blockLabels[type] || titleForType(type)}</div>
              <div className="mt-1 text-xs text-text-muted">{blockDescriptions[type] || type}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RepeatableTextItems({ title, items = [], defaultItem, fields, onChange }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const dropItem = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const next = [...items];
    const [item] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, item);
    onChange(next);
    setDraggedIndex(null);
  };

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
      <div className="mb-3 flex items-center justify-between">
        <FieldLabel className="mb-0">{title}</FieldLabel>
        <Button size="sm" variant="secondary" onClick={() => onChange([...items, { ...defaultItem }])}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropItem(index)}
            className="rounded-lg border border-border-default bg-surface-panel p-3"
          >
            <div className="mb-3 flex justify-end gap-1">
              <IconButton label="Subir" disabled={index === 0} onClick={() => moveItem(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
              <IconButton label="Bajar" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
            </div>
            <div className="grid gap-3">
              {fields.map((field) => (
                <TextField key={field} label={titleForType(field)} value={item[field]} onChange={(value) => updateItem(index, { [field]: value })} />
              ))}
              <label className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
                <input type="checkbox" checked={item.visible !== false} onChange={(event) => updateItem(index, { visible: event.target.checked })} />
                Visible
              </label>
              <Button size="sm" variant="danger-outline" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedJson({ block, onChange }) {
  void block;
  void onChange;
  return null;
}

function TextField({ label, value = '', onChange, marker }) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <Input data-landing-builder-field={marker} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AreaField({ label, value = '', onChange, marker }) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <Textarea data-landing-builder-field={marker} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

const isScrollableElement = (element) => {
  if (!element || element === document.body || element === document.documentElement) return false;
  const style = window.getComputedStyle(element);
  return /(auto|scroll)/.test(`${style.overflow}${style.overflowY}${style.overflowX}`)
    && (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
};

const captureScrollPositions = (origin) => {
  if (typeof window === 'undefined') return () => {};
  const entries = [{ element: window, top: window.scrollY, left: window.scrollX }];
  const scrollableElements = Array.from(document.querySelectorAll('*')).filter(isScrollableElement);
  const addElement = (node) => {
    if (isScrollableElement(node)) {
      entries.push({ element: node, top: node.scrollTop, left: node.scrollLeft });
    }
  };
  scrollableElements.forEach(addElement);
  let node = origin?.parentElement;
  while (node) {
    addElement(node);
    node = node.parentElement;
  }

  return () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entries.forEach(({ element, top, left }) => {
          if (element === window) {
            window.scrollTo(left, top);
          } else {
            element.scrollTop = top;
            element.scrollLeft = left;
          }
        });
      });
    });
  };
};

const verifyPublicAssetReachable = async (url) => {
  const resolvedUrl = resolvePublicAssetUrl(url);
  if (!resolvedUrl || /^https:\/\//i.test(resolvedUrl)) return true;
  const response = await fetch(resolvedUrl, { method: 'HEAD', cache: 'no-store' });
  if (response.ok) return true;
  const fallback = await fetch(resolvedUrl, { method: 'GET', cache: 'no-store' });
  return fallback.ok;
};

function MediaUploadField({ label, value = '', accept = 'image/*,video/*', onChange, marker }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [unavailableAssetValue, setUnavailableAssetValue] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(value || '');
  const resolvedValue = resolvePublicAssetUrl(value);
  const assetUnavailable = Boolean(value && unavailableAssetValue === value);
  const unavailableMessage = label === 'Avatar' ? 'El archivo ya no esta disponible. Vuelve a subir avatar.' : 'El archivo ya no esta disponible.';

  const uploadFile = async (file, origin) => {
    if (!file) return;
    const restoreScroll = captureScrollPositions(origin);
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/landing-assets', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || 'No se pudo subir el archivo.');
      }
      const nextUrl = payload?.data?.url || '';
      const reachable = await verifyPublicAssetReachable(nextUrl);
      if (!reachable) {
        throw new Error('El archivo se subio, pero no responde desde la URL publica.');
      }
      setUnavailableAssetValue('');
      onChange(nextUrl);
      restoreScroll();
    } catch (err) {
      setError(err.message || 'No se pudo subir el archivo.');
      restoreScroll();
    } finally {
      setUploading(false);
    }
  };

  const chooseFile = (event) => {
    event.preventDefault();
    fileInputRef.current?.click();
  };

  const clearFile = (event) => {
    event.preventDefault();
    const restoreScroll = captureScrollPositions(event.currentTarget);
    onChange('');
    restoreScroll();
  };

  const toggleUrl = (event) => {
    event.preventDefault();
    const restoreScroll = captureScrollPositions(event.currentTarget);
    setShowUrl((current) => !current);
    restoreScroll();
  };

  const updateUrl = (event) => {
    const restoreScroll = captureScrollPositions(event.currentTarget);
    setUnavailableAssetValue('');
    onChange(event.target.value);
    restoreScroll();
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mb-2 aspect-video min-h-28 overflow-hidden rounded-lg border border-border-default bg-surface-subtle">
        {value && !assetUnavailable ? isVideo ? (
          <video src={resolvedValue} className="h-full w-full object-cover" muted playsInline controls onError={() => setUnavailableAssetValue(value)} />
        ) : (
          <img src={resolvedValue} alt={label} className="h-full w-full object-cover" onError={() => setUnavailableAssetValue(value)} />
        ) : value && assetUnavailable ? (
          <div className="flex h-full min-h-28 flex-col items-center justify-center gap-2 px-4 text-center text-xs font-semibold text-status-danger">
            <span>{unavailableMessage}</span>
            <button type="button" onClick={chooseFile} className="font-black text-action-primary hover:underline">
              {label === 'Avatar' ? 'Volver a subir avatar' : 'Volver a subir archivo'}
            </button>
          </div>
        ) : (
          <div className="flex h-full min-h-28 items-center justify-center px-4 text-center text-xs font-semibold text-text-muted">
            Sin archivo seleccionado
          </div>
        )}
      </div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          uploadFile(event.dataTransfer.files?.[0], event.currentTarget);
        }}
        className="rounded-lg border border-dashed border-border-default bg-surface-panel transition hover:border-action-primary hover:text-action-primary"
      >
        <button
          type="button"
          disabled={uploading}
          onClick={chooseFile}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <UploadCloud className="h-4 w-4 shrink-0" />
            <span className="truncate">{uploading ? 'Subiendo...' : value ? 'Cambiar archivo' : 'Subir archivo'}</span>
          </span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={accept}
        disabled={uploading}
        onChange={(event) => {
          uploadFile(event.target.files?.[0], event.currentTarget);
          event.currentTarget.value = '';
        }}
      />
      {value ? <p className="mt-2 truncate rounded-lg bg-surface-subtle px-3 py-2 text-xs font-semibold text-text-secondary">{displayAssetName(value)}</p> : null}
      {value ? (
        <button type="button" onClick={clearFile} className="mt-2 mr-3 text-xs font-black text-status-danger hover:underline">
          Eliminar archivo
        </button>
      ) : null}
      <button type="button" onClick={toggleUrl} className="mt-2 text-xs font-black text-action-primary hover:underline">
        {showUrl ? 'Ocultar URL' : 'Usar URL'}
      </button>
      {showUrl ? (
        <Input
          data-landing-builder-field={marker}
          className="mt-2"
          value={value || ''}
          onChange={updateUrl}
          placeholder="Pega una URL de imagen o video"
        />
      ) : null}
      {error ? <p className="mt-1 text-xs font-semibold text-status-danger">{error}</p> : null}
    </div>
  );
}

function SliderField({ label, value, min, max, onChange, suffix = '' }) {
  return (
    <label>
      <div className="mb-1.5 flex items-center justify-between">
        <FieldLabel className="mb-0">{label}</FieldLabel>
        <span className="text-xs font-black text-text-muted">{value}{suffix}</span>
      </div>
      <input className="w-full accent-action-primary" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-[48px_1fr] gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 rounded-lg border border-border-default bg-surface-panel p-1" />
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function IconButton({ label, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border-default bg-surface-panel px-2 text-text-secondary transition hover:bg-surface-subtle hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function sortBlocks(blocks = []) {
  return [...blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function normalizeOrders(content) {
  content.blocks = sortBlocks(content.blocks).map((block, index) => ({ ...block, order: (index + 1) * 10 }));
  return content;
}

function initialDataForType(type) {
  const common = { title: blockLabels[type] || titleForType(type), body: '' };
  if (type === 'hero') return { ...common, variant: 'turagua_legacy', brandMode: 'business', subtitle: '', primaryCta: 'Agendar', secondaryCta: 'Ver servicios', promotions: [], stats: [] };
  if (type === 'catalog') return { ...common, subtitle: '', bookingSteps: [defaultStep] };
  if (type === 'about') return { ...common, eyebrow: 'Nosotros', features: [] };
  if (type === 'contact') {
    return {
      ...common,
      eyebrow: 'Contacto & Atencion',
      locationId: '',
      content: {
        eyebrow: 'Contacto & Atencion',
        title: 'Contacto',
        description: '',
        agendaEyebrow: 'Agenda digital',
        agendaTitle: 'Agenda tu cita al instante',
        agendaDescription: '',
        agendaButtonLabel: 'Agendar ahora',
        trustMessage: '',
        processTitle: 'Proceso Turagua',
        processSteps: [],
      },
      display: {
        showPhone: true,
        showEmail: true,
        showAddress: true,
        showHours: true,
        showMap: true,
        showDirectionsButton: true,
        mapStyle: 'editorial',
        mapZoom: '15',
      },
      addressLabel: 'Ubicacion del taller',
      phoneLabel: 'Atencion telefonica',
      emailLabel: 'Correo electronico',
      hoursLabel: 'Horarios de atencion',
    };
  }
  return common;
}

function titleForType(type = '') {
  return type.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function displayAssetName(value = '') {
  const clean = String(value).split('?')[0].split('#')[0];
  return clean.split('/').filter(Boolean).pop() || 'Archivo seleccionado';
}

function withPromoOffset(promo, patch, index) {
  const anchor = promo.position || promo.placement?.desktop?.anchor || 'bottom-left';
  return {
    ...(promo.placement || {}),
    desktop: {
      anchor,
      order: index,
      offsetX: 0,
      offsetY: 0,
      ...(promo.placement?.desktop || {}),
      ...patch,
    },
    mobile: {
      anchor: 'flow',
      order: index,
      ...(promo.placement?.mobile || {}),
    },
  };
}

function safeForeground(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#ffffff';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#111827' : '#ffffff';
}
