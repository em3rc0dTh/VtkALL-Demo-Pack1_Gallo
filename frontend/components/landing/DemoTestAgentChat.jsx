'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { agentSimRepository } from '@/lib/api/agentSimRepository';
import { resolvePublicAssetUrl } from '@/lib/assets/publicAssetUrl';

const nextMessageId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const conversationStorageKey = (businessSlug) => `demo_test_agent_conversation_${businessSlug || 'default'}`;
const introPushDismissedKey = (businessSlug) => `demo_test_agent_intro_push_dismissed_${businessSlug || 'default'}`;
const stableConversationId = (businessSlug) => {
  const fallback = `web_${businessSlug}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  if (typeof window === 'undefined') return fallback;
  const key = conversationStorageKey(businessSlug);
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  window.sessionStorage.setItem(key, fallback);
  return fallback;
};

const defaultIrisAvatarUrl = 'https://i.ibb.co/84r9sJc/imagen-2026-06-08-153923818.png';

const chatTime = () =>
  new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

const initialWelcomeMessage = (agentName, businessName = 'Turagua Racing Peru') =>
  `¡Hola! 👋 Soy ${agentName} de ${businessName}. \n¿En qué puedo ayudarte hoy? 😊`;

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
  businessName = 'Turagua Racing Peru',
  avatarUrl = defaultIrisAvatarUrl,
  bannerUrl = '',
  logoUrl = '',
  welcomeMessage = '',
  agentNameColor = '#0f172a',
  avatarAlignment = 'left',
  initialOpen = false,
  initialMessage = '',
  open: controlledOpen,
  onOpenChange,
  introPush = true,
  launcher = true,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const [workflowState, setWorkflowState] = useState(null);
  const [conversationId] = useState(() => stableConversationId(businessSlug));
  const [messages, setMessages] = useState([
    {
      id: 'initial-welcome',
      role: 'assistant',
      text: welcomeMessage || initialWelcomeMessage(agentName, businessName),
      time: chatTime(),
    },
  ]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIntroPush, setShowIntroPush] = useState(false);
  const [introPushHovered, setIntroPushHovered] = useState(false);
  const scrollRef = useRef(null);
  const seededInitialMessageRef = useRef('');
  const introDismissedRef = useRef(false);

  const workflowId = workflowState?.workflowId;
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (value) => {
    if (value) {
      introDismissedRef.current = true;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(introPushDismissedKey(businessSlug), '1');
      }
      setShowIntroPush(false);
    }
    setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  const banner = resolvePublicAssetUrl(bannerUrl || logoUrl || '/images/turagua.jpg');
  const avatar = resolvePublicAssetUrl(avatarUrl || defaultIrisAvatarUrl);
  const avatarPositionClass = avatarAlignment === 'center' ? 'left-1/2 -translate-x-1/2' : avatarAlignment === 'right' ? 'right-5' : 'left-5';
  const statusPositionClass = avatarAlignment === 'center' ? 'justify-center' : avatarAlignment === 'right' ? 'mr-24 justify-end' : 'ml-24 justify-start';

  const addMessage = useCallback((role, text, id = nextMessageId()) => {
    setMessages((current) => [...current, { id, role, text, time: chatTime() }]);
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

  useEffect(() => {
    if (open || !introPush) {
      const clearTimer = window.setTimeout(() => setShowIntroPush(false), 0);
      return () => window.clearTimeout(clearTimer);
    }

    const dismissed = window.sessionStorage.getItem(introPushDismissedKey(businessSlug)) === '1';
    if (dismissed || introDismissedRef.current) return undefined;

    const showTimer = window.setTimeout(() => {
      if (document.querySelector('[role="dialog"], [data-cookie-banner], [data-modal-open="true"]')) return;
      setShowIntroPush(true);
    }, 4200);

    return () => {
      window.clearTimeout(showTimer);
    };
  }, [businessSlug, introPush, open]);

  useEffect(() => {
    if (!showIntroPush || introPushHovered) return undefined;
    const hideTimer = window.setTimeout(() => setShowIntroPush(false), 12000);
    return () => window.clearTimeout(hideTimer);
  }, [introPushHovered, showIntroPush]);

  const dismissIntroPush = () => {
    introDismissedRef.current = true;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(introPushDismissedKey(businessSlug), '1');
    }
    setShowIntroPush(false);
  };

  const quickActions = useMemo(() => {
    return [];
  }, []);

  return (
    <>
      {!open && launcher && (
        <>
          {showIntroPush && (
            <div
              data-agent-intro-push="iris"
              className="landing-iris-push fixed bottom-[92px] right-6 z-40 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-white/80 bg-white/92 text-slate-700 shadow-xl shadow-slate-900/12 backdrop-blur max-sm:bottom-[84px] max-sm:left-4 max-sm:right-4 max-sm:w-auto"
              onMouseEnter={() => setIntroPushHovered(true)}
              onMouseLeave={() => setIntroPushHovered(false)}
              onFocus={() => setIntroPushHovered(true)}
              onBlur={() => setIntroPushHovered(false)}
            >
              <button
                type="button"
                onClick={dismissIntroPush}
                className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Cerrar aviso de Iris"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="pointer-events-none absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-white/80 bg-white/92 shadow-sm max-sm:right-9" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative flex w-full items-start gap-3 rounded-2xl px-4 py-4 pr-11 text-left transition hover:bg-sky-50/55 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <span className="relative shrink-0">
                  <img src={avatar} alt={agentName} className="h-11 w-11 rounded-full border-2 border-white bg-white object-cover shadow-md ring-1 ring-sky-100" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black leading-tight text-slate-950">Hola, soy {agentName}</span>
                  <span className="mt-1.5 block text-[13px] leading-5 text-slate-600">
                    Puedo orientarte sobre los servicios y ayudarte a agendar una cita.
                  </span>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-black text-sky-500">
                    Abrir chat
                    <span aria-hidden="true">→</span>
                  </span>
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="landing-iris-launcher fixed bottom-5 right-5 z-40 inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl shadow-sky-900/20 ring-4 ring-white transition hover:bg-sky-600 focus:outline-none focus:ring-sky-200"
            aria-label={`Abrir chat con ${agentName}`}
          >
            <MessageCircle className="h-7 w-7 fill-white/15" />
            <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-300" />
          </button>
        </>
      )}

      {open && (
        <aside className="landing-iris-chat fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[360px]">
          <header className="relative h-[134px] shrink-0 border-b border-slate-200 bg-white">
            <div className="relative h-20 overflow-hidden bg-slate-950">
              {banner ? (
                <img src={banner} alt={`${businessName} banner`} className="h-full w-full object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-slate-800"
                aria-label="Cerrar chat"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-10 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white"
                aria-label="Expandir chat"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <div className={`absolute top-12 ${avatarPositionClass}`}>
              <div className="relative">
                <img src={avatar} alt={agentName} className="h-16 w-16 rounded-full border-4 border-white bg-white object-cover shadow-lg" />
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="mx-auto -mt-1 w-max rounded-md bg-white px-2 py-0.5 text-[11px] font-black shadow-sm" style={{ color: agentNameColor }}>{agentName}</div>
            </div>
            <div className={`flex h-[54px] items-center gap-2 pt-1 ${statusPositionClass}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-slate-500">Activo ahora</span>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`landing-chat-message max-w-[82%] px-4 py-3 text-sm leading-5 shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-[18px] rounded-tr-md bg-sky-500 text-white'
                    : 'rounded-[16px] border border-slate-200 bg-white text-slate-700'
                }`}>
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  <div className={`mt-1 text-right text-[10px] ${message.role === 'user' ? 'text-sky-100' : 'text-slate-400'}`}>{message.time}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <footer className="border-t border-slate-200 bg-white p-3">
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
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sky-500 transition hover:bg-sky-50" aria-label="Adjuntar archivo">
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendFreeMessage();
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner outline-none placeholder:text-slate-400 focus:border-sky-400"
              />
              <Button type="button" size="icon" loading={loading} onClick={() => sendFreeMessage()} aria-label="Enviar mensaje" className="h-11 w-11 rounded-full bg-sky-500 hover:bg-sky-600">
                <Send className="h-5 w-5 fill-white/20" />
              </Button>
            </div>
          </footer>
        </aside>
      )}
    </>
  );
}
