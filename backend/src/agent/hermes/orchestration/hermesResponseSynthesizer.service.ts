import { recordAgentConversationMessage } from '../../../services/agentConversation.service';
import {
  HermesResponseCandidate,
  ResponseSynthesisInput,
} from '../contracts/hermesResponseCandidate.contract';
import {
  buildAutomotiveGuidanceReply,
  buildExternalDomainReply,
  isAutomotiveSemanticIntent,
} from '../routing/hermesSemanticTurn.service';

const titleCaseTime = (value?: string) => {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':').map(Number);
    const suffix = hour >= 12 ? 'p. m.' : 'a. m.';
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalizedHour}:${String(minute).padStart(2, '0')} ${suffix}`;
  }
  return value;
};

const sentenceEnd = (value: string) => (/[.!?]$/.test(value.trim()) ? '' : '.');

const appointmentBookedReply = (input: ResponseSynthesisInput) => {
  const status = String(input.activeProcessSummary?.status || input.readOnlyContext?.process?.status || '');
  if (status !== 'APPOINTMENT_BOOKED') return undefined;

  const startAt = new Date(String(input.knownFacts.reservationStartAt || ''));
  const endAt = new Date(String(input.knownFacts.reservationEndAt || ''));
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return 'Listo, tu cita quedo confirmada.';
  }

  const timezone = input.businessTimezone || input.readOnlyContext?.business?.timezone || 'America/Lima';
  const dateLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(startAt);
  const startLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(startAt);
  const endLabel = new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(endAt);

  const reply = `Listo, tu cita quedo confirmada para el ${dateLabel}, de ${startLabel} a ${endLabel}`;
  return `${reply}${sentenceEnd(reply)}`;
};

const sanitizeText = (value: string) =>
  String(value || '')
    .replace(/\bscheduling-specialist\b/gi, 'especialista')
    .replace(/\bcatalog-advisor\b/gi, 'asesor')
    .replace(/\brecovery-escalation\b/gi, 'equipo')
    .replace(/\bfirstName\b/g, 'nombre')
    .replace(/\blastName\b/g, 'apellido')
    .replace(/\bmanagedEntityDisplayName\b/g, 'vehiculo')
    .replace(/\bmanagedEntityDescription\b/g, 'vehiculo')
    .replace(/\bpreferredDate\b/g, 'fecha')
    .replace(/\bselectedSlotId\b/g, 'horario')
    .trim();

const dedupeSequentialParts = (parts: Array<string | undefined>) => {
  const filtered = parts.filter((part): part is string => Boolean(part));
  return filtered.filter((part, index) => index === 0 || part !== filtered[index - 1]);
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const hasCasualGreeting = (message: string) =>
  /^(hola|hola+|holis|hello|hi|hey|buenas|que tal|como estas|que onda|bro|brother)\b/.test(normalize(message).trim());

const hasCatalogQuestion = (message: string) =>
  /\b(servicio|servicios|catalogo|opciones|ofrecen|ofreces|tienen|tienes|service|services|offer|offers|options|list)\b/.test(normalize(message));

const hasPriceQuestion = (message: string) =>
  /\b(precio|cuesta|costo|vale|tarifa|cobra|cobran|price|cost)\b/.test(normalize(message));

const hasDurationQuestion = (message: string) =>
  /\b(cuanto demora|cuanto dura|duracion|demora|dura|tiempo|minutos|horas|duration|how long)\b/.test(normalize(message));

const hasComparisonQuestion = (message: string) =>
  /\b(compara|comparar|diferencia|diferencias|mejor|conviene|versus|vs)\b/.test(normalize(message));
const hasOptionsQuestion = (message: string) =>
  /\b(cuales|cuales tienes|cuáles|que horarios|qué horarios|horarios|opciones|disponibles|muestrame|muéstrame|cuales son|cuáles son)\b/.test(normalize(message));

const hasIdentityQuestion = (message: string) =>
  /\b(quien eres|quién eres|como te llamas|cómo te llamas|quien sos|quién sos)\b/.test(normalize(message));

const hasUnsupportedServiceRequest = (message: string) =>
  /\b(quiero|quisiera|necesito|busco|me haces|preparame|prepárame|dame)\b/.test(normalize(message));

const hasGenericBookingRequest = (message: string) =>
  /\b(quiero|quisiera|necesito|busco)\b.*\b(cita|reserva|reservar|agendar|turno)\b|\b(agendar|reservar)\b/.test(normalize(message));

const hasMemoryRecallQuestion = (message: string) =>
  /\b(recuerdas|te acuerdas|cuando te dije|lo que te dije|eso que te dije|hablamos)\b/i.test(normalize(message));

const hasReviewIntent = (message: string) =>
  /\b(quiero|quisiera|necesito|busco|revision|revisar|evaluacion|evaluar|cita|agendar|reservar)\b/.test(normalize(message));

const publicPersonaName = (name?: string) => {
  const normalized = normalize(String(name || '').trim());
  return !normalized || normalized === 'demo agent' ? 'Iris' : String(name).trim();
};

const naturalCatalogPrompt = (input: ResponseSynthesisInput) => {
  const catalog = input.readOnlyContext?.catalog || [];
  if (!catalog.length) return 'Cuentame que necesitas y te ayudo a ubicar el servicio correcto.';
  if (hasCatalogQuestion(input.userMessage) && catalog.length === 1) {
    const offering = catalog[0];
    return `Claro. Tengo ${String(offering?.name || 'un servicio disponible')}. Si te interesa, te ayudo a agendarlo.`;
  }
  const names = catalog
    .map((item) => String(item?.name || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  const intro = hasCasualGreeting(input.userMessage)
    ? 'Hola, aqui estoy contigo.'
    : hasCatalogQuestion(input.userMessage)
      ? 'Claro.'
      : 'Perfecto.';

  return `${intro} Puedo ayudarte con ${names.join(', ')}. Cual te interesa?`;
};

const knownFirstNameFrom = (input: ResponseSynthesisInput) => {
  const knownFirstName = String(input.readOnlyContext?.process?.knownFacts?.firstName || '').trim();
  if (knownFirstName) return knownFirstName;
  const memoryFirstName = input.readOnlyContext?.conversation?.memory?.salientFacts
    ?.find((fact: any) => fact.key === 'customer.firstName')?.value;
  if (memoryFirstName) return String(memoryFirstName).trim();
  const displayName = String(input.readOnlyContext?.customer?.displayName || '').trim();
  return displayName.split(/\s+/)[0] || '';
};

const memoryRecallAnswer = (input: ResponseSynthesisInput) => {
  if (!hasMemoryRecallQuestion(input.userMessage)) return undefined;
  const memory = input.readOnlyContext?.conversation?.memory;
  const facts = memory?.salientFacts || [];
  const symptom = facts.find((fact: any) => String(fact.key || '').startsWith('symptom.brakes'))?.value;
  const trigger = facts.find((fact: any) => fact.key === 'symptom.brakes.trigger')?.value;
  const topic = memory?.activeTopic || (symptom ? 'un ruido en frenos' : undefined);
  if (!topic && !memory?.summary) return undefined;
  const remembered = [
    topic ? `Si, tengo presente que venimos hablando de ${topic}` : 'Si, tengo presente lo que me comentaste',
    symptom && typeof symptom === 'string' ? `Me dijiste: "${symptom.slice(0, 120)}"` : undefined,
    trigger ? `y que aparece ${trigger}` : undefined,
  ].filter(Boolean).join('. ');
  return `${remembered}.`;
};

const nextFieldPrompt = (field: string | undefined, input: ResponseSynthesisInput) => {
  const normalized = String(field || '').toLowerCase();
  const firstName = knownFirstNameFrom(input);
  if (normalized.includes('firstname') || normalized.includes('nombre')) {
    return 'Claro, lo vemos. ¿A nombre de quien registro la evaluacion?';
  }
  if (normalized.includes('lastname') || normalized.includes('apellido')) {
    return firstName
      ? `Gracias, ${firstName}. ¿Me compartes tu apellido para dejarlo completo?`
      : 'Gracias. ¿Me compartes tu apellido para dejarlo completo?';
  }
  if (normalized.includes('phone') || normalized.includes('telefono')) {
    return 'Perfecto. ¿Que numero de contacto usamos para coordinar la cita?';
  }
  if (normalized.includes('email')) return 'Perfecto. ¿A que correo podemos enviarte la informacion, si deseas dejar uno?';
  if (normalized.includes('managedentity') || normalized.includes('vehiculo') || normalized.includes('entidad')) {
    return 'Genial. ¿Que vehiculo revisamos? Con marca y modelo me basta.';
  }
  return 'Me falta un dato mas para dejar la reserva bien registrada.';
};

const formatVisibleSlotOption = (slot: { startAt?: string; endAt?: string; label?: string }, index: number) => {
  if (slot.label) return `${index + 1}. ${slot.label}`;
  if (!slot.startAt) return `${index + 1}. Horario disponible`;
  const start = new Date(slot.startAt);
  const end = slot.endAt ? new Date(slot.endAt) : undefined;
  const startLabel = Number.isNaN(start.getTime())
    ? slot.startAt
    : new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(start);
  const endLabel = !end || Number.isNaN(end.getTime())
    ? undefined
    : new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
    }).format(end);
  return `${index + 1}. ${startLabel}${endLabel ? ` - ${endLabel}` : ''}`;
};

const visibleSlotPrompt = (input: ResponseSynthesisInput) => {
  const slots = input.readOnlyContext?.process?.availableOptions || [];
  if (!slots.length) return 'No veo horarios disponibles para esa fecha. Si quieres, probamos con otro dia.';
  return `Tengo estos espacios disponibles:\n${slots.map(formatVisibleSlotOption).join('\n')}\n¿Cual te acomoda mejor?`;
};

const nextAwaitingPrompt = (input: ResponseSynthesisInput) => {
  const awaitingType = String(input.turnAssessment.awaiting?.type || '').toLowerCase();
  const nextRecommendedField = input.turnAssessment.awaiting?.nextRecommendedField;

  if (awaitingType === 'offering_selection') {
    return naturalCatalogPrompt(input);
  }

  if (awaitingType === 'customer_information' || awaitingType === 'managed_entity_information') {
    return nextFieldPrompt(nextRecommendedField, input);
  }

  if (awaitingType === 'date_preference') {
    return 'Listo, ya tengo los datos principales. ¿Que dia te acomoda para revisar disponibilidad?';
  }

  if (awaitingType === 'slot_selection') {
    return visibleSlotPrompt(input);
  }

  return undefined;
};

const softProcessContinuation = (input: ResponseSynthesisInput) => {
  if (!input.turnAssessment.activeProcess) return undefined;
  return nextAwaitingPrompt(input);
};

const knownOfferingDuration = (input: ResponseSynthesisInput) => {
  const catalog = input.readOnlyContext?.catalog || [];
  if (input.knownFacts.durationMinutes) return input.knownFacts.durationMinutes;
  const selectedOffering: any = input.knownFacts.selectedOffering;
  if (selectedOffering?.fulfillmentPolicy?.estimatedDurationMinutes) {
    return selectedOffering.fulfillmentPolicy.estimatedDurationMinutes;
  }
  if (selectedOffering?.durationMinutes) return selectedOffering.durationMinutes;
  const offeringId = String(
    input.knownFacts.offeringId
    || input.knownFacts.catalogMatchOfferingId
    || (input.readOnlyContext?.process?.knownFacts?.offering as any)?._id
    || (input.readOnlyContext?.process?.knownFacts?.offering as any)?.id
    || ''
  ).trim();
  const processOffering: any = input.readOnlyContext?.process?.knownFacts?.offering;
  if (processOffering?.fulfillmentPolicy?.estimatedDurationMinutes) {
    return processOffering.fulfillmentPolicy.estimatedDurationMinutes;
  }
  if (processOffering?.durationMinutes) return processOffering.durationMinutes;
  const matched: any = offeringId
    ? catalog.find((item) => String(item?.id || (item as any)?._id || '').trim() === offeringId)
    : catalog[0];
  return matched?.durationMinutes || matched?.fulfillmentPolicy?.estimatedDurationMinutes;
};

const sideAnswerFrom = (input: ResponseSynthesisInput) => {
  const types = input.sideQuestions.map((item) => item.type);
  if (types.includes('duration')) {
    const duration = knownOfferingDuration(input);
    return duration
      ? `La consulta dura aproximadamente ${duration} minutos.`
      : 'La duracion depende del tipo de evaluacion y todavia no tengo un tiempo confirmado para este caso.';
  }
  if (types.includes('price')) {
    return 'Todavia no tengo un precio confirmado para este caso dentro de esta solicitud.';
  }
  if (types.includes('compatibility')) {
    return 'Puedo continuar con la solicitud, pero esa compatibilidad necesita confirmacion adicional.';
  }
  if (types.includes('business_information')) {
    return 'Puedo ayudarte con esa informacion general, pero primero mantengo el proceso actual en orden.';
  }
  return undefined;
};

const minimalDomainFallback = async (input: ResponseSynthesisInput) => {
  if (input.activeProcessSummary?.active) return undefined;
  const primaryIntent = input.turnAssessment.primaryIntent.type;
  if (isAutomotiveSemanticIntent(primaryIntent)) {
    return await buildAutomotiveGuidanceReply({
      message: input.userMessage,
      context: input.readOnlyContext,
      semantic: {
        intent: primaryIntent as any,
        confidence: input.turnAssessment.primaryIntent.confidence,
        automotiveTopic: input.turnAssessment.primaryIntent.summary,
        reasonCode: 'VISIBLE_RUNTIME_FALLBACK',
      },
    });
  }
  if (hasReviewIntent(input.userMessage)) {
    return 'Entiendo. Puedo ayudarte a coordinar una evaluacion con la informacion que compartiste.';
  }
  return 'Entiendo lo que comentas. Para orientarte bien necesito mantenerlo sin diagnosticar una causa no confirmada.';
};

const currentTurnAnswer = async (input: ResponseSynthesisInput) => {
  const personaName = publicPersonaName(input.agentPersona?.name);
  const catalog = input.readOnlyContext?.catalog || [];
  const catalogMatchStatus = String(input.knownFacts.catalogMatchStatus || '').trim();
  const primaryIntent = input.turnAssessment.primaryIntent.type;

  if (hasIdentityQuestion(input.userMessage)) {
    return `Soy ${personaName}. Estoy aqui para ayudarte con informacion, servicios y reservas.`;
  }

  if (input.turnAssessment.arbitration?.lane === 'identity_recovery') {
    if (input.readOnlyContext?.customer?.identityStatus === 'identified' || input.knownFacts.recoveredCustomerName) {
      const customerName = String(input.knownFacts.recoveredCustomerName || input.readOnlyContext?.customer?.displayName || '').trim();
      const managedEntityName = String(input.knownFacts.recoveredManagedEntityName || input.readOnlyContext?.managedEntity?.displayName || '').trim();
      const parts = [
        customerName ? `Te encontre, ${customerName}` : 'Te encontre en nuestro historial',
        managedEntityName ? `Veo asociado ${managedEntityName}` : undefined,
      ].filter(Boolean);
      return `${parts.join('. ')}. Cuentame que necesitas y seguimos con esa informacion.`;
    }
    if (input.knownFacts.identityLookupAttempted && input.knownFacts.identityLookupMatched === false) {
      return 'No encontre una conversacion previa con ese dato. Igual podemos empezar desde aqui. Cuentame que necesitas revisar.';
    }
    return 'Gracias. Tomo ese dato para revisar la continuidad de la atencion. No necesito ningun codigo de seguridad por aqui; cuentame en que te ayudo y seguimos desde lo que corresponda.';
  }

  if (input.turnAssessment.arbitration?.lane === 'clearly_external' || primaryIntent === 'off_domain') {
    return await buildExternalDomainReply({ message: input.userMessage, context: input.readOnlyContext });
  }

  const sideAnswer = sideAnswerFrom(input);
  if (sideAnswer && input.activeProcessSummary?.active) return sideAnswer;

  if (isAutomotiveSemanticIntent(primaryIntent) || primaryIntent === 'active_process_question') {
    return await minimalDomainFallback(input);
  }

  const memoryRecall = memoryRecallAnswer(input);
  if (memoryRecall) return memoryRecall;

  if (hasCasualGreeting(input.userMessage)) {
    const alreadyGreeted = (input.readOnlyContext?.conversation?.history || [])
      .slice(-4)
      .some((entry) => entry.role === 'assistant' && /\bhola\b/i.test(entry.content) && new RegExp(`\\b${personaName}\\b`, 'i').test(entry.content));
    const userAlreadyNamedAgent = new RegExp(`\\b${personaName}\\b`, 'i').test(input.userMessage);
    return alreadyGreeted || userAlreadyNamedAgent
      ? 'Aqui estoy contigo. Cuentame que necesitas revisar o resolver.'
      : `Hola, soy ${personaName}. En que puedo ayudarte?`;
  }

  if (hasCatalogQuestion(input.userMessage)) {
    if (String(input.turnAssessment.awaiting?.type || '').toLowerCase() === 'slot_selection' && hasOptionsQuestion(input.userMessage)) {
      return visibleSlotPrompt(input);
    }
    if (!catalog.length) return 'Ahora mismo no veo servicios publicos cargados.';
    if (catalog.length === 1) {
      const offering = catalog[0];
      return `Actualmente contamos con ${String(offering.name || 'un servicio disponible')}.`;
    }
    const names = catalog
      .map((item) => String(item?.name || '').trim())
      .filter(Boolean)
      .slice(0, 4);
    return `Actualmente contamos con ${names.join(', ')}.`;
  }

  if ((hasPriceQuestion(input.userMessage) || hasDurationQuestion(input.userMessage) || hasComparisonQuestion(input.userMessage)) && catalog.length) {
    const normalizedMessage = normalize(input.userMessage);
    const offering = catalog.find((item) => normalize(String(item?.name || '')).split(/\s+/).some((token) => token.length > 4 && normalizedMessage.includes(token)))
      || catalog.find((item) => normalize(String(item?.description || '')).split(/\s+/).some((token) => token.length > 4 && normalizedMessage.includes(token)))
      || catalog[0];
    const name = String(offering?.name || 'este servicio');
    const duration = offering?.durationMinutes ? `${offering.durationMinutes} minutos aprox.` : 'duracion segun disponibilidad';
    const price = String((offering as any)?.priceLabel || 'precio no publicado');
    if (hasComparisonQuestion(input.userMessage)) return `${name}: ${price}, ${duration}.`;
    if (hasPriceQuestion(input.userMessage)) return `${name}: ${price}.`;
    return `${name}: ${duration}.`;
  }

  if (catalogMatchStatus === 'none' && hasUnsupportedServiceRequest(input.userMessage)) {
    if (hasGenericBookingRequest(input.userMessage)) {
      const names = catalog
        .map((item) => String(item?.name || '').trim())
        .filter(Boolean)
        .slice(0, 4);
      return names.length
        ? `Claro, te ayudo a reservar. Primero dime que servicio necesita tu vehiculo. Tenemos ${names.join(', ')}.`
        : 'Claro, te ayudo a reservar. Primero dime que servicio necesita tu vehiculo.';
    }

    if (!catalog.length) return 'No encuentro ese servicio dentro de lo que ofrecemos actualmente.';
    if (catalog.length === 1) {
      return `No ofrecemos eso. Actualmente contamos con ${String(catalog[0]?.name || 'un servicio disponible')}. Puedo explicarte en que consiste.`;
    }
    const names = catalog
      .map((item) => String(item?.name || '').trim())
      .filter(Boolean)
      .slice(0, 4);
    return `No ofrecemos eso. Actualmente contamos con ${names.join(', ')}. Puedo ayudarte a ubicar la opcion correcta.`;
  }

  return sideAnswerFrom(input);
};

const continuityPrefixFrom = (input: ResponseSynthesisInput) => {
  const details: any = input.skillResult?.details || {};
  const proposal = details.proposal || {};
  const temporalPreference = proposal.temporalPreference || {};
  const resolvedDate = temporalPreference.resolvedDate || temporalPreference.preferredDate || details.relativeDate;
  const preferredTime = temporalPreference.preferredTime || input.turnAssessment.extractedData.requestedTime;
  if (!resolvedDate && !preferredTime) return undefined;
  const fragments = ['Ya registre tu preferencia'];
  if (resolvedDate) fragments.push(`para ${resolvedDate}`);
  if (preferredTime) fragments.push(`a las ${titleCaseTime(preferredTime)}`);
  return `${fragments.join(' ')}.`;
};

const clarificationCandidate = async (input: ResponseSynthesisInput): Promise<HermesResponseCandidate> => {
  const details: any = input.skillResult?.details || {};
  const currentAnswer = await currentTurnAnswer(input);
  const continuity = continuityPrefixFrom(input);
  const authoritativePrompt = nextAwaitingPrompt(input);
  const suppressOperationalQuestion = !input.activeProcessSummary?.active && hasGenericBookingRequest(input.userMessage);
  const question = suppressOperationalQuestion
    ? ''
    : String(
      authoritativePrompt
      || softProcessContinuation(input)
      || details.nextQuestion
      || (currentAnswer ? '' : 'Necesito un dato mas para continuar.')
    ).trim();
  const parts = dedupeSequentialParts([currentAnswer, continuity, question || undefined]);
  return {
    status: 'NEEDS_CLARIFICATION',
    candidateText: sanitizeText(parts.join(' ')),
    responsePurpose: 'clarification',
    processContinuity: input.activeProcessSummary?.active ? 'maintained' : 'none',
    answeredSideQuestions: input.sideQuestions.map((item) => item.type),
    pendingQuestion: question,
    actionDisclosure: {
      executionOccurred: false,
      availabilityVerified: false,
      confirmationIssued: false,
    },
    authorityDisclosure: {
      mentionsPendingValidation: Boolean(continuity),
      mentionsPendingAvailability: Boolean(continuity),
      mentionsHumanReview: false,
    },
    sourceSkillId: input.dispatchPlan.selectedSkill,
    sourceSkillVersion: input.skillResult?.skillVersion,
    requiresVisibilityGate: true,
    fallbackRecommendation: 'none',
    sanitizedMetadata: {
      responsePurpose: 'clarification',
      sideQuestions: input.sideQuestions.map((item) => item.type),
      prioritizedMissingField: details.prioritizedMissingField,
      processContinuity: input.activeProcessSummary?.active ? 'maintained' : 'none',
    },
  };
};

const proposalCandidate = (input: ResponseSynthesisInput): HermesResponseCandidate => {
  const details: any = input.skillResult?.details || {};
  const proposal = details.proposal || {};
  const temporalPreference = proposal.temporalPreference || {};
  const dateText = temporalPreference.resolvedDate || temporalPreference.preferredDate;
  const timeText = titleCaseTime(temporalPreference.preferredTime);
  const pieces = ['Ya tengo los datos necesarios para continuar con tu solicitud'];
  if (dateText) pieces.push(`para ${dateText}`);
  if (timeText) pieces.push(`a las ${timeText}`);
  pieces.push('Todavia esta pendiente de validacion y no se ha ejecutado ninguna reserva.');
  return {
    status: 'CANDIDATE_READY',
    candidateText: sanitizeText(pieces.join(' ')),
    responsePurpose: 'proposal_disclosure',
    processContinuity: 'maintained',
    answeredSideQuestions: input.sideQuestions.map((item) => item.type),
    actionDisclosure: {
      executionOccurred: false,
      availabilityVerified: false,
      confirmationIssued: false,
    },
    authorityDisclosure: {
      mentionsPendingValidation: true,
      mentionsPendingAvailability: true,
      mentionsHumanReview: false,
    },
    sourceSkillId: input.dispatchPlan.selectedSkill,
    sourceSkillVersion: input.skillResult?.skillVersion,
    requiresVisibilityGate: true,
    fallbackRecommendation: 'none',
    sanitizedMetadata: {
      responsePurpose: 'proposal_disclosure',
      proposedAction: input.skillResult?.proposedAction,
      executionOccurred: false,
      availabilityVerified: false,
      confirmationIssued: false,
    },
  };
};

const answerReadyCandidate = async (input: ResponseSynthesisInput): Promise<HermesResponseCandidate> => {
  const bookedReply = appointmentBookedReply(input);
  const currentAnswer = await currentTurnAnswer(input);
  const continuity = continuityPrefixFrom(input);
  const softContinuation = softProcessContinuation(input);
  const candidateText = sanitizeText(
    bookedReply
    || dedupeSequentialParts([currentAnswer, continuity, softContinuation]).join(' ')
    || 'Perfecto, continuamos con tu solicitud.'
  );
  return {
    status: 'CANDIDATE_READY',
    candidateText,
    responsePurpose: input.dispatchPlan.decision === 'RESPOND_DIRECTLY' ? 'direct_response' : 'process_continuation',
    processContinuity: input.activeProcessSummary?.active ? 'maintained' : 'none',
    answeredSideQuestions: input.sideQuestions.map((item) => item.type),
    actionDisclosure: {
      executionOccurred: false,
      availabilityVerified: false,
      confirmationIssued: false,
    },
    authorityDisclosure: {
      mentionsPendingValidation: Boolean(continuity),
      mentionsPendingAvailability: Boolean(continuity),
      mentionsHumanReview: false,
    },
    sourceSkillId: input.dispatchPlan.selectedSkill,
    sourceSkillVersion: input.skillResult?.skillVersion,
    requiresVisibilityGate: true,
    fallbackRecommendation: 'none',
    sanitizedMetadata: {
      responsePurpose: 'direct_or_continuity',
      sideQuestions: input.sideQuestions.map((item) => item.type),
      authoritativeQuestionApplied: Boolean(softContinuation),
    },
  };
};

const escalationCandidate = (input: ResponseSynthesisInput): HermesResponseCandidate => ({
  status: 'ESCALATION_REQUIRED',
  candidateText: 'Necesito que este caso sea revisado por una persona del equipo para darte una respuesta correcta.',
  responsePurpose: 'escalation',
  processContinuity: 'blocked',
  answeredSideQuestions: [],
  actionDisclosure: {
    executionOccurred: false,
    availabilityVerified: false,
    confirmationIssued: false,
  },
  authorityDisclosure: {
    mentionsPendingValidation: false,
    mentionsPendingAvailability: false,
    mentionsHumanReview: true,
  },
  sourceSkillId: input.dispatchPlan.selectedSkill,
  sourceSkillVersion: input.skillResult?.skillVersion,
  requiresVisibilityGate: true,
  fallbackRecommendation: 'escalation',
  sanitizedMetadata: {
    responsePurpose: 'escalation',
    processContinuity: 'blocked',
  },
});

const fallbackCandidate = (input: ResponseSynthesisInput, status: HermesResponseCandidate['status']): HermesResponseCandidate => ({
  status,
  candidateText: '',
  responsePurpose: 'fallback',
  processContinuity: input.activeProcessSummary?.active ? 'maintained' : 'none',
  answeredSideQuestions: [],
  actionDisclosure: {
    executionOccurred: false,
    availabilityVerified: false,
    confirmationIssued: false,
  },
  authorityDisclosure: {
    mentionsPendingValidation: false,
    mentionsPendingAvailability: false,
    mentionsHumanReview: false,
  },
  sourceSkillId: input.dispatchPlan.selectedSkill,
  sourceSkillVersion: input.skillResult?.skillVersion,
  requiresVisibilityGate: true,
  fallbackRecommendation: 'legacy',
  sanitizedMetadata: {
    responsePurpose: 'fallback',
    fallbackRecommendation: 'legacy',
  },
});

export const synthesizeHermesResponseCandidate = async (input: ResponseSynthesisInput): Promise<HermesResponseCandidate> => {
  if (input.dispatchPlan.decision === 'DECLINE_UNSAFE_REQUEST') {
    return {
      ...fallbackCandidate(input, 'BLOCKED_UNSAFE'),
      candidateText: 'No puedo ayudarte con esa solicitud de esa manera.',
      responsePurpose: 'escalation',
      fallbackRecommendation: 'escalation',
      authorityDisclosure: {
        mentionsPendingValidation: false,
        mentionsPendingAvailability: false,
        mentionsHumanReview: true,
      },
    };
  }

  if (!input.skillResult) {
    return fallbackCandidate(input, 'NEEDS_LEGACY');
  }

  if (input.skillResult.status === 'ANSWER_READY') return await answerReadyCandidate(input);
  if (input.skillResult.status === 'NEEDS_INPUT') return await clarificationCandidate(input);
  if (input.skillResult.status === 'ACTION_PROPOSAL') return proposalCandidate(input);

  if (input.skillResult.status === 'ESCALATE' || input.skillResult.status === 'CANNOT_HANDLE') return escalationCandidate(input);
  if (input.skillResult.status === 'FAILED' || input.skillResult.status === 'TIMED_OUT') return fallbackCandidate(input, 'NEEDS_LEGACY');
  return fallbackCandidate(input, 'NO_PUBLIC_RESPONSE');
};

const sanitizedMetadataFromCandidate = (candidate: HermesResponseCandidate) => ({
  runtimeMode: 'response_candidate_synthesizer',
  status: candidate.status,
  responsePurpose: candidate.responsePurpose,
  processContinuity: candidate.processContinuity,
  answeredSideQuestions: candidate.answeredSideQuestions,
  pendingQuestion: candidate.pendingQuestion,
  fallbackRecommendation: candidate.fallbackRecommendation,
  sourceSkillId: candidate.sourceSkillId,
  sourceSkillVersion: candidate.sourceSkillVersion,
  ...candidate.sanitizedMetadata,
});

export const persistHermesResponseCandidate = async (input: {
  synthesis: ResponseSynthesisInput;
  candidate: HermesResponseCandidate;
}) => recordAgentConversationMessage({
  workflowId: input.synthesis.dispatchPlan.workflowId || input.synthesis.conversationId,
  businessSlug: input.synthesis.businessSlug,
  conversationId: input.synthesis.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes response candidate ${input.candidate.status}`,
  messageId: `${input.synthesis.turnId}:response-candidate`,
  correlationId: input.synthesis.correlationId,
  causationId: input.synthesis.turnId,
  metadata: sanitizedMetadataFromCandidate(input.candidate),
});

export const runHermesResponseCandidateSynthesis = async (input: ResponseSynthesisInput) => {
  const candidate = await synthesizeHermesResponseCandidate(input);
  await persistHermesResponseCandidate({
    synthesis: input,
    candidate,
  });
  return candidate;
};
