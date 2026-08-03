import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';

type SchedulingIntentInput = {
  businessSlug: string;
  conversationId: string;
  message: string;
  messageId: string;
  context: HermesReadOnlyContext;
  processState?: any;
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/ÃƒÂ±|Ã±|ñ/g, 'n')
    .replace(/ÃƒÂ¡|Ã¡/g, 'a')
    .replace(/ÃƒÂ©|Ã©/g, 'e')
    .replace(/ÃƒÂ­|Ã­/g, 'i')
    .replace(/ÃƒÂ³|Ã³/g, 'o')
    .replace(/ÃƒÂº|Ãº/g, 'u')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¡/g, 'a')
    .replace(/Ã©/g, 'e')
    .replace(/Ã­/g, 'i')
    .replace(/Ã³/g, 'o')
    .replace(/Ãº/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const OFFERING_TERM_ALIASES: Record<string, string[]> = {
  basic: ['basica', 'básica'],
  consultation: ['consulta'],
  service: ['servicio'],
  services: ['servicios'],
  evaluation: ['evaluacion', 'evaluación'],
  schedule: ['agenda', 'agendar', 'reserva', 'reservar'],
};

const localizedOfferingAliases = (value: string) => {
  const normalized = normalize(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const variants = new Set<string>([normalized]);
  const expandedPerToken = tokens.map((token) => [token, ...(OFFERING_TERM_ALIASES[token] || []).map(normalize)]);

  const walk = (index: number, current: string[]) => {
    if (index >= expandedPerToken.length) {
      variants.add(current.join(' ').trim());
      return;
    }
    for (const option of expandedPerToken[index]) {
      walk(index + 1, [...current, option]);
    }
  };

  walk(0, []);
  return [...variants].filter(Boolean);
};

const distinctiveOfferingTokens = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 6);

const bookingTerms = /\b(reserv|agend|cita|appointment|book)\w*/i;
const cancelTerms = /\b(cancel|cancela|cancelar|anular|anula)\w*/i;
const rescheduleTerms = /\b(reprogram|reagend|reschedul|cambiar)\w*/i;
const availabilityTerms = /\b(horario|horarios|disponib|available|availability|slot|slots|manana|mañana|tarde|viernes|lunes|martes|miercoles|jueves|sabado|domingo)\b/i;
const sideQuestionTerms = /\b(cuanto|cuanto dura|cuanto cuesta|como funciona|incluye|duracion|duration|price|precio)\b/i;
const temporalTerms = /\b(temporal|workflow|task queue|signal|activity|mongodb|mongoose|http:\/\/|https:\/\/|shell command)\b/i;
const weekdayIndex: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
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

const nextWeekdayFrom = (weekdayName: string, baseDateStr: string) => {
  const targetDay = weekdayIndex[weekdayName];
  if (targetDay === undefined) return undefined;

  const [year, month, day] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const currentDay = date.getUTCDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  return addDays(baseDateStr, daysToAdd);
};

const parseName = (message: string) => {
  const match = message.match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]{2,})(?:\s+([A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]{2,}))?/i);
  if (!match?.[1]) return {};
  return {
    firstName: match[1],
    ...(match[2] ? { lastName: match[2] } : {}),
  };
};

const parseShortName = (message: string, processState?: any, context?: HermesReadOnlyContext) => {
  const awaiting = String(
    processState?.awaiting?.nextRecommendedField
    || context?.process?.awaiting?.nextRecommendedField
    || processState?.awaiting?.field
    || context?.process?.awaiting?.field
    || ''
  );
  if (!/firstName|lastName|customer_identity|customer_last_name|nombre|apellido/i.test(awaiting)) return {};
  const trimmed = String(message || '').trim();
  const match = trimmed.match(/^([A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]{2,})(?:\s+([A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]{2,}))?\.?$/);
  if (!match?.[1]) return {};
  if (/lastName|customer_last_name|apellido/i.test(awaiting)) {
    return {
      lastName: [match[1], match[2]].filter(Boolean).join(' '),
    };
  }
  return {
    firstName: match[1],
    ...(match[2] ? { lastName: match[2] } : {}),
  };
};

