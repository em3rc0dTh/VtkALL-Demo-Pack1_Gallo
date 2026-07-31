import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { HermesAvailabilityPresentation, naturalizeAvailabilityReply } from './hermesSchedulingAvailabilityPresentation.service';
import { HermesSchedulingBridgeTurnResult } from './hermesSchedulingExecution.contract';

type NaturalizationInput = {
  message: string;
  context: HermesReadOnlyContext;
  intent: HermesSchedulingIntent;
  processContext?: AgentProcessContext;
  bridgeOutcome: HermesSchedulingBridgeTurnResult['bridgeOutcome'];
  sideQuestionAnswer?: string;
  availabilityPresentation?: HermesAvailabilityPresentation;
};

const offeringPrompt = (context: HermesReadOnlyContext) => {
  const names = (context.catalog || []).slice(0, 3).map((offering) => offering.name || offering.id).filter(Boolean);
  return names.length
    ? `Claro. Que servicio deseas? Puedo ayudarte con ${names.join(', ')}.`
    : 'Claro. Que servicio deseas reservar?';
};

const nextFieldPrompt = (field?: string) => {
  const normalized = String(field || '').toLowerCase();
  if (normalized.includes('firstname') || normalized.includes('nombre')) return '¿A nombre de quien registro la evaluacion?';
  if (normalized.includes('lastname') || normalized.includes('apellido')) return 'Gracias. ¿Me compartes tu apellido para dejarlo completo?';
  if (normalized.includes('phone') || normalized.includes('telefono')) return 'Perfecto. ¿Que numero de contacto usamos para coordinar la cita?';
  if (normalized.includes('email')) return 'Perfecto. ¿A que correo podemos enviarte la informacion, si deseas dejar uno?';
  if (normalized.includes('managedentity') || normalized.includes('vehiculo') || normalized.includes('entidad')) {
    return 'Genial. ¿Que vehiculo revisamos? Con marca y modelo me basta.';
  }
  return 'Me falta un dato mas para dejar la reserva bien registrada.';
};

const confirmedWindowReply = (processContext?: AgentProcessContext) => {
  const rawState: any = processContext?.rawState || {};
  const envelope: any = rawState.appointment || {};
  const reservation = envelope.reservation;
  const appointment = envelope.appointment;
  if (!reservation?._id || !appointment?._id) return undefined;

  const timezone = String(reservation.timezone || appointment.timezone || rawState.selectedOffering?.timezone || 'America/Lima');
  const startAt = new Date(String(reservation.startAt || appointment.scheduledStart || envelope.slot?.startAt || ''));
  const endAt = new Date(String(reservation.endAt || appointment.scheduledEnd || envelope.slot?.endAt || ''));
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return undefined;

  const dateLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(startAt);
  const startLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(startAt);
  const endLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(endAt);

  return `Listo, tu cita quedo confirmada para ${dateLabel} de ${startLabel} a ${endLabel}.`;
};

const slotUnavailableReply = (processContext?: AgentProcessContext) => {
  const errors = Array.isArray((processContext?.rawState as any)?.errors) ? (processContext?.rawState as any)?.errors : [];
  const combined = errors.map((item: unknown) => String(item || '')).join(' ').toLowerCase();
  if (!combined) return undefined;
  if (/(double_booking_conflict|slot_unavailable|ya no|not available|occup)/i.test(combined)) {
    return 'Ese horario ya no esta disponible. No voy a elegir otro automaticamente. Puedo revisar horarios de nuevo o puedes escoger otro de los visibles.';
  }
  if (/slot no visible/i.test(combined)) {
    return 'Ese horario no coincide con los slots autorizados que siguen visibles. Elige uno de la lista actual.';
  }
  return undefined;
};

export const answerHermesSchedulingSideQuestion = (
  message: string,
  context: HermesReadOnlyContext,
  processContext?: AgentProcessContext
) => {
  const normalized = message.toLowerCase();
  const offering = (processContext?.knownFacts?.offering as any) || context.catalog?.[0];
  const durationMinutes = Number(
    offering?.durationMinutes
    || offering?.fulfillmentPolicy?.estimatedDurationMinutes
    || 0
  ) || undefined;
  const reminder = processContext?.awaiting?.type === 'slot_selection'
    ? ' Los horarios que te mostre todavia no estan reservados. Cual prefieres?'
    : ` ${nextFieldPrompt(processContext?.awaiting?.nextRecommendedField)}`;

  if (/(cuanto dura|cuánto dura|duracion|duración|dura|duration)/.test(normalized) && durationMinutes) {
    return `La consulta dura aproximadamente ${durationMinutes} minutos.${reminder}`;
  }

  if (/precio|cuesta|price/.test(normalized)) {
    const pricingType = (offering as any)?.pricing?.type;
    if (pricingType === 'published' && (offering as any)?.pricing?.currency) {
      return `Puedo orientarte con el servicio, pero no voy a inventar un precio distinto del autorizado.${reminder}`;
    }
    return `El precio no esta publicado en el contexto autorizado.${reminder}`;
  }

  if (/donde|dónde|ubicad|direccion|dirección|queda/.test(normalized)) {
    return `No veo una direccion publicada en el contexto autorizado.${reminder}`;
  }

  return undefined;
};

export const deterministicHermesSchedulingReply = (input: NaturalizationInput) => {
  if (input.sideQuestionAnswer) return input.sideQuestionAnswer;
  if (input.bridgeOutcome === 'EXECUTION_UNKNOWN') {
    return 'No pude verificar todavia si el proceso avanzo. No voy a repetir la accion para evitar duplicarla.';
  }

  if (input.availabilityPresentation) {
    return naturalizeAvailabilityReply(input.availabilityPresentation);
  }

  const processContext = input.processContext;
  if (!processContext) return 'Seguimos con tu reserva.';

  const confirmedReply = confirmedWindowReply(processContext);
  if (confirmedReply) return confirmedReply;

  const unavailableReply = slotUnavailableReply(processContext);
  if (unavailableReply) return unavailableReply;

  if (processContext.awaiting.type === 'offering_selection') {
    return offeringPrompt(input.context);
  }

  if (processContext.awaiting.type === 'customer_information' || processContext.awaiting.type === 'managed_entity_information') {
    const offeringName = (processContext.knownFacts.offering as any)?.name;
    const prefix = offeringName ? `Perfecto, lo llevamos como ${offeringName}. ` : '';
    return `${prefix}${nextFieldPrompt(processContext.awaiting.nextRecommendedField)}`;
  }

  if (processContext.awaiting.type === 'slot_selection') {
    return 'Ya tengo horarios disponibles. Dime cual prefieres y lo confirmo.';
  }

  return 'El proceso continua por el flujo actual.';
};
