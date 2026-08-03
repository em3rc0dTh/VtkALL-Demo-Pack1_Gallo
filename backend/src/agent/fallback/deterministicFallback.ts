import { AgentContext } from '../context/agentContext';
import { AgentDecision, AgentDecisionAction } from '../runtime/agentDecision';
import { HermesReadOnlyContext } from '../hermes/context/hermesContext.contract';
import {
  buildAutomotiveGuidanceReply,
  buildExternalDomainReply,
  classifyHermesSemanticTurn,
  isAutomotiveSemanticIntent,
} from '../hermes/routing/hermesSemanticTurn.service';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const catalogTokens = (value?: string) =>
  normalize(String(value || ''))
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 6);

const hasCatalogQuestion = (message: string) =>
  /\b(servicio|servicios|catalogo|opciones|ofrecen|ofreces|tienen|tienes|service|services|offer|offers|options|list)\b/.test(normalize(message));

const hasDetailQuestion = (message: string) =>
  /\b(en que consiste|que incluye|detalle|detalles|como funciona|explicame|what is it|what does it include|details|how does it work|tell me more)\b/.test(normalize(message));

const hasBookingIntent = (message: string) =>
  /\b(reserv\w*|agend\w*|cita|turno|separar|quiero que me atiendan|quiero una consulta|book\w*|schedule|appointment|consultation)\b/.test(normalize(message));

const hasSelectionIntent = (message: string) => {
  const normalized = normalize(message).trim();
  return /^\d+$/.test(normalized) || /\b(si|dale|ok|okay|claro|confirmo|me gusta|me sirve|elijo|escojo|esa opcion|ese servicio|vamos con)\b/.test(normalized);
};

const hasUnsupportedServiceRequest = (message: string) => {
  const normalized = normalize(message).trim();
  return /\b(quiero|quisiera|necesito|busco|me haces|preparame|dame|vender|vende|hacer)\b/.test(normalized);
};

const hasCasualGreeting = (message: string) =>
  /^(hola|hi|hey|buenas|que tal|qué tal|como estas|cómo estás|bro|broer)[\s!,?.]*(.*)?$/i.test(normalize(message).trim())
  && !hasBookingIntent(message);

const extractNaturalCustomerData = (message: string) => {
  const data: Record<string, unknown> = {};
  const nameMatch = message.match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{1,40})/i);
  if (nameMatch?.[1]) {
    data.firstName = nameMatch[1]
      .replace(/\b(?:y|quiero|necesito|deseo|busco|para|agendar|reservar|una|un)\b.*$/i, '')
      .trim();
  }
  const phoneMatch = message.match(/(?:mi\s+(?:numero|n[uú]mero|celular|telefono|tel[eé]fono|contacto)(?:\s+es)?|contactame\s+(?:al|en|a mi celular))\s*:?\s*(\+?\d[\d\s().-]{6,14}\d)/i);
  if (phoneMatch?.[1]) data.phone = phoneMatch[1].replace(/[^\d+]/g, '');
  return data;
};

const dateInLima = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().slice(0, 10);
};

const weekdayOffsets: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const getNextWeekdayDate = (weekdayName: string, baseDateStr: string) => {
  const targetDay = weekdayOffsets[weekdayName];
  if (targetDay === undefined) return undefined;

  const [year, month, day] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  const currentDay = date.getUTCDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  return addDays(baseDateStr, daysToAdd);
};

export const extractPreferredDate = (message: string) => {
  const normalized = normalize(message);
  const isoMatch = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const slashMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year || dateInLima().slice(0, 4)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (/\bmanana\b/.test(normalized)) return addDays(dateInLima(), 1);
  if (/\bhoy\b/.test(normalized)) return dateInLima();

  const weekdays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  for (const day of weekdays) {
    const regex = new RegExp(`\\b${day}\\b`);
    if (regex.test(normalized)) {
      return getNextWeekdayDate(day, dateInLima());
    }
  }

  return undefined;
};

