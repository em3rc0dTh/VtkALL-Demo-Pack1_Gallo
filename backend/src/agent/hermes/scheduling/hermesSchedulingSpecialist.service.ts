import { HermesDispatchPlan } from '../contracts/hermesDispatchPlan.contract';
import {
  HermesSchedulingSlot,
  HermesSchedulingSpecialistProposal,
  HermesSchedulingSpecialistState,
} from '../contracts/hermesSchedulingSpecialist.contract';
import { HermesSkillInvocation, HermesSkillResult } from '../contracts/hermesSkillRegistry.contract';

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const weekdayIndex: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const formatIsoDate = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const resolveRelativeDate = (input: {
  message: string;
  referenceTimestamp: string;
  businessTimezone: string;
}) => {
  const message = input.message;
  const normalized = normalize(message);
  const base = new Date(input.referenceTimestamp);
  if (/\bmanana\b/.test(normalized)) {
    const tomorrow = new Date(base);
    tomorrow.setDate(base.getDate() + 1);
    return {
      originalExpression: 'manana',
      resolvedDate: formatIsoDate(tomorrow, input.businessTimezone),
      timezone: input.businessTimezone,
      resolutionStatus: 'RESOLVED' as const,
    };
  }
  for (const [weekday, index] of Object.entries(weekdayIndex)) {
    if (!new RegExp(`\\b${weekday}\\b`).test(normalized)) continue;
    const current = base.getDay();
    let delta = (index - current + 7) % 7;
    if (delta === 0) delta = 7;
    const next = new Date(base);
    next.setDate(base.getDate() + delta);
    return {
      originalExpression: weekday,
      resolvedDate: formatIsoDate(next, input.businessTimezone),
      timezone: input.businessTimezone,
      resolutionStatus: 'RESOLVED' as const,
    };
  }
  return undefined;
};

const parsePlateCorrection = (message: string) => {
  const matches = [...String(message || '').matchAll(/\b([A-Z]{3}[- ]?\d{3})\b/gi)].map((item) => item[1].replace(/\s+/g, '').toUpperCase());
  if (matches.length >= 2 && /\b(perdon|corrijo|quise decir|mejor dicho)\b/i.test(message)) {
    return { previous: matches[0], next: matches[matches.length - 1] };
  }
  return undefined;
};

const contradictionFrom = (message: string) => {
  const normalized = normalize(message);
  if (/\bquiero el lunes\b/.test(normalized) && /\bno puedo los lunes\b/.test(normalized)) {
    return {
      field: 'preferred_date',
      reason: 'weekday_conflict',
      summary: 'The turn both requests Monday and rejects Monday.',
    };
  }
  return undefined;
};

const nextMissingField = (slots: HermesSchedulingSlot[]) =>
  slots.find((slot) => slot.status === 'missing' || slot.status === 'ambiguous')?.slot;

const slotValue = (value: unknown) => value === undefined ? undefined : String(value);

const buildSlots = (plan: HermesDispatchPlan) => {
  const extracted = plan.assessment.extractedData;
  const turnText = String((plan.assessment as any).turnText || '');
  const temporalContext = plan.skillContext.temporalContext || {
    referenceTimestamp: plan.createdAt,
    businessTimezone: 'America/Lima',
    locale: 'es-PE',
  };
  const relativeDate = !extracted.requestedDate ? resolveRelativeDate({
    message: turnText,
    referenceTimestamp: temporalContext.referenceTimestamp,
    businessTimezone: temporalContext.businessTimezone || 'America/Lima',
  }) : undefined;
  const plateCorrection = parsePlateCorrection(turnText);

  const slots: HermesSchedulingSlot[] = [
    {
      slot: 'customer_identity',
      status: plan.assessment.knownData.customerKnown ? 'known' : 'missing',
      source: plan.assessment.knownData.customerKnown ? 'context' : 'message',
    },
    {
      slot: 'contact_information',
      status: plan.assessment.knownData.phoneKnown || extracted.phonePresent || plan.assessment.knownData.emailKnown || extracted.emailPresent ? 'known' : 'missing',
      source: plan.assessment.knownData.phoneKnown || plan.assessment.knownData.emailKnown ? 'context' : 'message',
    },
    {
      slot: 'managed_entity',
      status: extracted.managedEntityHint || extracted.managedEntityYear || plan.assessment.knownData.managedEntityKnown ? 'known' : 'missing',
      source: plan.assessment.knownData.managedEntityKnown ? 'context' : 'message',
      value: extracted.managedEntityHint || extracted.managedEntityYear,
    },
    {
      slot: 'service',
      status: extracted.offeringId || plan.assessment.knownData.selectedOfferingKnown ? 'known' : 'missing',
      source: extracted.offeringId ? 'message' : plan.assessment.knownData.selectedOfferingKnown ? 'process' : 'message',
      value: slotValue(extracted.offeringId),
    },
    {
      slot: 'temporal_preference',
      status: extracted.requestedDate || relativeDate?.resolvedDate || extracted.requestedTime || extracted.requestedDayPart || extracted.notBeforeTime
        ? (relativeDate?.resolvedDate && !extracted.requestedDate ? 'inferred' : 'declared')
        : 'missing',
      source: relativeDate?.resolvedDate && !extracted.requestedDate ? 'inference' : 'message',
      value: extracted.requestedDate || relativeDate?.resolvedDate || extracted.requestedTime || extracted.requestedDayPart || extracted.notBeforeTime,
    },
    {
      slot: 'slot_selection',
      status: extracted.slotId ? 'pending_authority_validation' : 'not_applicable',
      source: extracted.slotId ? 'message' : 'process',
      value: slotValue(extracted.slotId),
    },
  ];

  if (plateCorrection) {
    slots.push({
      slot: 'managed_entity_plate',
      status: 'corrected',
      source: 'correction',
      value: plateCorrection.next,
    });
  }

  return { slots, relativeDate, plateCorrection };
};

