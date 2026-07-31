'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { agentSimRepository } from '@/lib/api/agentSimRepository';

const nextMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const conversationStorageKey = (businessSlug) => `demo_test_agent_conversation_${businessSlug || 'default'}`;
const stableConversationId = (businessSlug) => {
  const fallback = `web_${businessSlug}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  if (typeof window === 'undefined') return fallback;
  const key = conversationStorageKey(businessSlug);
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  window.sessionStorage.setItem(key, fallback);
  return fallback;
};

const initialWelcomeMessage = (agentName) =>
  `Hola, soy ${agentName}. Estoy aqui para ayudarte con servicios, dudas y reservas. ¿En que te ayudo?\nSi tienes una conversacion previa por favor, extenderme tu numero de telefono, dni o nombre, el dato que hayas agregado en tu anterior sesion.`;

const replyForState = (state, agentName) => {
  if (!state) return initialWelcomeMessage(agentName);
  return 'Estoy revisando tu solicitud. Dame un momento, por favor.';
};

const stateWithWorkflowId = (response, fallbackState = null) => {
  if (!response?.state && !response?.workflowId) return fallbackState;
  return {
    ...(fallbackState || {}),
    ...(response.state || {}),
    ...(response.workflowId ? { workflowId: response.workflowId } : {}),
  };
};

export function DemoTestAgentChat({
  businessSlug,
  agentName = 'Iris',
  initialOpen = false,
  initialMessage = '',
  open: controlledOpen,
  onOpenChange,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const [workflowState, setWorkflowState] = useState(null);
  const [conversationId] = useState(() => stableConversationId(businessSlug));
  const [messages, setMessages] = useState([
    {
      id: 'initial-welcome',
      role: 'assistant',
      text: initialWelcomeMessage(agentName),
    },
  ]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const seededInitialMessageRef = useRef('');

  const workflowId = workflowState?.workflowId;
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (value) => {
    setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  const statusCopy = useMemo(() => {
    if (!workflowState) return 'Conversando';
    if (workflowState.status === 'WAITING_FOR_SERVICE_SELECTION') return 'Servicios';
    if (workflowState.status === 'WAITING_FOR_CUSTOMER_DATA') return 'Datos';
    if (workflowState.status === 'CUSTOMER_DATA_VALIDATED') return 'Calendario';
    if (workflowState.status === 'WAITING_FOR_SLOT_SELECTION') return 'Horarios';
    if (workflowState.status === 'APPOINTMENT_BOOKED') return 'Cita lista';
    return 'Atendiendo';
  }, [workflowState]);

  const addMessage = useCallback((role, text, id = nextMessageId()) => {
    setMessages((current) => [...current, { id, role, text }]);
  }, []);

  const askAgent = useCallback(async ({ workflowId: activeWorkflowId, text, messageId }) => {
    setLoading(true);
    setError('');
    try {
      const correlationId = `${messageId || nextMessageId()}:corr`;
      const response = activeWorkflowId
        ? await agentSimRepository.message({ workflowId: activeWorkflowId, conversationId, message: text, messageId, correlationId })
        : await agentSimRepository.openMessage({ businessSlug, conversationId, message: text, messageId, correlationId });
      const nextState = stateWithWorkflowId(response, workflowState);
      if (nextState) {
        setWorkflowState(nextState);
      }
      addMessage('assistant', response.message || replyForState(nextState || workflowState, agentName));
      return response;
    } catch (err) {
      setError(err.message || 'No se pudo responder el mensaje.');
      addMessage('assistant', 'Te leo, pero no pude responder bien en este momento. Probemos otra vez.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addMessage, agentName, businessSlug, conversationId, workflowState]);

  const sendFreeMessage = useCallback(async (forcedText) => {
    const text = (forcedText ?? input).trim();
    if (!text) return;

    const messageId = nextMessageId();
    addMessage('user', text, messageId);
    setInput('');

    await askAgent({ workflowId, text, messageId });
  }, [addMessage, askAgent, input, workflowId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, workflowState]);

  useEffect(() => {
    if (!open || !initialMessage || seededInitialMessageRef.current === initialMessage || loading) {
      return;
    }
    seededInitialMessageRef.current = initialMessage;
    sendFreeMessage(initialMessage);
  }, [initialMessage, loading, open, sendFreeMessage]);

  const quickActions = useMemo(() => {
    return [];
  }, []);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-panel px-4 py-3 text-sm font-bold text-action-primary shadow-lg transition hover:bg-surface-subtle"
        >
          <MessageCircle className="h-4 w-4" />
          <Sparkles className="h-4 w-4" />
          Agendar con {agentName}
        </button>
      )}

      {open && (
        <aside className="fixed inset-x-3 bottom-3 z-50 flex h-[min(760px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-xl border border-border-default bg-surface-panel shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[min(460px,calc(100vw-2rem))]">
          <header className="flex items-center justify-between border-b border-border-subtle bg-surface-subtle px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-action-primary text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-text-primary">{agentName}</div>
                <div className="truncate text-xs text-text-secondary">{statusCopy}</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-text-secondary hover:bg-hover-row hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-app p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'border-action-primary bg-action-primary text-white'
                    : 'border-border-subtle bg-surface-panel text-text-primary'
                }`}>
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-panel px-4 py-3">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-border-danger bg-surface-danger p-3 text-sm text-text-danger">
                {error}
              </div>
            )}
          </div>

          <footer className="border-t border-border-subtle bg-surface-panel p-3">
            {!!quickActions.length && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled={loading}
                    onClick={() => sendFreeMessage(action)}
                    className="shrink-0 rounded-full border border-border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-action-primary/60 hover:text-action-primary disabled:opacity-60"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendFreeMessage();
                  }
                }}
                placeholder={`Escribele a ${agentName}...`}
                className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface-app px-3 py-2 text-sm text-text-primary outline-none focus:border-action-primary"
              />
              <Button type="button" size="icon" loading={loading} onClick={() => sendFreeMessage()} aria-label="Enviar mensaje">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        </aside>
      )}
    </>
  );
}