export const isWeekend = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

type CatalogPresentationMode =
  | 'names_only'
  | 'short_summary'
  | 'price'
  | 'duration'
  | 'price_and_duration';

const hasPriceQuestion = (message: string) =>
  /\b(precio|cuesta|costo|vale|tarifa|cobra|cobran|price|cost)\b/.test(normalize(message));

const hasDurationQuestion = (message: string) =>
  /\b(cuanto demora|cuanto dura|duracion|demora|dura|tiempo|minutos|horas|duration|how long)\b/.test(normalize(message));

const hasComparisonQuestion = (message: string) =>
  /\b(compara|comparar|diferencia|diferencias|mejor|conviene|versus|vs)\b/.test(normalize(message));

const catalogPresentationModeFor = (message: string): CatalogPresentationMode => {
  if (hasComparisonQuestion(message)) return 'price_and_duration';
  if (hasPriceQuestion(message)) return 'price';
  if (hasDurationQuestion(message)) return 'duration';
  if (hasCatalogQuestion(message)) return 'short_summary';
  return 'names_only';
};

const shortDescription = (offering: any) => {
  const description = String(offering?.description || '').trim();
  if (!description) return '';
  return description.length > 120 ? `${description.slice(0, 117).trim()}...` : description;
};

const catalogLine = (offering: any, index: number, mode: CatalogPresentationMode = 'short_summary') => {
  const name = String(offering?.name || `Servicio ${index + 1}`).trim();
  const description = shortDescription(offering);
  const price = offering?.priceLabel || 'precio no publicado';
  const duration = offering?.durationMinutes ? `${offering.durationMinutes} min aprox.` : 'duracion segun disponibilidad';

  if (mode === 'price') return `${index + 1}. ${name}: ${price}`;
  if (mode === 'duration') return `${index + 1}. ${name}: ${duration}`;
  if (mode === 'price_and_duration') return `${index + 1}. ${name}: ${price}, ${duration}`;
  if (mode === 'names_only' || !description) return `${index + 1}. ${name}`;
  return `${index + 1}. ${name} - ${description}`;
};

const domainRedirectPrompt = async (catalog: any[], message = '') => {
  const context = {
    conversation: { conversationId: 'fallback', channel: 'web_agent', history: [] },
    permissions: { mode: 'qa_primary' as const, readOnly: true as const, canExecuteActions: false as const },
  };
  const categoryReply = await buildExternalDomainReply({ message, context });
  if (categoryReply && !/No puedo ayudarte con esa solicitud desde este canal/i.test(categoryReply)) return categoryReply;
  const names = catalog
    .map((item) => String(item?.name || '').trim())
    .filter(Boolean)
    .slice(0, 6);
  const services = names.length
    ? names.join(', ')
    : 'diagnostico, mantenimiento, frenos, detailing, pintura o undercoating';
  return `No puedo ayudarte con esa solicitud desde este canal. Somos un taller automotriz y puedo ayudarte con ${services}. Que necesitas revisar en tu vehiculo?`;
};

const catalogPrompt = (catalog: any[], intro = 'Puedo ayudarte con estos servicios:', mode: CatalogPresentationMode = 'short_summary') => {
  if (!catalog.length) return 'Todavia no veo servicios publicos disponibles para ofrecerte.';
  if (catalog.length === 1) {
    const offering = catalog[0];
    return `${intro} ${catalogLine(offering, 0, mode).replace(/^1\.\s*/, '')}. Si quieres, te cuento en que consiste o seguimos con esa opcion.`;
  }
  return `${intro}\n${catalog.map((item, index) => catalogLine(item, index, mode)).join('\n')}\nDime cual te interesa y seguimos.`;
};

const catalogAttributePrompt = (catalog: any[], userMessage: string, offering?: any) => {
  const selected = offering || catalog[0];
  if (!selected) return 'Todavia no veo servicios publicos disponibles para responder eso.';
  const mode = catalogPresentationModeFor(userMessage);
  return catalogLine(selected, 0, mode).replace(/^1\.\s*/, '');
};