const FLEXIBLE_NAME_WORD_PATTERN = String.raw`[\p{L}][\p{L}'-]{1,}`;
const FLEXIBLE_NAME_PHRASE_PATTERN = `${FLEXIBLE_NAME_WORD_PATTERN}(?:\\s+${FLEXIBLE_NAME_WORD_PATTERN}){0,2}`;
const flexibleAnswerPrefixPattern = /^(?:(?:ok|okay|claro|listo|perfecto|gracias)[,.\s]+)*(?:(?:a\s+nombre\s+de|para\s+|soy|me\s+llamo)\s+|(?:mi|el|la|su)?\s*[\p{L}\s]{2,28}?\s+(?:es|seria|ser\u00eda|sera|ser\u00e1|son)\s+)/iu;
const flexibleShortNamePattern = new RegExp(`^(${FLEXIBLE_NAME_PHRASE_PATTERN})\\.?$`, 'u');
const flexibleNamePlaceholders = new Set(['quien', 'quienes', 'que', 'cual', 'nombre', 'persona']);
type FlexibleCustomerName = { firstName?: string; lastName?: string };

const flexibleCustomerDataFromName = (phrase?: string): FlexibleCustomerName => {
  const parts = String(phrase || '').trim().split(/\s+/).filter(Boolean);
  if (!parts[0] || flexibleNamePlaceholders.has(normalize(parts[0]))) return {};
  return {
    firstName: parts[0],
    ...(parts.length > 1 ? { lastName: parts.slice(1).join(' ') } : {}),
  };
};

const awaitedNameFieldFrom = (awaiting: string): 'firstName' | 'lastName' | undefined => {
  if (/lastName|customer_last_name|apellido/i.test(awaiting)) return 'lastName';
  if (/firstName|customer_identity|nombre/i.test(awaiting)) return 'firstName';
  return undefined;
};

const namePhraseFromNaturalAnswer = (message: string) => {
  const trimmed = String(message || '').trim().replace(/[.\u3002]+$/u, '').trim();
  if (!trimmed || trimmed.length > 80 || /[?\u00bf!]/.test(trimmed)) return undefined;
  const withoutPrefix = trimmed.replace(flexibleAnswerPrefixPattern, '').trim();
  const candidate = withoutPrefix && withoutPrefix !== trimmed ? withoutPrefix : trimmed;
  const match = candidate.match(new RegExp(`^(${FLEXIBLE_NAME_PHRASE_PATTERN})(?=\\s|$|[.,;:!?])`, 'u'));
  return match?.[1];
};

const parseFlexibleNameForAwaiting = (message: string, processState?: any, context?: HermesReadOnlyContext) => {
  const awaiting = String(
    processState?.awaiting?.nextRecommendedField
    || context?.process?.awaiting?.nextRecommendedField
    || processState?.awaiting?.field
    || context?.process?.awaiting?.field
    || ''
  );
  const awaitedNameField = awaitedNameFieldFrom(awaiting);
  if (!awaitedNameField) return {};
  const short = String(message || '').trim().match(flexibleShortNamePattern);
  const parsed = flexibleCustomerDataFromName(namePhraseFromNaturalAnswer(message) || short?.[1]);
  if (!parsed.firstName) return {};
  if (awaitedNameField === 'lastName') {
    return { firstName: undefined, lastName: [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') };
  }
  return parsed;
};

const parseManagedEntityForAwaiting = (message: string, processState?: any, context?: HermesReadOnlyContext) => {
  const awaiting = String(
    processState?.awaiting?.nextRecommendedField
    || context?.process?.awaiting?.nextRecommendedField
    || processState?.awaiting?.field
    || context?.process?.awaiting?.field
    || ''
  );
  if (!/managedentitydisplayname|managed_entity|vehiculo|elemento|equipo/i.test(awaiting)) return {};
  const trimmed = String(message || '').trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 80) return {};
  if (/[?¿!]/.test(trimmed)) return {};
  return { managedEntityHint: trimmed };
};

const parsePhone = (message: string) => {
  const match = message.match(/(?:\+?\d[\d\s().-]{6,}\d)/);
  return match ? match[0].replace(/\D/g, '') : undefined;
};

const parseEmail = (message: string) =>
  message.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];

const parseSlotId = (message: string) =>
  message.match(/\bslot[_-]?[a-z0-9_.-]+\b/i)?.[0];

const slotIdOf = (slot: any) => String(slot?._id || slot?.id || slot?.slotId || '');

const visibleSlotsFrom = (processState?: any, context?: HermesReadOnlyContext) => {
  if (Array.isArray(processState?.availableSlots) && processState.availableSlots.length) {
    return processState.availableSlots;
  }
  const options = context?.process?.availableOptions;
  return Array.isArray(options) ? options : [];
};

