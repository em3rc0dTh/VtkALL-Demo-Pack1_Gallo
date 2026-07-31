import { ScheduleConsultationState } from '../temporal/types';
import { BusinessProfile } from '../models/BusinessProfile.model';
import { CustomerInteraction } from '../models/CustomerInteraction.model';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AgentReply = {
  provider: 'gemini' | 'ollama' | 'default';
  model?: string;
  message: string;
};

const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const MODELOS_FALLBACK = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b'
];
const DEFAULT_OLLAMA_MODEL = 'llama3.2:1b';
const DEFAULT_GEMINI_TIMEOUT_MS = 1600;
const DEFAULT_OLLAMA_TIMEOUT_MS = 1200;
const FORBIDDEN_CLIENT_TERMS = [
  'workflow',
  'endpoint',
  'api',
  'payload',
  'provider',
  'base de datos',
  'temporal',
  'id del workflow',
  'schedule-consultation-',
];

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const normalizeForIntent = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isServiceCatalogQuestion = (message: string) =>
  /\b(servicio|servicios|catalogo|opciones|ofrecen|ofreces|tienen|tienes|consulta|diagnostico|mantenimiento|revision)\b/.test(
    normalizeForIntent(message)
  );

const isServiceSelectionMessage = (message: string) => {
  const normalized = normalizeForIntent(message).trim();
  return /^\d+$/.test(normalized) ||
    /\b(quiero|me gusta|me sirve|elijo|escojo|vamos con|reservar|reserva|reservacion|cita|separar|ese servicio|el servicio|esa opcion|opcion)\b/.test(normalized);
};

const isBookingRequest = (message: string) =>
  /\b(reservar|reserva|reservacion|cita|agendar|agenda|turno|separar)\b/.test(normalizeForIntent(message));

const isServiceDetailQuestion = (message: string) =>
  /\b(en que consiste|que incluye|explicame|detalle|detalles|de que trata|como funciona)\b/.test(normalizeForIntent(message));

const isPriceQuestion = (message: string) =>
  /\b(precio|cuesta|costo|vale|tarifa|cobra|cobran)\b/.test(normalizeForIntent(message));

const isDurationQuestion = (message: string) =>
  /\b(cuanto demora|cuanto dura|duracion|demora|dura|tiempo|minutos|horas)\b/.test(normalizeForIntent(message));

const isComparisonQuestion = (message: string) =>
  /\b(compara|comparar|diferencia|diferencias|mejor|conviene|versus|vs)\b/.test(normalizeForIntent(message));

const isOutOfCatalogRequest = (message: string) => {
  const normalized = normalizeForIntent(message);
  return /\b(chaufa|comida|cocina|receta|arroz|pollo|postre)\b/.test(normalized) && !isBookingRequest(message);
};

const formatPrice = (offering: any) => {
  const display = offering?.price?.display || offering?.priceLabel || offering?.price;
  if (display) return String(display);

  const policy = offering?.pricingPolicy || {};
  const amount = policy.amount ?? policy.fromAmount ?? policy.baseAmount;
  if (amount !== undefined && amount !== null && amount !== '') {
    return `${policy.currency || ''} ${amount}`.trim();
  }

  return 'sin precio publicado';
};

const formatDuration = (offering: any) => {
  const duration = offering?.durationMinutes || offering?.fulfillmentPolicy?.estimatedDurationMinutes;
  return duration ? `${duration} min aprox.` : 'duracion segun disponibilidad';
};

type CatalogPresentationMode = 'names_only' | 'short_summary' | 'price' | 'duration' | 'price_and_duration';

const formatOfferingForAgent = (offering: any, index: number, mode: CatalogPresentationMode = 'short_summary') => {
  const name = offering?.name || offering?._id || `Servicio ${index + 1}`;
  const description = String(offering?.description || '').trim();
  if (mode === 'price') return `${index + 1}. ${name}: ${formatPrice(offering)}`;
  if (mode === 'duration') return `${index + 1}. ${name}: ${formatDuration(offering)}`;
  if (mode === 'price_and_duration') return `${index + 1}. ${name}: ${formatPrice(offering)}, ${formatDuration(offering)}`;
  if (mode === 'names_only' || !description) return `${index + 1}. ${name}`;
  return `${index + 1}. ${name} - ${description}`;
};

const hasVisibleCatalog = (state: ScheduleConsultationState) => Array.isArray(state.catalog) && state.catalog.length > 0;