const specialistStateFrom = (args: {
  plan: HermesDispatchPlan;
  missingData: string[];
  contradiction?: { field: string };
  hasProposal: boolean;
}): HermesSchedulingSpecialistState => {
  if (args.contradiction) return 'BLOCKED';
  if (args.plan.decision === 'DECLINE_UNSAFE_REQUEST') return 'ESCALATION_REQUIRED';
  if (args.hasProposal) return 'READY_FOR_AVAILABILITY_CHECK';
  if (args.missingData.length) return 'COLLECTING_REQUIRED_DATA';
  return 'INTENT_IDENTIFIED';
};

const buildProposal = (args: {
  plan: HermesDispatchPlan;
  relativeDate?: {
    originalExpression: string;
    resolvedDate: string;
    timezone: string;
    resolutionStatus: 'RESOLVED';
  };
  missingData: string[];
  possibleDuplicate: boolean;
}) => {
  const extracted = args.plan.assessment.extractedData;
  if (args.missingData.length) return undefined;
  const preferredDate = args.relativeDate;
  const semanticPayload = {
    offeringId: extracted.offeringId || args.plan.skillContext.relevantFacts.offeringId,
    requestedDate: extracted.requestedDate || preferredDate?.resolvedDate,
    requestedTime: extracted.requestedTime,
    requestedDayPart: extracted.requestedDayPart,
    notBeforeTime: extracted.notBeforeTime,
    managedEntityHint: extracted.managedEntityHint,
    possibleDuplicate: args.possibleDuplicate,
  };
  const proposal: HermesSchedulingSpecialistProposal = {
    actionType: 'CHECK_AVAILABILITY_REQUEST',
    semanticPayload,
    inferredData: preferredDate?.resolvedDate && !extracted.requestedDate ? ['preferred_date'] : [],
    missingData: [],
    requiresValidation: ['availability', ...(extracted.slotId ? ['slot_selection'] : [])],
    temporalPreference: {
      preferredDate: preferredDate?.resolvedDate || extracted.requestedDate,
      preferredTime: extracted.requestedTime,
      preferredDayPart: extracted.requestedDayPart,
      notBeforeTime: extracted.notBeforeTime,
      availabilityStatus: 'UNVERIFIED',
      ...(preferredDate ? {
        originalExpression: preferredDate.originalExpression,
        resolvedDate: preferredDate.resolvedDate,
        timezone: preferredDate.timezone,
        resolutionStatus: preferredDate.resolutionStatus,
      } : {}),
    },
    idempotencySeed: `h06d:${args.plan.businessSlug}:${args.plan.conversationId}:${args.plan.turnId}`,
    authorityRequired: 'availability_authority',
    risks: args.possibleDuplicate ? ['possible_duplicate_process'] : [],
    executionAllowed: false,
  };
  return proposal;
};