const timeLabel = (value: unknown) => {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const toTwentyFourHourTime = (hourText: string, minuteText?: string, meridianText?: string) => {
  let hour = Number(hourText);
  const minute = Number(minuteText || '0');
  const meridian = normalize(meridianText || '').replace(/[^apm]/g, '');
  if (meridian.startsWith('p') && hour < 12) hour += 12;
  if (meridian.startsWith('a') && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const slotReferenceFromVisibleSlots = (message: string, processState?: any, context?: HermesReadOnlyContext) => {
  const awaiting = String(
    processState?.awaiting?.type
    || context?.process?.awaiting?.type
    || ''
  );
  const status = String(processState?.status || context?.process?.status || '');
  if (!/slot_selection/i.test(awaiting) && status !== 'WAITING_FOR_SLOT_SELECTION') return {};

  const slots = visibleSlotsFrom(processState, context);
  if (!slots.length) return {};
  const trimmed = String(message || '').trim();
  const normalized = normalize(trimmed);

  const numeric = trimmed.match(/^\s*(\d+)\s*$/);
  if (numeric) {
    const selected = slots[Number(numeric[1]) - 1];
    const slotId = slotIdOf(selected);
    return slotId ? { slotId } : {};
  }

  const ordinalIndex =
    /\b(primera|primer|1ra|1era)\b/.test(normalized) ? 0
      : /\b(segunda|segundo|2da|2do)\b/.test(normalized) ? 1
        : /\b(tercera|tercero|3ra|3ro)\b/.test(normalized) ? 2
          : undefined;
  if (ordinalIndex !== undefined) {
    const slotId = slotIdOf(slots[ordinalIndex]);
    return slotId ? { slotId } : {};
  }

  const range = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?\s*(?:-|a)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?\b/);
  if (range) {
    const start = toTwentyFourHourTime(range[1], range[2], range[3] || range[6]);
    const end = toTwentyFourHourTime(range[4], range[5], range[6]);
    const selected = slots.find((slot: any) => timeLabel(slot?.startAt) === start && timeLabel(slot?.endAt) === end);
    const slotId = slotIdOf(selected);
    return slotId ? { slotId } : {};
  }

  const startOnly = normalized.match(/\b(?:a las?|de las?|el de las?)?\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)\b/);
  if (startOnly) {
    const start = toTwentyFourHourTime(startOnly[1], startOnly[2], startOnly[3]);
    const matches = slots.filter((slot: any) => timeLabel(slot?.startAt) === start);
    if (matches.length === 1) {
      const slotId = slotIdOf(matches[0]);
      return slotId ? { slotId } : {};
    }
  }

  return {};
};

const parseDateHint = (message: string) => {
  const normalized = normalize(message);
  const tomorrowPattern = /\b(?:manana|mañana|ma ana)\b/;
  const morningPattern = /\b(?:por la )?(?:manana|mañana|ma ana)\b/;
  const iso = message.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (iso) return { requestedDate: iso };
  const dmy = message.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return {
      requestedDate: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
    };
  }
  if (/\bhoy\b/.test(normalized)) {
    return { requestedDate: dateInLima() };
  }
  for (const weekday of Object.keys(weekdayIndex)) {
    if (new RegExp(`\\b(?:(?:este|proximo|siguiente)\\s+)?${weekday}\\b|\\b${weekday}\\s+(?:proximo|siguiente|que\\s+viene)\\b`).test(normalized)) {
      const nextDate = nextWeekdayFrom(weekday, dateInLima());
      if (nextDate) {
        return { requestedDate: nextDate };
      }
    }
  }
  if (tomorrowPattern.test(normalized) && !/\bpor la (?:manana|maÃ±ana|ma ana)\b/.test(normalized)) {
    return { requestedDate: addDays(dateInLima(), 1) };
  }
  const time = message.match(/\b(\d{1,2}:\d{2})\b/)?.[1];
  const dayPart =
    morningPattern.test(normalized) ? 'morning'
      : /\b(?:por la )?tarde\b/.test(normalized) ? 'afternoon'
        : /\b(?:por la )?noche\b/.test(normalized) ? 'evening'
          : undefined;
  const notBefore = normalized.match(/\b(?:despues de|desde|a partir de)\s+las?\s+(\d{1,2})(?::(\d{2}))?\b/);
  return {
    ...(time ? { requestedTime: time } : {}),
    ...(dayPart ? { requestedDayPart: dayPart as 'morning' | 'afternoon' | 'evening' } : {}),
    ...(notBefore
      ? { notBeforeTime: `${String(Number(notBefore[1])).padStart(2, '0')}:${String(Number(notBefore[2] || '0')).padStart(2, '0')}` }
      : {}),
  };
};