const findCatalogOfferingIdFromMessage = (state: ScheduleConsultationState, message: string) => {
  if (!hasVisibleCatalog(state)) return undefined;

  const normalized = normalizeForIntent(message).trim();
  const numericChoice = normalized.match(/^\s*(\d+)\s*$/);
  if (numericChoice) {
    const index = Number(numericChoice[1]) - 1;
    const offering = state.catalog[index];
    if (offering?._id) return String(offering._id);
  }

  const directMatch = state.catalog.find((offering: any) => {
    const id = normalizeForIntent(String(offering?._id || ''));
    const name = normalizeForIntent(String(offering?.name || ''));
    return (id && normalized.includes(id)) || (name && normalized.includes(name));
  });
  if (directMatch?._id) return String(directMatch._id);

  if (state.catalog.length === 1 && isServiceSelectionMessage(message)) {
    return String(state.catalog[0]._id);
  }

  return undefined;
};

const timeoutMs = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  console.log(`[fetchWithTimeout] URL: ${url} | Timeout MS: ${ms}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.log(`[fetchWithTimeout] ABORTING ${url} after ${ms}ms!!!`);
    controller.abort();
  }, ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || '';
  const trimmed = apiKey.trim();
  if (!trimmed || ['YOUR_GEMINI_API_KEY', 'YOUR_GCP_API_KEY'].includes(trimmed)) {
    return undefined;
  }
  return trimmed;
};

const stateSummary = (state: ScheduleConsultationState) => {
  const catalog = state.catalog
    .map((offering: any, index: number) => formatOfferingForAgent(offering, index))
    .join('\n');
  const requiredFields = state.requiredFields
    .map((field: any) => `${field.label || field.key}${field.required ? ' requerido' : ' opcional'}`)
    .join(', ');
  const slots = state.availableSlots
    .slice(0, 5)
    .map((slot: any, index) => `${index + 1}. ${slot.startAt} ${slot.durationMinutes}min`)
    .join('\n');

  return [
    `status: ${state.status}`,
    `instruccion_del_sistema: ${state.agentInstruction || 'Sigue la conversacion normalmente.'}`,
    `selectedOffering: ${state.selectedOffering?.name || 'ninguno'}`,
    `requiredFields: ${requiredFields || 'ninguno'}`,
    `catalog:\n${catalog || 'sin catalogo'}`,
    `availableSlots:\n${slots || 'sin horarios visibles'}`,
  ].join('\n');
};

const buildSystemPrompt = async (state: ScheduleConsultationState) => {
  const profile: any = await BusinessProfile.findOne({ businessSlug: state.businessSlug }).lean();
  
  const nombreAgente = profile?.agent?.role || 'asistente especialista';
  const nombreNegocio = profile?.businessName || 'el negocio';

  return `ERES ${nombreAgente} de ${nombreNegocio}.
Tu UNICO proposito es responder usando la 'instruccion_del_sistema' y el 'catalog'.

REGLAS:
- Tu nombre es "Agente virtual". Si el usuario te pregunta por tu nombre o identidad, presentate amablemente como el Agente virtual de ${nombreNegocio}. No asumas otras identidades.
- Eres amable, pero muy breve (maximo 2 oraciones).
- NO menciones cosas tecnicas (Temporal, API, bases de datos).
- Si el catalog tiene uno o mas servicios, NUNCA digas que no hay servicios disponibles.
- Si el cliente pregunta por servicios en general, responde solo con nombres y descripcion breve.
- Menciona precio solo si el cliente pregunta por precio o compara servicios.
- Menciona duracion solo si el cliente pregunta por duracion, compara servicios o ya estas explicando/confirmando una reserva.
- Si el cliente pide algo fuera del catalogo, responde breve y redirige al dominio del negocio sin listar precio ni duracion.

Estado actual:
${stateSummary(state)}`;
};

const defaultReply = (state: ScheduleConsultationState): string => {
  if (state.status === 'WAITING_FOR_SERVICE_SELECTION') {
    const offerings = state.catalog.map((offering: any, index: number) => formatOfferingForAgent(offering, index));
    return offerings.length
      ? `Tenemos disponible:\n${offerings.join('\n')}\nPuedo revisar disponibilidad para la opcion que prefieras.`
      : 'Aun no tengo servicios disponibles para mostrarte. Intenta nuevamente en un momento.';
  }

  if (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
    const fields = state.requiredFields.map((field: any) => field.label || field.key);
    return `Perfecto. Para separar tu cita necesito estos datos: ${fields.join(', ')}.`;
  }

  if (state.status === 'CUSTOMER_DATA_VALIDATED') {
    return 'Perfecto, ya tengo tus datos. Te muestro el calendario para elegir un horario disponible.';
  }

  if (state.status === 'WAITING_FOR_SLOT_SELECTION') {
    if (!state.availableSlots.length) {
      return 'No hay horarios disponibles para ese filtro. Podemos probar con otra fecha.';
    }
    return 'Tengo horarios disponibles para esa fecha. Elige el horario que prefieras en la lista.';
  }

  if (state.status === 'APPOINTMENT_BOOKED') {
    return 'Listo, tu cita quedo confirmada. Te esperamos en el horario seleccionado.';
  }

  if (state.status.startsWith('FAILED')) {
    return `No puedo completar ese paso todavia: ${state.errors.join('; ') || state.agentInstruction}`;
  }

  return state.agentInstruction || 'Estoy revisando el estado del workflow.';
};

const serviceCatalogReply = (state: ScheduleConsultationState) =>
  `Tenemos disponible:\n${state.catalog.map((offering: any, index: number) => formatOfferingForAgent(offering, index, 'short_summary')).join('\n')}\nSi quieres, reviso disponibilidad para reservar.`;

const serviceDetailReply = (state: ScheduleConsultationState) => {
  const offering = state.selectedOffering || state.catalog[0];
  const name = offering?.name || 'este servicio';
  const duration = formatDuration(offering);
  const price = formatPrice(offering);
  return `${name} es una consulta inicial para entender tu necesidad, revisar disponibilidad y dejar encaminada la reserva. Precio: ${price}; duracion: ${duration}.`;
};

const findCatalogOfferingFromMessage = (state: ScheduleConsultationState, message: string) => {
  const normalized = normalizeForIntent(message);
  return state.catalog.find((offering: any) => {
    const nameTokens = normalizeForIntent(String(offering?.name || ''))
      .split(/\s+/)
      .filter((token) => token.length > 4);
    const descriptionTokens = normalizeForIntent(String(offering?.description || ''))
      .split(/\s+/)
      .filter((token) => token.length > 4);
    return [...nameTokens, ...descriptionTokens].some((token) => normalized.includes(token));
  }) || state.selectedOffering || state.catalog[0];
};

const catalogAttributeReply = (state: ScheduleConsultationState, userMessage: string) => {
  const offering = findCatalogOfferingFromMessage(state, userMessage);
  const name = offering?.name || 'este servicio';
  if (isComparisonQuestion(userMessage)) {
    return `${name}: ${formatPrice(offering)}, ${formatDuration(offering)}.`;
  }
  if (isPriceQuestion(userMessage)) {
    return `${name}: ${formatPrice(offering)}.`;
  }
  return `${name}: ${formatDuration(offering)}.`;
};

const outOfCatalogReply = (state: ScheduleConsultationState) =>
  hasVisibleCatalog(state)
    ? `No, no ofrecemos comida. Somos un taller automotriz y puedo ayudarte con ${state.catalog.map((offering: any) => offering.name || offering._id).slice(0, 6).join(', ')}. Que necesitas revisar en tu vehiculo?`
    : 'Te puedo ayudar con reservas y servicios del negocio, pero ahora mismo no tengo un catalogo cargado para mostrarte.';

const isClientSafeMessage = (message: string) => {
  const normalized = message.toLowerCase();
  return !FORBIDDEN_CLIENT_TERMS.some((term) => normalized.includes(term));
};

const saysNoServices = (message: string) => {
  const normalized = normalizeForIntent(message);
  return /no (hay|tengo|tenemos).{0,40}servicios?/.test(normalized) || /servicios? disponibles?.{0,40}(no|ningun)/.test(normalized);
};

const refusesReservation = (message: string) => {
  const normalized = normalizeForIntent(message);
  return /no puedo.{0,50}(reserv|agend|cita)/.test(normalized) || /usa.{0,40}aplicacion/.test(normalized);
};

const llamarCompletionsConFallback = async (apiKey: string, messages: ChatMessage[], responseFormat?: any) => {
  let ultimoError = null;
  const timeout = timeoutMs(process.env.GEMINI_TIMEOUT_MS, 4000); // 4s timeout para fallback
  
  for (const modelo of MODELOS_FALLBACK) {
    try {
      console.log(`🤖 [Gemini API] Intentando llamada con modelo: ${modelo}...`);
      
      const body: any = {
        model: modelo,
        messages,
        temperature: 0.2,
      };
      if (responseFormat) {
        body.response_format = responseFormat;
      }

      const response = await fetchWithTimeout(`${GEMINI_OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, timeout);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`GEMINI_PROVIDER_ERROR_${response.status} - ${errText}`);
      }

      const payload: any = await response.json();
      const text = payload?.choices?.[0]?.message?.content?.trim();
      
      console.log(`✅ [Gemini API] Éxito en llamada utilizando modelo: ${modelo}`);
      return { text, modelo };
    } catch (err: any) {
      ultimoError = err;
      console.warn(`⚠️ [Gemini API] Error al llamar con modelo ${modelo}: ${err.message}. Probando el siguiente...`);
    }
  }
  
  throw ultimoError || new Error("Todos los modelos de Gemini fallaron (Rate Limits/Network).");
};

