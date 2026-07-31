'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { FactRow } from '@/components/shared/FactRow';
import { FieldLabel, Textarea } from '@/components/ui/Input';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { useAdminData } from '@/hooks/useAdminData';
import { adminMutationRepository } from '@/lib/admin/adminMutationRepository';
import {
  adminEmptyData,
  caseLabel,
  customerName,
  customerPhone,
  formatDateTime,
  indexById,
  variantForStatus,
} from '@/lib/admin/adminMappers';

const visibleConversationTypes = new Set([
  'customer_message',
  'agent_message',
  'agent_open_message',
  'agent_runtime_message',
  'manual_message',
]);

const isHermesTechnicalEvent = (interaction) => (
  String(interaction?.interactionType || '') === 'system_event'
  || String(interaction?.visibility || '') === 'internal'
  || /^Hermes\s/i.test(String(interaction?.body || interaction?.message || ''))
);

const isVisibleConversationMessage = (interaction) => (
  String(interaction?.visibility || 'customer') === 'customer'
  && visibleConversationTypes.has(String(interaction?.interactionType || ''))
  && !isHermesTechnicalEvent(interaction)
);

const interactionText = (interaction) =>
  interaction?.body || interaction?.message || interaction?.summary || interaction?.type || interaction?._id;

export function MessagesScreen() {
  const { profile } = useBusinessProfile();
  const { data = adminEmptyData, loading, error, reload, businessSlug } = useAdminData();
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [manualMessage, setManualMessage] = useState('');
  const [showConversationMobile, setShowConversationMobile] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const customersById = useMemo(() => indexById(data?.customers || []), [data?.customers]);
  const casesById = useMemo(() => indexById(data?.cases || []), [data?.cases]);

  const canonicalThreadKey = (interaction) => {
    const conversationId = String(interaction?.conversationId || '').trim();
    if (conversationId) return `${interaction.businessSlug || businessSlug}:${conversationId}`;
    return `case:${interaction?.caseId || interaction?.workflowId || interaction?._id}`;
  };

  const latestNonEmpty = (items, picker) => {
    const sorted = items.slice().sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    for (const item of sorted) {
      const value = picker(item);
      if (value !== undefined && value !== null && String(value).trim()) return value;
    }
    return undefined;
  };

  const threads = useMemo(() => {
    const grouped = new Map();
    (data?.customerInteractions || []).forEach((interaction) => {
      const key = canonicalThreadKey(interaction);
      grouped.set(key, [...(grouped.get(key) || []), interaction]);
    });

    const projected = [...grouped.entries()].map(([threadKey, interactions]) => {
      const chronological = interactions.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      const newestFirst = chronological.slice().reverse();
      const lastInteraction = newestFirst[0];
      const conversationId = latestNonEmpty(newestFirst, (item) => item.conversationId);
      const caseId = latestNonEmpty(newestFirst, (item) => {
        const value = String(item.caseId || '').trim();
        return value && value !== conversationId && value !== item.workflowId ? value : undefined;
      });
      const workflowIds = [...new Set(interactions.map((item) => item.workflowId || item.execution?.workflowId).filter(Boolean))];
      const customerId = latestNonEmpty(newestFirst, (item) => item.customerId);
      const caseItem = casesById.get(caseId);
      const customer = customersById.get(customerId || caseItem?.customerId);
      const resolvedCaseLabel = caseItem ? caseLabel(caseItem) : (caseId || workflowIds[0] || conversationId || threadKey);
      const resolvedName = customerName(customer);
      const resolvedPhone = customerPhone(customer);

      return {
        threadKey,
        conversationId,
        caseId,
        workflowIds,
        lastAt: lastInteraction?.createdAt || caseItem?.updatedAt || caseItem?.createdAt,
        label: resolvedCaseLabel,
        name: resolvedName === 'Sin cliente' ? 'Conversacion en curso' : resolvedName,
        phone: resolvedPhone === 'Sin telefono' ? (customerId || 'Sin customer aun') : resolvedPhone,
        customerId: customerId || caseItem?.customerId,
        status: lastInteraction?.status || caseItem?.status || 'Conversacion',
        channel: lastInteraction?.channel || 'web_agent',
        time: formatDateTime(lastInteraction?.createdAt || caseItem?.updatedAt || caseItem?.createdAt),
        interactions: chronological,
      };
    });

    const representedCases = new Set(projected.map((thread) => thread.caseId).filter(Boolean));
    const caseOnly = (data?.cases || [])
      .filter((caseItem) => !representedCases.has(caseItem._id))
      .map((caseItem) => {
        const customer = customersById.get(caseItem.customerId);
        return {
          threadKey: `case:${caseItem._id}`,
          conversationId: undefined,
          caseId: caseItem._id,
          workflowIds: [],
          lastAt: caseItem.updatedAt || caseItem.createdAt,
          label: caseLabel(caseItem),
          name: customerName(customer),
          phone: customerPhone(customer),
          customerId: caseItem.customerId,
          status: caseItem.status || 'Sin interaccion',
          channel: 'backend',
          time: formatDateTime(caseItem.updatedAt || caseItem.createdAt),
          interactions: [],
        };
      });

    return [...projected, ...caseOnly].sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  }, [businessSlug, casesById, customersById, data?.cases, data?.customerInteractions]);

  const allThreads = threads;
  const selected = allThreads.find((thread) => thread.threadKey === selectedCaseId) || allThreads[0];
  const selectedInteractions = (selected?.interactions || []).slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const messages = selectedInteractions.filter(isVisibleConversationMessage);
  const hermesEvents = selectedInteractions.filter(isHermesTechnicalEvent).slice(-16).reverse();
  const events = (data?.timelineEvents || []).filter((event) => event.caseId === selected?.caseId).slice(0, 12);

  const sendManualMessage = async () => {
    const body = manualMessage.trim();
    const targetCaseId = selected?.caseId || selected?.workflowIds?.[0] || selected?.conversationId;
    if (!body || !targetCaseId) return;

    setSending(true);
    setSendError('');
    try {
      await adminMutationRepository.createCustomerInteraction({
        businessSlug,
        caseId: targetCaseId,
        customerId: selected.customerId,
        conversationId: selected.conversationId,
        workflowId: selected.workflowIds?.[0],
        body,
      });
      setManualMessage('');
      await reload();
    } catch (messageError) {
      setSendError(messageError.message || 'No se pudo guardar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <StateBox>Cargando mensajes desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="h-full min-h-0 overflow-hidden">
      {!allThreads.length ? (
        <StateBox>No hay Cases o CustomerInteractions en backend.</StateBox>
      ) : (
        <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(240px,0.82fr)_minmax(360px,1.28fr)_minmax(260px,0.9fr)]">
          <Card className={`${showConversationMobile ? 'hidden xl:flex' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden`}>
            <CardHeader className="shrink-0 flex-row items-center justify-between gap-3 px-4 py-3">
              <CardTitle className="min-w-0 truncate text-sm">Hilos {profile.agent.name}</CardTitle>
              <Badge estado="Backend v3" variant="info" />
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {allThreads.map((thread) => (
                <button
                  key={thread.threadKey}
                  onClick={() => {
                    setSelectedCaseId(thread.threadKey);
                    setShowConversationMobile(true);
                  }}
                  className={`w-full min-w-0 rounded-lg border p-3 text-left ${selected?.threadKey === thread.threadKey ? 'border-action-primary bg-action-primary/5' : 'border-border-subtle bg-surface-panel hover:bg-hover-row'}`}
                >
                  <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-black text-text-primary">{thread.name}</div>
                      <div className="truncate text-[13px] font-semibold text-text-muted">{thread.channel} - {thread.time}</div>
                    </div>
                    <div className="shrink-0">
                      <Badge estado={thread.status} variant={variantForStatus(thread.status)} />
                    </div>
                  </div>
                  <div className="truncate text-[13px] font-bold text-action-primary">{thread.label}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className={`${showConversationMobile ? 'flex' : 'hidden xl:flex'} min-h-0 min-w-0 flex-col overflow-hidden`}>
            <CardHeader className="shrink-0 flex-row items-start justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowConversationMobile(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-panel text-text-secondary xl:hidden"
                aria-label="Volver a hilos"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm">Conversacion unificada - {profile.agent.name}</CardTitle>
                <p className="mt-1 truncate text-xs text-text-secondary sm:text-sm">{selected.name} - {selected.phone} - {selected.label}</p>
              </div>
              <div className="shrink-0">
                <Badge estado={selected.status} variant={variantForStatus(selected.status)} />
              </div>
            </CardHeader>
            <CardContent className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 p-3">
              <div className="min-h-0 space-y-3 overflow-y-auto rounded-lg border border-border-subtle bg-surface-subtle p-3">
                {messages.length ? messages.map((message) => {
                  const author = message.direction === 'outbound' ? profile.agent.name : selected.name;
                  const isAgent = author === profile.agent.name;
                  return (
                    <div key={message._id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] overflow-hidden rounded-lg border p-3 text-sm sm:max-w-[82%] ${isAgent ? 'border-action-primary/20 bg-status-info-soft text-text-primary' : 'border-border-subtle bg-surface-panel text-text-primary'}`}>
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold uppercase text-text-muted">
                          <span className="min-w-0 max-w-full truncate">{author}</span>
                          <span className="shrink-0">{formatDateTime(message.createdAt)} - {message.channel || 'backend'}</span>
                        </div>
                        <p className="break-words leading-6">{interactionText(message)}</p>
                      </div>
                    </div>
                  );
                }) : <StateBox>Sin CustomerInteractions para este case.</StateBox>}
              </div>
              <div className="shrink-0 rounded-lg border border-border-default bg-surface-panel p-3">
                <FieldLabel>Respuesta manual / {profile.agent.name}</FieldLabel>
                <Textarea
                  value={manualMessage}
                  onChange={(event) => setManualMessage(event.target.value)}
                  placeholder="Escribe una respuesta para guardarla en CustomerInteraction..."
                  className="min-h-[64px] max-h-28"
                />
                {sendError && (
                  <div className="mt-2 rounded border border-border-danger bg-surface-danger p-2 text-[13px] font-semibold text-text-danger">
                    {sendError}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button loading={sending} disabled={!manualMessage.trim()} onClick={sendManualMessage}>Guardar respuesta</Button>
                  <Button variant="outline" onClick={reload}>Actualizar hilo</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden min-h-0 min-w-0 flex-col overflow-hidden xl:flex">
            <CardHeader className="shrink-0 px-4 py-3">
              <CardTitle className="truncate text-sm">Timeline backend</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3">
                <FactRow label="Canal" value={selected.channel} strong />
                <FactRow label="Cliente" value={selected.phone} />
                <FactRow label="Case" value={selected.label} />
                <FactRow label="Estado" value={selected.status} strong />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wide text-text-muted">Decisiones Hermes</div>
                {hermesEvents.map((event) => (
                  <div key={event._id} className="min-w-0 rounded-lg border border-border-subtle bg-surface-panel p-3">
                    <div className="break-words text-xs font-bold uppercase text-text-muted">{formatDateTime(event.createdAt)} - {event.interactionType || 'system_event'}</div>
                    <div className="mt-1 break-words text-sm font-semibold text-text-primary">{interactionText(event)}</div>
                  </div>
                ))}
                {!hermesEvents.length && <StateBox>Sin eventos internos de Hermes para este hilo.</StateBox>}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wide text-text-muted">Timeline operacional</div>
                {events.map((event) => (
                  <div key={event._id} className="min-w-0 rounded-lg border border-border-subtle bg-surface-panel p-3">
                    <div className="break-words text-xs font-bold uppercase text-text-muted">{formatDateTime(event.createdAt)} - {event.eventType || event.type}</div>
                    <div className="mt-1 break-words text-sm font-semibold text-text-primary">{event.description || event.summary || event._id}</div>
                  </div>
                ))}
                {!events.length && <StateBox>Sin TimelineEvents para este case.</StateBox>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StateBox({ children, danger }) {
  return (
    <div className={`rounded-lg border p-4 text-sm font-semibold ${danger ? 'border-border-danger bg-surface-danger text-text-danger' : 'border-border-subtle bg-surface-panel text-text-secondary'}`}>
      {children}
    </div>
  );
}