const matchOffering = (message: string, context: HermesReadOnlyContext) => {
  const normalizedMessage = normalize(message);
  const recentUserText = (context.conversation?.history || [])
    .filter((entry) => entry.role === 'user')
    .slice(-4)
    .map((entry) => entry.content)
    .join(' ');
  const normalizedContext = normalize(`${recentUserText} ${message}`);
  const offerings = context.catalog || [];
  const numericChoice = normalizedMessage.match(/^\s*(\d+)(?:[\s.,):;-]|$)/);
  if (numericChoice) {
    const selected = offerings[Number(numericChoice[1]) - 1];
    if (selected) {
      return { offeringId: selected.id, offeringReference: selected.name || selected.id };
    }
  }
  const symptomOffering = offerings.find((entry) => {
    const name = normalize(entry.name || '');
    const description = normalize(entry.description || '');
    if (/\b(freno|frenos|pastilla|pastillas|disco|discos|suspension|amortiguador|chillido|vibracion|ruido al frenar|sonido|ruido|suena|suenan|intensifico)\b/.test(normalizedContext)) {
      return /\bfreno|frenos|suspension\b/.test(`${name} ${description}`);
    }
    if (/\b(motor|aceite|rendimiento|calienta|humo|potencia)\b/.test(normalizedContext)) {
      return /\bmotor|rendimiento|diagnostico\b/.test(`${name} ${description}`);
    }
    if (/\b(golpe|choque|pintura|rayon|abolladura|planchar|planchado)\b/.test(normalizedContext)) {
      return /\bplanchado|pintura\b/.test(`${name} ${description}`);
    }
    return false;
  });
  if (symptomOffering) {
    return { offeringId: symptomOffering.id, offeringReference: symptomOffering.name || symptomOffering.id };
  }

  const offering = offerings.find((entry) => {
    const variants = [
      normalize(entry.id),
      ...localizedOfferingAliases(entry.name || ''),
      ...localizedOfferingAliases(entry.description || ''),
    ].filter(Boolean);
    return variants.some((variant) => {
      if (!variant) return false;
      if (normalizedMessage.includes(variant)) return true;
      const tokens = variant.split(' ').filter((token) => token.length >= 4);
      if (tokens.length >= 2 && tokens.every((token) => normalizedMessage.includes(token))) return true;
      return distinctiveOfferingTokens(variant).some((token) => normalizedMessage.includes(token));
    });
  });
  return offering
    ? { offeringId: offering.id, offeringReference: offering.name || offering.id }
    : {};
};

const hasActiveProcess = (processState?: any, context?: HermesReadOnlyContext) =>
  Boolean(processState?.status) || Boolean(context?.process?.active);