const callGemini = async (messages: ChatMessage[]): Promise<AgentReply | undefined> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return undefined;
  }

  const result = await llamarCompletionsConFallback(apiKey, messages);
  const message = result.text;
  return message && isClientSafeMessage(message) ? { provider: 'gemini', model: result.modelo, message } : undefined;
};

const callOllama = async (messages: ChatMessage[]): Promise<AgentReply | undefined> => {
  const ollamaUrl = process.env.OLLAMA_URL?.trim();
  if (!ollamaUrl) {
    return undefined;
  }

  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const response = await fetchWithTimeout(`${normalizeBaseUrl(ollamaUrl)}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
  }, timeoutMs(process.env.OLLAMA_TIMEOUT_MS, DEFAULT_OLLAMA_TIMEOUT_MS));

  if (!response.ok) {
    throw new Error(`OLLAMA_PROVIDER_ERROR_${response.status}`);
  }

  const payload: any = await response.json();
  const message = payload?.message?.content?.trim();
  return message && isClientSafeMessage(message) ? { provider: 'ollama', model, message } : undefined;
};

export const generateAgentReply = async (state: ScheduleConsultationState, userMessage: string): Promise<AgentReply> => {
  if (isOutOfCatalogRequest(userMessage)) {
    return {
      provider: 'default',
      message: outOfCatalogReply(state),
    };
  }

  if (hasVisibleCatalog(state) && isServiceDetailQuestion(userMessage)) {
    return {
      provider: 'default',
      message: serviceDetailReply(state),
    };
  }

  if (hasVisibleCatalog(state) && (isPriceQuestion(userMessage) || isDurationQuestion(userMessage) || isComparisonQuestion(userMessage))) {
    return {
      provider: 'default',
      message: catalogAttributeReply(state, userMessage),
    };
  }

  if (isBookingRequest(userMessage) && ['WAITING_FOR_CUSTOMER_DATA', 'CUSTOMER_DATA_VALIDATED', 'WAITING_FOR_SLOT_SELECTION'].includes(state.status)) {
    return {
      provider: 'default',
      message: defaultReply(state),
    };
  }

  if (state.status === 'WAITING_FOR_CUSTOMER_DATA' && isServiceSelectionMessage(userMessage)) {
    return {
      provider: 'default',
      message: defaultReply(state),
    };
  }

  if (hasVisibleCatalog(state) && state.status === 'WAITING_FOR_SERVICE_SELECTION' && isServiceCatalogQuestion(userMessage) && !findCatalogOfferingIdFromMessage(state, userMessage)) {
    return {
      provider: 'default',
      message: serviceCatalogReply(state),
    };
  }

  const systemContent = await buildSystemPrompt(state);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
  ];

  // Load previous messages for this workflow to maintain conversation context
  if (state.workflowId) {
    try {
      const history = await CustomerInteraction.find({ workflowId: state.workflowId })
        .sort({ createdAt: 1 })
        .limit(15)
        .lean();

      for (const msg of history) {
        const actor = (msg as any).actorType;
        const body = (msg as any).body || (msg as any).message || '';
        if (!body) continue;
        
        const role = actor === 'customer' ? 'user' : actor === 'agent' ? 'assistant' : 'system';
        if (role === 'system') continue; // Avoid contaminating dialog with system events
        
        messages.push({ role, content: body });
      }
    } catch (e) {
      console.warn('[agent-ai] Failed to load conversation history from db:', e);
    }
  }

  // Ensure current message is appended as the latest user turn
  messages.push({ role: 'user', content: userMessage || 'Redacta el siguiente mensaje para el cliente.' });

  try {
    const geminiReply = await callGemini(messages);
    if (geminiReply) {
      if (hasVisibleCatalog(state) && saysNoServices(geminiReply.message)) {
        return { provider: 'default', message: serviceCatalogReply(state) };
      }
      if (isBookingRequest(userMessage) && refusesReservation(geminiReply.message)) {
        return { provider: 'default', message: defaultReply(state) };
      }
      return geminiReply;
    }
  } catch (error) {
    console.warn('[agent-ai] Gemini unavailable, trying Ollama fallback.', error);
  }

  try {
    const ollamaReply = await callOllama(messages);
    if (ollamaReply) {
      if (hasVisibleCatalog(state) && saysNoServices(ollamaReply.message)) {
        return { provider: 'default', message: serviceCatalogReply(state) };
      }
      if (isBookingRequest(userMessage) && refusesReservation(ollamaReply.message)) {
        return { provider: 'default', message: defaultReply(state) };
      }
      return ollamaReply;
    }
  } catch (error) {
    console.warn('[agent-ai] Ollama unavailable, using default message fallback.', error);
  }

  return {
    provider: 'default',
    message: defaultReply(state),
  };
};

export const extractIntentsFromMessage = async (state: ScheduleConsultationState, userMessage: string) => {
  if (!userMessage?.trim()) return null;
  const deterministicOfferingId = findCatalogOfferingIdFromMessage(state, userMessage);
  if (deterministicOfferingId && state.status === 'WAITING_FOR_SERVICE_SELECTION') {
    return {
      intent: {
        selectCatalogOfferingId: deterministicOfferingId,
      },
    };
  }

  const profile: any = await BusinessProfile.findOne({ businessSlug: state.businessSlug }).lean();
  
  const systemPrompt = `Eres un extractor semantico para el negocio ${profile?.businessName || state.businessSlug} (${profile?.verticalType || ''}).
Dado el mensaje del cliente, tu objetivo es extraer los parametros relevantes segun el estado actual.
Responde unicamente con un JSON valido con esta estructura (omite las propiedades que el cliente no haya mencionado):
{
  "intent": {
    "selectCatalogOfferingId": "ID_DEL_SERVICIO (busca el id exacto en el catalogo proporcionado)"
  },
  "customerData": {
    "firstName": "nombre",
    "lastName": "apellido",
    "phone": "telefono",
    "managedEntityDisplayName": "nombre del vehiculo, equipo o propiedad",
    "managedEntitySummary": "resumen del problema"
  },
  "scheduling": {
    "preferredDate": "YYYY-MM-DD",
    "selectSlotId": "ID_DEL_SLOT (busca el id exacto en slots disponibles)"
  }
}

Contexto actual del negocio:
Catálogo de servicios: ${state.catalog.map((c: any) => `${c._id}: ${c.name}`).join(', ')}
Slots disponibles: ${state.availableSlots.map((s: any) => `${s._id}: ${s.startAt} (${s.durationMinutes}min)`).join(', ')}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const result = await llamarCompletionsConFallback(apiKey, messages, { type: "json_object" });
      const text = result.text;
      if (text) return JSON.parse(text);
    } catch (error) {
      console.warn('[agent-ai] Gemini failed for intents, falling back to Ollama:', error);
    }
  }

  // Fallback to Ollama
  const ollamaUrl = process.env.OLLAMA_URL?.trim();
  if (!ollamaUrl) return null;

  try {
    const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
    const response = await fetchWithTimeout(`${normalizeBaseUrl(ollamaUrl)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: 'json',
        options: { temperature: 0.1 }
      })
    }, timeoutMs(process.env.OLLAMA_TIMEOUT_MS, DEFAULT_OLLAMA_TIMEOUT_MS));

    if (!response.ok) throw new Error(`Ollama JSON extraction failed: ${response.status}`);
    const payload: any = await response.json();
    const text = payload?.message?.content?.trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.warn('[agent-ai] Error extracting intents with Ollama:', error);
    return null;
  }
};
