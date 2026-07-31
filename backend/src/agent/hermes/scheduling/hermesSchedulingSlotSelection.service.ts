import crypto from 'crypto';
import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';

type SlotLike = {
  _id?: string;
  id?: string;
  teamId?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
};

type SlotTokenClaims = {
  v: 1;
  businessSlug: string;
  conversationId: string;
  workflowId: string;
  offeringId: string;
  slotId: string;
  teamId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  date: string;
  exp: number;
};

type SlotSelectionInput = {
  businessSlug: string;
  conversationId: string;
  message: string;
  processContext?: AgentProcessContext;
  context: HermesReadOnlyContext;
};

type ResolvedSlotSelection =
  | {
      status: 'resolved';
      slotId: string;
      matchedBy: 'token' | 'slot_id' | 'ordinal' | 'time_range' | 'start_time' | 'single_visible_slot';
    }
  | {
      status: 'clarification_required';
      code: 'SLOT_REFERENCE_AMBIGUOUS';
      message: string;
    }
  | {
      status: 'rejected';
      code:
        | 'AUTHORITATIVE_SLOT_REQUIRED'
        | 'SLOT_TOKEN_INVALID'
        | 'SLOT_TOKEN_EXPIRED'
        | 'SLOT_SCOPE_MISMATCH'
        | 'SLOT_REFERENCE_NOT_FOUND'
        | 'PROCESS_NOT_READY_FOR_SLOT_SELECTION';
      message: string;
    };

type SlotMatchMode = 'token' | 'slot_id' | 'ordinal' | 'time_range' | 'start_time' | 'single_visible_slot';

const DEFAULT_TIMEZONE = 'America/Lima';
const SLOT_TOKEN_TTL_MS = 30 * 60 * 1000;

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const slotIdOf = (slot: SlotLike) => String(slot?._id || slot?.id || '');

const toIso = (value: unknown) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const formatTime = (value: unknown, timezone: string) => {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const dateInTimezone = (value: unknown, timezone: string) => {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const tokenSecret = () =>
  process.env.HERMES_BOOKING_TOKEN_SECRET
  || process.env.HERMES_API_KEY
  || process.env.HERMES_MODEL_NAME
  || 'local-hermes-slot-token-secret';

const signClaims = (serializedClaims: string) =>
  crypto.createHmac('sha256', tokenSecret()).update(serializedClaims).digest('base64url');

const authoritativeSlotsFrom = (processContext?: AgentProcessContext) => {
  const rawState: any = processContext?.rawState || {};
  return Array.isArray(rawState.availableSlots) ? rawState.availableSlots : [];
};

export const buildHermesSlotToken = (input: {
  businessSlug: string;
  conversationId: string;
  processContext?: AgentProcessContext;
  slot: SlotLike;
  timezone?: string;
}) => {
  const rawState: any = input.processContext?.rawState || {};
  const workflowId = String(input.processContext?.process?.workflowId || rawState.workflowId || '');
  const offeringId = String(rawState.selectedOffering?._id || rawState.selectedOffering?.id || '');
  const slotId = slotIdOf(input.slot);
  const timezone = String(input.timezone || input.slot?.timezone || rawState.selectedOffering?.timezone || DEFAULT_TIMEZONE);
  const claims: SlotTokenClaims = {
    v: 1,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId,
    offeringId,
    slotId,
    teamId: String(input.slot?.teamId || ''),
    startAt: toIso(input.slot?.startAt),
    endAt: toIso(input.slot?.endAt),
    timezone,
    date: dateInTimezone(input.slot?.startAt, timezone),
    exp: Date.now() + SLOT_TOKEN_TTL_MS,
  };
  const serialized = JSON.stringify(claims);
  const signature = signClaims(serialized);
  return `slot_${Buffer.from(serialized).toString('base64url')}.${signature}`;
};

const parseSlotToken = (token: string): SlotTokenClaims | null => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken.startsWith('slot_')) return null;
  const body = normalizedToken.slice(5);
  const separator = body.lastIndexOf('.');
  if (separator <= 0) return null;
  const encodedClaims = body.slice(0, separator);
  const providedSignature = body.slice(separator + 1);
  try {
    const serialized = Buffer.from(encodedClaims, 'base64url').toString('utf8');
    const expectedSignature = signClaims(serialized);
    const providedBytes = Buffer.from(providedSignature);
    const expectedBytes = Buffer.from(expectedSignature);
    if (providedBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(providedBytes, expectedBytes)) {
      return null;
    }
    const claims = JSON.parse(serialized) as SlotTokenClaims;
    return claims?.v === 1 ? claims : null;
  } catch {
    return null;
  }
};