export const extractHermesSchedulingIntent = (input: SchedulingIntentInput): HermesSchedulingIntent => {
  const message = String(input.message || '').trim();
  const normalized = normalize(message);
  const symptomReportOnly = /\b(problema|falla|mal|suena|suenan|ruido|chillido|vibracion|vibra|recurrente|fuerte|suave|todo el tiempo|al frenar)\b/i.test(normalized)
    && !/\b(quiero|quisiera|necesito|busco|revision|revisar|evaluacion|evaluar|cita|agendar|reservar|opcion|opcion|servicio)\b/i.test(normalized)
    && !/^\s*\d+/.test(normalized);
  const activeProcess = hasActiveProcess(input.processState, input.context);
  const processStatus = String(input.processState?.status || '');
  const extracted: HermesSchedulingIntent['extracted'] = {
    ...parseName(message),
    ...parseShortName(message, input.processState, input.context),
    ...parseFlexibleNameForAwaiting(message, input.processState, input.context),
    ...parseManagedEntityForAwaiting(message, input.processState, input.context),
    ...(parsePhone(message) ? { phone: parsePhone(message) } : {}),
    ...(parseEmail(message) ? { email: parseEmail(message) } : {}),
    ...matchOffering(message, input.context),
    ...parseDateHint(message),
    ...slotReferenceFromVisibleSlots(message, input.processState, input.context),
    ...(parseSlotId(message) ? { slotId: parseSlotId(message) } : {}),
  };

  const base = {
    extracted,
    source: {
      messageId: input.messageId,
      conversationId: input.conversationId,
      businessSlug: input.businessSlug,
    },
    requiresAction: false,
    requiresClarification: false,
  };

  if (!message) {
    return { type: 'none', confidence: 'low', ...base, extracted: {} };
  }

  if (temporalTerms.test(normalized) && /\b(ignore|ignora|inicia|start|ejecuta|run)\b/i.test(normalized)) {
    return {
      ...base,
      type: 'ambiguous',
      confidence: 'high',
      requiresClarification: true,
    };
  }

  if (cancelTerms.test(normalized)) {
    return {
      ...base,
      type: 'cancel_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (rescheduleTerms.test(normalized)) {
    return {
      ...base,
      type: 'reschedule_booking',
      confidence: 'high',
      requiresAction: true,
      requiresClarification: true,
    };
  }

  if (
    !extracted.requestedDate
    && !extracted.requestedTime
    && !extracted.requestedDayPart
    && !extracted.notBeforeTime
    && !availabilityTerms.test(normalized)
    && (sideQuestionTerms.test(normalized) || /\?/.test(message) || /^antes[, ]/i.test(message))
    && !/\b(quiero|necesito|deseo|agendar|reservar|cancelar)\b/i.test(normalized)
  ) {
    return {
      ...base,
      type: activeProcess ? 'side_question' : 'none',
      confidence: activeProcess ? 'high' : 'medium',
    };
  }

  if (activeProcess && (extracted.firstName || extracted.lastName || extracted.phone || extracted.email || extracted.managedEntityHint)) {
    return {
      ...base,
      type: 'provide_customer_data',
      confidence: 'high',
      requiresAction: activeProcess,
    };
  }

  if (
    activeProcess
    && processStatus === 'WAITING_FOR_SLOT_SELECTION'
    && (
      extracted.slotId
      || /^\s*\d+\s*$/.test(message)
      || /\b(el de las|la primera opcion|la primera opcion|la primera|el segundo horario|la segunda|ese horario|ese|esa)\b/i.test(normalized)
      || /\b\d{1,2}(?::\d{2})?\s*(?:a|-)\s*\d{1,2}(?::\d{2})?\b/i.test(message)
    )
  ) {
    return {
      ...base,
      type: 'select_slot',
      confidence: extracted.slotId ? 'high' : 'medium',
      requiresAction: true,
      requiresClarification: !extracted.slotId && /\b(ese horario|ese|esa)\b/i.test(normalized),
    };
  }

  if (activeProcess && extracted.offeringId) {
    return {
      ...base,
      type: 'select_offering',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (activeProcess && !/\b(reserv|agend|book)\w*/i.test(normalized) && /\b(servicio|consulta|opcion|opcione?s|primera)\b/i.test(normalized)) {
    return {
      ...base,
      type: 'select_offering',
      confidence: 'medium',
      requiresAction: true,
      requiresClarification: !extracted.offeringId,
    };
  }

  if (activeProcess && (extracted.requestedDate || availabilityTerms.test(normalized))) {
    return {
      ...base,
      type: 'request_availability',
      confidence: extracted.requestedDate ? 'high' : 'medium',
      requiresAction: Boolean(extracted.requestedDate),
      requiresClarification: !extracted.requestedDate,
    };
  }

  if (bookingTerms.test(normalized)) {
    return {
      ...base,
      type: 'start_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (extracted.offeringId && /^\s*\d+\s*$/.test(message)) {
    return {
      ...base,
      type: activeProcess ? 'select_offering' : 'start_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (extracted.offeringId && /\b(me sirve|elijo|escojo|vamos con|esa opcion|ese servicio|quiero ese|quiero esa)\b/i.test(normalized)) {
    return {
      ...base,
      type: activeProcess ? 'select_offering' : 'start_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (extracted.offeringId && /\b(quiero|quisiera|necesito|busco|revision|revisar|evaluacion|evaluar)\b/i.test(normalized)) {
    return {
      ...base,
      type: activeProcess ? 'select_offering' : 'start_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (extracted.offeringId && !symptomReportOnly && /\b(freno|frenos|suspension|undercoating|arenado|detailing|diagnostico|mantenimiento|motor|pintura|precompra)\b/i.test(normalized)) {
    return {
      ...base,
      type: activeProcess ? 'select_offering' : 'start_booking',
      confidence: 'high',
      requiresAction: true,
    };
  }

  if (availabilityTerms.test(normalized)) {
    return {
      ...base,
      type: 'request_availability',
      confidence: 'medium',
      requiresAction: activeProcess && Boolean(extracted.requestedDate),
      requiresClarification: !activeProcess || !extracted.requestedDate,
    };
  }

  if (activeProcess && /^[A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±. ]+$/.test(message) && message.length <= 40) {
    return {
      ...base,
      type: 'provide_customer_data',
      confidence: 'medium',
      requiresAction: Boolean(extracted.firstName || extracted.lastName),
      requiresClarification: !extracted.firstName && !extracted.lastName,
    };
  }

  return {
    ...base,
    type: 'ambiguous',
    confidence: 'low',
    requiresClarification: true,
  };
};