export const runHermesSchedulingSpecialist = async (input: {
  plan: HermesDispatchPlan;
  invocation: HermesSkillInvocation;
}): Promise<Omit<HermesSkillResult, 'durationMs' | 'producedAt' | 'invocationId' | 'skillId' | 'skillVersion'>> => {
  const { plan } = input;
  const turnText = String((plan.assessment as any).turnText || '');
  const { slots, relativeDate, plateCorrection } = buildSlots(plan);
  const contradiction = contradictionFrom(turnText);
  const sideQuestion = plan.assessment.secondaryIntents.find((intent) =>
    ['price', 'duration', 'compatibility', 'business_information'].includes(intent.type)
  );
  const possibleDuplicate = plan.assessment.activeProcess && (
    plan.decision === 'CONTINUE_ACTIVE_PROCESS'
    || String(plan.assessment.processStatus || '') === 'WAITING_FOR_SLOT_SELECTION'
  );
  const asksForHabitualService = /\b(lo de siempre|como siempre|el de siempre)\b/i.test(turnText);

  const missingData = [...new Set(
    slots
      .filter((slot) => ['missing', 'ambiguous'].includes(slot.status))
      .map((slot) => slot.slot)
      .filter((slot) => slot !== 'slot_selection')
  )];

  if (contradiction) {
    return {
      status: 'NEEDS_INPUT',
      summary: 'Scheduling specialist detected an unresolved contradiction and requests a clarifying answer.',
      missingData: [contradiction.field],
      details: {
        specialistState: 'BLOCKED',
        slots,
        contradictions: [contradiction],
        nextQuestion: 'Que fecha prefieres finalmente para continuar con la solicitud?',
        doNotAskAgain: slots.filter((slot) => slot.status === 'known').map((slot) => slot.slot),
        possibleDuplicate,
      },
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  if (plan.assessment.primaryIntent.type === 'cancel_booking' || plan.assessment.primaryIntent.type === 'reschedule_booking') {
    return {
      status: 'ESCALATE',
      summary: 'Scheduling specialist recognized an out-of-scope scheduling exception that still requires controlled escalation.',
      missingData: [],
      details: {
        specialistState: 'ESCALATION_REQUIRED',
        slots,
        escalationReason: plan.assessment.primaryIntent.type,
      },
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  if (plan.decision === 'DELEGATE_INFORMATIONAL' || plan.assessment.primaryIntent.type === 'side_question') {
    return {
      status: 'ANSWER_READY',
      summary: 'Scheduling specialist can answer the scheduling information question without claiming availability.',
      missingData: [],
      details: {
        specialistState: 'INTENT_IDENTIFIED',
        slots,
        sideQuestion,
      },
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  const proposal = buildProposal({ plan, relativeDate, missingData, possibleDuplicate });
  const specialistState = specialistStateFrom({
    plan,
    missingData,
    contradiction,
    hasProposal: Boolean(proposal),
  });

  if (proposal) {
    return {
      status: 'ACTION_PROPOSAL',
      summary: 'Scheduling specialist prepared a structured availability-check proposal without executing it.',
      missingData: [],
      proposedAction: proposal.actionType,
      details: {
        specialistState,
        slots,
        sideQuestion,
        possibleDuplicate,
        corrections: [
          ...plan.assessment.corrections,
          ...(plateCorrection ? [{
            field: 'managedEntityPlate',
            previousValue: plateCorrection.previous,
            nextValue: plateCorrection.next,
            reason: 'explicit_correction',
          }] : []),
        ],
        proposal,
      },
      fallbackUsed: false,
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
    };
  }

  const prioritizedField = nextMissingField(slots) || missingData[0] || 'clarifying_information';
  const effectivePrioritizedField = asksForHabitualService ? 'service' : prioritizedField;
  const suggestedQuestionMap: Record<string, string> = {
    customer_identity: 'A nombre de quien deseas solicitar la cita?',
    contact_information: 'Que medio de contacto prefieres dejar para continuar?',
    managed_entity: 'Para que vehiculo o entidad necesitas la cita?',
    service: 'Que servicio deseas solicitar?',
    temporal_preference: 'Que fecha prefieres para continuar con la solicitud?',
  };

  return {
    status: 'NEEDS_INPUT',
    summary: 'Scheduling specialist identified the next minimum data needed to continue the request.',
    missingData: [prioritizedField],
    details: {
      specialistState,
      slots,
      sideQuestion,
      possibleDuplicate,
      relativeDate: relativeDate?.resolvedDate,
      temporalResolution: relativeDate,
      prioritizedMissingField: effectivePrioritizedField,
      nextQuestion: suggestedQuestionMap[effectivePrioritizedField] || 'Que dato deseas confirmar para continuar?',
      doNotAskAgain: slots.filter((slot) => slot.status === 'known').map((slot) => slot.slot),
      processStatus: plan.assessment.processStatus,
      corrections: [
        ...plan.assessment.corrections,
        ...(plateCorrection ? [{
          field: 'managedEntityPlate',
          previousValue: plateCorrection.previous,
          nextValue: plateCorrection.next,
          reason: 'explicit_correction',
        }] : []),
      ],
    },
    fallbackUsed: false,
    ownerRetainedByHermes: true,
    actionExecutionAllowed: false,
  };
};