const tokenFromMessage = (message: string) =>
  String(message || '').match(/\bslot_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/)?.[0];

const ordinalSelection = (message: string) => {
  const normalized = normalize(message);
  if (/\b(primera|primer|1ra|1era|first)\b/.test(normalized)) return 0;
  if (/\b(segunda|segundo|2da|2do|second)\b/.test(normalized)) return 1;
  if (/\b(tercera|tercero|3ra|3ro|third)\b/.test(normalized)) return 2;
  return undefined;
};

const timeRangeSelection = (message: string) => {
  const match = normalize(message).match(/\b(\d{1,2})(?::(\d{2}))?\s*(?:a|-)\s*(\d{1,2})(?::(\d{2}))?\b/);
  if (!match) return undefined;
  return {
    start: `${String(Number(match[1])).padStart(2, '0')}:${String(Number(match[2] || '0')).padStart(2, '0')}`,
    end: `${String(Number(match[3])).padStart(2, '0')}:${String(Number(match[4] || '0')).padStart(2, '0')}`,
  };
};

const startTimeSelection = (message: string) => {
  const range = timeRangeSelection(message);
  if (range) return range.start;
  const match = normalize(message).match(/\b(?:el de las|a las|de las)\s+(\d{1,2})(?::(\d{2}))?\b/);
  if (!match) return undefined;
  return `${String(Number(match[1])).padStart(2, '0')}:${String(Number(match[2] || '0')).padStart(2, '0')}`;
};

const matchSlotsByStartTime = (slots: SlotLike[], requestedTime: string, timezone: string) =>
  slots.filter((slot) => formatTime(slot?.startAt, timezone) === requestedTime);

const matchSlotsByTimeRange = (slots: SlotLike[], requestedStart: string, requestedEnd: string, timezone: string) =>
  slots.filter((slot) =>
    formatTime(slot?.startAt, timezone) === requestedStart
    && formatTime(slot?.endAt, timezone) === requestedEnd
  );

const resolveSingleAuthoritativeSlot = (
  slots: SlotLike[],
  matchedBy: SlotMatchMode
): ResolvedSlotSelection => {
  if (slots.length === 1) {
    return {
      status: 'resolved',
      slotId: slotIdOf(slots[0]),
      matchedBy,
    };
  }
  if (slots.length > 1) {
    return {
      status: 'clarification_required',
      code: 'SLOT_REFERENCE_AMBIGUOUS',
      message: 'Tengo mas de un horario que coincide con esa referencia. Indica uno exacto de los horarios visibles.',
    };
  }
  return {
    status: 'rejected',
    code: 'SLOT_REFERENCE_NOT_FOUND',
    message: 'Ese horario ya no coincide con los slots autorizados que siguen visibles. Elige uno de la lista actual.',
  };
};