const formatSlotOption = (slot: any, index: number) => {
  const start = slot?.startAt ? new Date(slot.startAt).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  }) : String(slot?._id || slot?.id || 'horario disponible');
  return `${index + 1}. ${start}`;
};

const optionTokens = (option: any) => {
  const values = [
    option?._id,
    option?.id,
    option?.slotId,
    option?.name,
    option?.label,
    option?.title,
    option?.startAt,
    option?.displayName,
  ].filter(Boolean).map((value) => normalize(String(value)));

  if (option?.startAt) {
    const date = new Date(option.startAt);
    if (!Number.isNaN(date.getTime())) {
      values.push(new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date).toLowerCase());
    }
  }

  return values;
};

const resolveOptionSelection = (options: any[], message: string) => {
  const normalized = normalize(message).trim();
  const numberChoice = normalized.match(/^\d+$/);
  if (numberChoice) return options[Number(numberChoice[0]) - 1];

  return options.find((option) => {
    return optionTokens(option).some((token) => token && (normalized.includes(token) || token.includes(normalized)));
  });
};

const findOffering = (context: AgentContext, message: string) => {
  const catalog = context.business.catalogSummary || [];
  const normalized = normalize(message).trim();
  const numberChoice = normalized.match(/^\d+$/);
  if (numberChoice) return catalog[Number(numberChoice[0]) - 1];

  return catalog.find((offering) => {
    const name = normalize(offering.name);
    const id = normalize(offering.id);
    const tokens = [
      ...catalogTokens(offering.id),
      ...catalogTokens(offering.name),
      ...catalogTokens(offering.description),
    ];
    return normalized.includes(name)
      || normalized.includes(id)
      || tokens.some((token) => normalized.includes(token));
  });
};

const readOnlyContextFromAgentContext = (context: AgentContext): HermesReadOnlyContext => ({
  business: {
    businessSlug: context.business.businessSlug || context.conversation.businessSlug,
    businessName: context.business.business.name,
    timezone: context.business.business.timezone,
    agent: context.business.agent,
  },
  conversation: {
    conversationId: context.conversation.conversationId,
    channel: context.conversation.channel,
    history: (context.conversation.recentMessages || []).map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
  },
  process: context.process
    ? {
      active: true,
      processType: context.process.process.workflowType,
      status: context.process.process.status,
      awaiting: context.process.awaiting,
      knownFacts: context.process.knownFacts,
      availableOptions: (context.process.availableOptions || []).map((option: any) => ({
        id: option?.id || option?._id || option?.slotId,
        label: option?.label || option?.displayName || option?.name,
        startAt: option?.startAt,
        endAt: option?.endAt,
      })),
      allowedActions: context.process.allowedActions || [],
      informationalOnly: true as const,
    }
    : undefined,
  catalog: (context.business.catalogSummary || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    durationMinutes: item.durationMinutes,
    pricing: { type: 'not_published' as const },
    publicVisible: true,
    active: true,
  })),
  permissions: {
    mode: 'qa_primary' as const,
    readOnly: true as const,
    canExecuteActions: false as const,
  },
});

const nextCustomerFieldQuestion = (context: AgentContext) => {
  const first = context.process?.awaiting?.nextRecommendedField || context.process?.awaiting?.requiredFields?.[0] || 'tu nombre';
  if (/nombre/i.test(first)) return 'Perfecto. Para empezar, como te llamas?';
  if (/telefono|celular|phone/i.test(first)) return 'Gracias. Que numero de contacto podemos usar?';
  return `Perfecto. Me compartes ${first}?`;
};

