'use client';

import { useMemo, useState } from 'react';
import { Check, History, RotateCcw, Save, Send, Smartphone, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { LandingPageRenderer } from './LandingPageRenderer';
import { LANDING_BLOCK_TYPES, cloneLandingContent, defaultLandingContent } from '@/lib/landing/landingContract';
import { landingRepository } from '@/lib/landing/landingRepository';

const queryKeyFor = (businessSlug, pageSlug) => ['landing-page', 'admin', businessSlug, pageSlug];

export function LandingAdminPage({ businessSlug = 'turagua', pageSlug = 'home' }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('desktop');
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeyFor(businessSlug, pageSlug),
    queryFn: () => landingRepository.getAdminLandingPage({ businessSlug, pageSlug }),
  });
  const [draft, setDraft] = useState(null);

  const landingPage = data?.landingPage;
  const editableDraft = draft || landingPage?.draft || defaultLandingContent;
  const previewPayload = useMemo(() => ({
    landingPage: {
      ...(landingPage || {}),
      businessSlug,
      pageSlug,
      published: editableDraft,
    },
    content: editableDraft,
    businessProfile: {
      businessSlug,
      businessName: 'Turagua Auto Services',
      brand: { displayName: 'Turagua' },
      agent: { name: 'Iris' },
    },
    catalogOfferings: [],
  }), [businessSlug, editableDraft, landingPage, pageSlug]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeyFor(businessSlug, pageSlug) });
  };

  const saveMutation = useMutation({
    mutationFn: () => landingRepository.saveDraft({ businessSlug, pageSlug, title: landingPage?.title || 'Turagua Landing', draft: editableDraft }),
    onSuccess: async (page) => {
      setMessage('Draft guardado.');
      setDraft(page?.draft || editableDraft);
      await refresh();
    },
    onError: (err) => setMessage(err.message || 'No se pudo guardar el draft.'),
  });

  const publishMutation = useMutation({
    mutationFn: () => landingRepository.publish({ businessSlug, pageSlug }),
    onSuccess: async () => {
      setMessage('Version publicada.');
      await refresh();
    },
    onError: (err) => setMessage(err.message || 'No se pudo publicar.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (version) => landingRepository.restore({ businessSlug, pageSlug, version }),
    onSuccess: async (page) => {
      setMessage('Version restaurada como draft.');
      setDraft(page?.draft || editableDraft);
      await refresh();
    },
    onError: (err) => setMessage(err.message || 'No se pudo restaurar la version.'),
  });

  const updateBlock = (blockId, patch) => {
    setMessage('');
    setDraft((current) => {
      const base = cloneLandingContent(current || editableDraft);
      base.blocks = base.blocks.map((block) => block.id === blockId ? { ...block, ...patch, data: { ...block.data, ...(patch.data || {}) } } : block);
      return base;
    });
  };

  const addBlock = (type) => {
    setDraft((current) => {
      const base = cloneLandingContent(current || editableDraft);
      const order = Math.max(0, ...base.blocks.map((block) => Number(block.order || 0))) + 10;
      base.blocks.push({
        id: `${type}_${Date.now()}`,
        type,
        enabled: true,
        order,
        data: { title: titleForType(type), body: '' },
      });
      return base;
    });
  };

  const removeBlock = (blockId) => {
    setDraft((current) => {
      const base = cloneLandingContent(current || editableDraft);
      base.blocks = base.blocks.filter((block) => block.id !== blockId);
      return base;
    });
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app text-text-secondary">Cargando builder...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app p-6 text-center text-text-secondary">No se pudo cargar el builder.</div>;
  }

  return (
    <main className="min-h-screen bg-surface-app text-text-primary">
      <header className="border-b border-border-default bg-surface-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black">Landing Builder</h1>
              <Badge estado={`v${landingPage?.publishedVersion || 0}`} variant="info" />
              <Badge estado={landingPage?.status || 'draft'} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">Draft, publicacion y restauracion sobre LandingPage/LandingPageVersion.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPreview(preview === 'desktop' ? 'mobile' : 'desktop')}>
              <Smartphone className="h-4 w-4" />
              {preview === 'desktop' ? 'Mobile' : 'Desktop'}
            </Button>
            <Button variant="secondary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              <Save className="h-4 w-4" />
              Guardar draft
            </Button>
            <Button loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[460px_1fr]">
        <section className="min-h-0 space-y-4">
          {message && <div className="rounded-lg border border-border-default bg-surface-panel p-3 text-sm font-semibold text-text-secondary">{message}</div>}

          <div className="rounded-lg border border-border-default bg-surface-panel p-4">
            <FieldLabel>Agregar bloque</FieldLabel>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Select id="landing-block-type" defaultValue="structured_content">
                {LANDING_BLOCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
              <Button onClick={() => addBlock(document.getElementById('landing-block-type')?.value || 'structured_content')}>Agregar</Button>
            </div>
          </div>

          <div className="space-y-3">
            {[...(editableDraft.blocks || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={(patch) => updateBlock(block.id, patch)}
                onRemove={() => removeBlock(block.id)}
              />
            ))}
          </div>

          <div className="rounded-lg border border-border-default bg-surface-panel p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <History className="h-4 w-4" />
              Versiones
            </div>
            <div className="space-y-2">
              {(data?.versions || []).map((version) => (
                <div key={version._id || version.version} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3">
                  <div>
                    <div className="text-sm font-bold">Version {version.version}</div>
                    <div className="text-xs text-text-muted">{version.action}</div>
                  </div>
                  <Button variant="secondary" size="sm" loading={restoreMutation.isPending} onClick={() => restoreMutation.mutate(version.version)}>
                    <RotateCcw className="h-4 w-4" />
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="min-h-[720px] overflow-hidden rounded-lg border border-border-default bg-surface-panel">
          <div className="flex min-h-11 items-center justify-between border-b border-border-default px-4">
            <span className="text-sm font-black">Preview {preview}</span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <Check className="h-4 w-4 text-status-success" />
              Registry validado
            </span>
          </div>
          <div className={`mx-auto h-[calc(100%-2.75rem)] overflow-y-auto ${preview === 'mobile' ? 'max-w-[390px]' : 'w-full'}`}>
            <LandingPageRenderer payload={previewPayload} />
          </div>
        </section>
      </div>
    </main>
  );
}

function BlockEditor({ block, onChange, onRemove }) {
  return (
    <section className="rounded-lg border border-border-default bg-surface-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black">{block.type}</div>
          <div className="text-xs text-text-muted">{block.id}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onChange({ enabled: !block.enabled })}>
            {block.enabled ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button variant="danger-outline" size="sm" onClick={onRemove} aria-label="Eliminar bloque">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <label>
          <FieldLabel>Orden</FieldLabel>
          <Input type="number" value={block.order || 0} onChange={(event) => onChange({ order: Number(event.target.value) })} />
        </label>
        <label>
          <FieldLabel>Titulo</FieldLabel>
          <Input value={block.data?.title || block.data?.eyebrow || ''} onChange={(event) => onChange({ data: { title: event.target.value, eyebrow: event.target.value } })} />
        </label>
        <label>
          <FieldLabel>Texto</FieldLabel>
          <Textarea value={block.data?.body || block.data?.subtitle || ''} onChange={(event) => onChange({ data: { body: event.target.value, subtitle: event.target.value } })} />
        </label>
      </div>
    </section>
  );
}

function titleForType(type) {
  return type.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