export const resolveHermesSlotSelection = (input: SlotSelectionInput): ResolvedSlotSelection => {
  if (String(input.processContext?.process?.status || '') !== 'WAITING_FOR_SLOT_SELECTION') {
    return {
      status: 'rejected',
      code: 'PROCESS_NOT_READY_FOR_SLOT_SELECTION',
      message: 'El proceso actual todavia no esta listo para confirmar un horario.',
    };
  }

  const slots = authoritativeSlotsFrom(input.processContext);
  if (!slots.length) {
    return {
      status: 'rejected',
      code: 'AUTHORITATIVE_SLOT_REQUIRED',
      message: 'No hay slots autorizados visibles para seleccionar en este momento.',
    };
  }

  const rawState: any = input.processContext?.rawState || {};
  const workflowId = String(input.processContext?.process?.workflowId || rawState.workflowId || '');
  const offeringId = String(rawState.selectedOffering?._id || rawState.selectedOffering?.id || '');
  const timezone = String(input.context.business?.timezone || DEFAULT_TIMEZONE);
  const normalizedMessage = normalize(input.message);

  const explicitToken = tokenFromMessage(input.message);
  if (explicitToken) {
    const claims = parseSlotToken(explicitToken);
    if (!claims) {
      return {
        status: 'rejected',
        code: 'SLOT_TOKEN_INVALID',
        message: 'El token del horario no es valido.',
      };
    }
    if (claims.exp <= Date.now()) {
      return {
        status: 'rejected',
        code: 'SLOT_TOKEN_EXPIRED',
        message: 'Ese horario ya expiro. Vuelve a pedir disponibilidad antes de confirmarlo.',
      };
    }
    if (
      claims.businessSlug !== input.businessSlug
      || claims.conversationId !== input.conversationId
      || claims.workflowId !== workflowId
      || claims.offeringId !== offeringId
    ) {
      return {
        status: 'rejected',
        code: 'SLOT_SCOPE_MISMATCH',
        message: 'Ese horario no pertenece a esta conversacion o al flujo activo.',
      };
    }
    const authoritativeSlot = slots.find((slot: SlotLike) => {
      const slotTimezone = String(slot?.timezone || timezone);
      return slotIdOf(slot) === claims.slotId
        && String(slot?.teamId || '') === claims.teamId
        && toIso(slot?.startAt) === claims.startAt
        && toIso(slot?.endAt) === claims.endAt
        && dateInTimezone(slot?.startAt, slotTimezone) === claims.date;
    });
    if (!authoritativeSlot) {
      return {
        status: 'rejected',
        code: 'AUTHORITATIVE_SLOT_REQUIRED',
        message: 'Ese horario ya no coincide con los slots autorizados que siguen visibles. Elige uno de la lista actual.',
      };
    }
    return {
      status: 'resolved',
      slotId: claims.slotId,
      matchedBy: 'token',
    };
  }

  const rawSlotId = String(input.message || '').match(/\bslot[_-]?[A-Za-z0-9_-]+\b/i)?.[0];
  if (rawSlotId) {
    const exact = slots.find((slot: SlotLike) => slotIdOf(slot) === rawSlotId);
    if (!exact) {
      return {
        status: 'rejected',
        code: 'AUTHORITATIVE_SLOT_REQUIRED',
        message: 'Ese identificador de horario no pertenece a los slots autorizados de esta conversacion.',
      };
    }
    return {
      status: 'resolved',
      slotId: rawSlotId,
      matchedBy: 'slot_id',
    };
  }

  const ordinal = ordinalSelection(input.message);
  if (ordinal !== undefined) {
    const selected = slots[ordinal];
    if (!selected) {
      return {
        status: 'rejected',
        code: 'SLOT_REFERENCE_NOT_FOUND',
        message: 'La opcion que indicaste no existe dentro de los horarios visibles.',
      };
    };
    return {
      status: 'resolved',
      slotId: slotIdOf(selected),
      matchedBy: 'ordinal',
    };
  }

  const requestedRange = timeRangeSelection(input.message);
  if (requestedRange) {
    return resolveSingleAuthoritativeSlot(
      matchSlotsByTimeRange(slots, requestedRange.start, requestedRange.end, timezone),
      'time_range'
    );
  }

  const requestedStartTime = startTimeSelection(input.message);
  if (requestedStartTime) {
    return resolveSingleAuthoritativeSlot(
      matchSlotsByStartTime(slots, requestedStartTime, timezone),
      'start_time'
    );
  }

  if (/\b(ese horario|esa hora|ese|esa)\b/.test(normalizedMessage)) {
    if (slots.length === 1) {
      return {
        status: 'resolved',
        slotId: slotIdOf(slots[0]),
        matchedBy: 'single_visible_slot',
      };
    }
    return {
      status: 'clarification_required',
      code: 'SLOT_REFERENCE_AMBIGUOUS',
      message: 'Necesito que me indiques cual de los horarios visibles quieres confirmar.',
    };
  }

  return {
    status: 'rejected',
    code: 'SLOT_REFERENCE_NOT_FOUND',
    message: 'No pude vincular ese mensaje con un horario autorizado. Elige uno de los horarios visibles.',
  };
};