export const deterministicFallback = async (context: AgentContext, userMessage: string): Promise<AgentDecision> => {
  const catalog = context.business.catalogSummary || [];
  const offering = findOffering(context, userMessage);
  const readOnlyContext = readOnlyContextFromAgentContext(context);
  const hasContinuityIdentifier = /\b(?:mi\s+)?(?:numero|n[uÃº]mero|telefono|tel[eÃ©]fono|celular|dni|documento|placa)\b|\b(?:soy|me llamo|mi nombre es)\s+[a-z[Ã¡Ã©Ã­Ã³ÃºÃ±]{2,}/i.test(normalize(userMessage));

  if (hasContinuityIdentifier) {
    if (context.conversation.customerIdentity?.customerId) {
      return {
        reply: 'Gracias. He recuperado tu informacion. En que puedo ayudarte?',
        intent: { name: 'conversation_recovery', confidence: 0.9 },
      };
    }
    return {
      reply: 'Gracias. No encontre una conversacion previa asociada a ese numero. En que puedo ayudarte?',
      intent: { name: 'conversation_recovery', confidence: 0.9 },
    };
  }

  const semantic = await classifyHermesSemanticTurn({ message: userMessage, context: readOnlyContext });

  if (isAutomotiveSemanticIntent(semantic.intent) && !(offering && hasUnsupportedServiceRequest(userMessage))) {
    return {
      reply: await buildAutomotiveGuidanceReply({ message: userMessage, context: readOnlyContext, semantic }),
      intent: { name: semantic.intent, confidence: semantic.confidence === 'low' ? 0.55 : semantic.confidence === 'medium' ? 0.72 : 0.88 },
    };
  }

  if (semantic.intent === 'domain_clarification') {
    return {
      reply: '¿Te refieres a alguna pieza o revisión de tu vehículo, o es otro tipo de consulta?',
      intent: { name: 'domain_clarification', confidence: 0.85 },
    };
  }

  if (semantic.intent === 'off_domain') {
    return {
      reply: await domainRedirectPrompt(catalog, userMessage),
      intent: { name: 'off_domain', confidence: 0.85 },
    };
  }

  if (context.process && hasCasualGreeting(userMessage)) {
    const pending = context.process.awaiting?.nextRecommendedField;
    if (context.process.awaiting?.type === 'offering_selection') {
      return {
        reply: catalogPrompt(catalog, 'Hola, aqui estoy contigo.'),
        intent: { name: 'side_conversation', confidence: 0.75 },
      };
    }
    return {
      reply: pending
        ? `Todo bien, aqui contigo. Seguimos con tu reserva; tengo pendiente ${pending}.`
        : 'Todo bien, aqui contigo. Seguimos con tu reserva cuando quieras.',
      intent: { name: 'side_conversation', confidence: 0.7 },
    };
  }

  if (hasDetailQuestion(userMessage) && offering) {
    const pending = context.process?.awaiting?.nextRecommendedField;
    const reminder = pending ? ` Cuando quieras seguimos con la reserva; todavia necesito ${pending}.` : '';
    return {
      reply: `${offering.name} es una opcion del catalogo para iniciar la atencion y revisar disponibilidad. ${offering.description || 'No tengo una descripcion adicional configurada.'}${reminder}`,
      intent: { name: 'offering_question', confidence: 0.75 },
      actions: [{ capability: 'get_offering_details', arguments: { offeringId: offering.id } }],
    };
  }

  if ((hasPriceQuestion(userMessage) || hasDurationQuestion(userMessage) || hasComparisonQuestion(userMessage)) && catalog.length) {
    return {
      reply: catalogAttributePrompt(catalog, userMessage, offering),
      intent: { name: 'catalog_attribute_question', confidence: 0.78 },
      actions: offering ? [{ capability: 'get_offering_details', arguments: { offeringId: offering.id } }] : [{ capability: 'search_catalog', arguments: {} }],
    };
  }

  if (context.process?.awaiting?.type === 'customer_information' || context.process?.awaiting?.type === 'managed_entity_information') {
    return {
      reply: nextCustomerFieldQuestion(context),
      intent: { name: 'collect_customer_data', confidence: 0.75 },
    };
  }

  if (context.process?.awaiting?.type === 'offering_selection') {
    if (hasCatalogQuestion(userMessage)) {
      return {
        reply: catalogPrompt(catalog, 'Claro, estos son los servicios disponibles:', catalogPresentationModeFor(userMessage)),
        intent: { name: 'catalog_question', confidence: 0.82 },
        actions: [{ capability: 'search_catalog', arguments: {} }],
      };
    }

    if (hasSelectionIntent(userMessage) && offering && context.process.allowedActions.includes('submit_offering_selection')) {
      return {
        reply: `Perfecto, seguimos con ${offering.name}. Para avanzar, como te llamas?`,
        intent: { name: 'offering_selection', confidence: 0.85 },
        actions: [{
          capability: 'continue_schedule_consultation',
          arguments: { action: 'submit_offering_selection', data: { catalogOfferingId: offering.id } },
        }],
      };
    }

    if (hasUnsupportedServiceRequest(userMessage) && !offering) {
      return {
        reply: await domainRedirectPrompt(catalog, userMessage),
        intent: { name: 'ask_offering_selection', confidence: 0.78 },
      };
    }

    return {
      reply: catalogPrompt(catalog),
      intent: { name: 'ask_offering_selection', confidence: 0.75 },
    };
  }

  if (context.process?.awaiting?.type === 'date_preference') {
    const preferredDate = extractPreferredDate(userMessage);
    if (preferredDate && context.process.allowedActions.includes('submit_date_preference')) {
      if (isWeekend(preferredDate)) {
        return {
          reply: 'Los sábados y domingos no realizamos consultas. ¿Probamos con un día de lunes a viernes?',
          intent: { name: 'date_preference_invalid', confidence: 0.8 },
        };
      }
      return {
        reply: `Perfecto, reviso disponibilidad para el ${preferredDate}.`,
        intent: { name: 'date_preference', confidence: 0.85 },
        actions: [{
          capability: 'continue_schedule_consultation',
          arguments: { action: 'submit_date_preference', data: { preferredDate } },
        }],
      };
    }

    return {
      reply: 'Ya tengo esos datos. Que dia te vendria bien para revisar disponibilidad?',
      intent: { name: 'ask_date_preference', confidence: 0.7 },
    };
  }

  if (context.process?.awaiting?.type === 'slot_selection') {
    const preferredDate = extractPreferredDate(userMessage);
    if (preferredDate && context.process.allowedActions.includes('submit_date_preference')) {
      if (isWeekend(preferredDate)) {
        return {
          reply: 'Los sábados y domingos no realizamos consultas. ¿Probamos con un día de lunes a viernes?',
          intent: { name: 'date_preference_invalid', confidence: 0.8 },
        };
      }
      return {
        reply: `Perfecto, cambio la fecha para revisar disponibilidad el ${preferredDate}.`,
        intent: { name: 'date_preference', confidence: 0.85 },
        actions: [{
          capability: 'continue_schedule_consultation',
          arguments: { action: 'submit_date_preference', data: { preferredDate } },
        }],
      };
    }

    const slots = context.process.availableOptions || [];
    const slot = resolveOptionSelection(slots, userMessage) as any;
    if (slot && context.process.allowedActions.includes('submit_slot_selection')) {
      return {
        reply: 'Perfecto, confirmo ese horario.',
        intent: { name: 'slot_selection', confidence: 0.9 },
        actions: [{
          capability: 'continue_schedule_consultation',
          arguments: { action: 'submit_slot_selection', data: { slotId: String(slot._id || slot.id || slot.slotId) } },
        }],
      };
    }

    return {
      reply: slots.length
        ? `Tengo estos horarios disponibles:\n${slots.slice(0, 5).map(formatSlotOption).join('\n')}\nCual prefieres?`
        : 'No veo horarios disponibles para ese filtro. Probamos con otro dia?',
      intent: { name: 'ask_slot_selection', confidence: 0.7 },
    };
  }

  if (hasBookingIntent(userMessage) || (offering && hasUnsupportedServiceRequest(userMessage))) {
    const customerData = extractNaturalCustomerData(userMessage);
    const actions: AgentDecisionAction[] = [
      {
        capability: 'start_schedule_consultation',
        arguments: {
          businessSlug: context.business.businessSlug || context.conversation.businessSlug,
          ...(offering ? { offeringId: offering.id } : {}),
          customerMessage: userMessage,
        },
      },
    ];
    if (offering && Object.keys(customerData).length) {
      actions.push({
        capability: 'continue_schedule_consultation',
        arguments: { action: 'submit_customer_information', data: customerData },
      });
    }

    return {
      reply: offering
        ? Object.keys(customerData).length
          ? customerData.firstName
            ? `Hola, ${customerData.firstName}. Claro, te ayudo con ${offering.name}. Sigo con los datos necesarios para la reserva.`
            : `Perfecto, podemos avanzar con ${offering.name}. Sigo con los datos de la reserva.`
          : `Perfecto, podemos avanzar con ${offering.name}. Para empezar, como te llamas?`
        : 'Claro, puedo ayudarte a reservar. Que servicio te interesa?',
      intent: { name: 'start_booking', confidence: 0.85 },
      actions,
    };
  }

  if (hasCatalogQuestion(userMessage)) {
    return {
      reply: catalog.length
        ? `Tenemos disponible:\n${catalog.map((item, index) => catalogLine(item, index, catalogPresentationModeFor(userMessage))).join('\n')}\nTe cuento mas de alguno o revisamos disponibilidad cuando quieras.`
        : 'Todavia no tengo servicios publicos cargados para mostrarte.',
      intent: { name: 'catalog_question', confidence: 0.8 },
      actions: [{ capability: 'search_catalog', arguments: {} }],
    };
  }

  if (hasSelectionIntent(userMessage) && offering) {
    return {
      reply: `Perfecto, seguimos con ${offering.name}. Para avanzar, como te llamas?`,
      intent: { name: 'start_booking', confidence: 0.82 },
      actions: [{
        capability: 'start_schedule_consultation',
        arguments: {
          businessSlug: context.business.businessSlug || context.conversation.businessSlug,
          offeringId: offering.id,
          customerMessage: userMessage,
        },
      }],
    };
  }

  if (hasUnsupportedServiceRequest(userMessage) && !offering) {
    return {
      reply: await domainRedirectPrompt(catalog, userMessage),
      intent: { name: 'unsupported_catalog_request', confidence: 0.7 },
    };
  }

  const CONTINUITY_IDENTIFIER = /\b(?:mi\s+)?(?:numero|n[uú]mero|telefono|tel[eé]fono|celular|dni|documento|placa)\b|\b(?:soy|me llamo|mi nombre es)\s+[a-z[áéíóúñ]{2,}/i;
  
  if (CONTINUITY_IDENTIFIER.test(normalize(userMessage))) {
    if (context.conversation.customerIdentity?.customerId) {
      return {
        reply: 'Gracias. He recuperado tu informacion. En que puedo ayudarte?',
        intent: { name: 'conversation_recovery', confidence: 0.9 },
      };
    } else {
      return {
        reply: 'Gracias. No encontre una conversacion previa asociada a ese numero. En que puedo ayudarte?',
        intent: { name: 'conversation_recovery', confidence: 0.9 },
      };
    }
  }

  return {
    reply: `Te puedo ayudar con informacion y reservas de ${context.business.business.name}. ${catalog.length ? `Por ahora tengo disponible ${catalog.map((item) => item.name).join(', ')}.` : 'Aun no veo servicios publicos cargados.'}`,
    intent: { name: 'general_business_conversation', confidence: 0.55 },
  };
};
