import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesResponseCandidate } from '../contracts/hermesResponseCandidate.contract';
import {
  buildHermesConversationalDelta,
  isSubstantiallyRepeated,
} from './hermesConversationalState.service';
import {
  deriveHermesResponseObligations,
  evaluateHermesObligationCoverage,
} from './hermesConversationalTurn.service';
import {
  buildAutomotiveGuidanceReply,
  buildExternalDomainReply,
  classifyHermesSemanticTurn,
  hasAutomotiveDomainSignal,
  isAutomotiveSemanticIntent,
  resolveHermesDomain,
} from '../routing/hermesSemanticTurn.service';

export type HermesCoherenceRejectionReason =
  | 'LOCALE_MISMATCH'
  | 'IDENTITY_CONTRADICTION'
  | 'UNREQUESTED_CATALOG_PIVOT'
  | 'TOPIC_DISCONTINUITY'
  | 'TECHNICAL_FACT_CONTRADICTION'
  | 'DOMAIN_RESPONSE_MISMATCH'
  | 'OFF_DOMAIN_FALSE_POSITIVE'
  | 'UNANSWERED_TECHNICAL_QUESTION'
  | 'CATALOG_DUMP_WITHOUT_REQUEST'
  | 'TOPIC_REFERENCE_LOST'
  | 'AUTOMOTIVE_QUERY_REJECTED_AS_OFF_DOMAIN'
  | 'IRRELEVANT_OFF_DOMAIN_REASON'
  | 'USER_MESSAGE_ECHO'
  | 'OBLIGATION_MISSING'
  | 'OBLIGATION_CONTRADICTED'
  | 'REPEATED_RESPONSE_AFTER_NEW_EVIDENCE';

export type HermesCoherenceGateResult = {
  accepted: boolean;
  rejectionReasons: HermesCoherenceRejectionReason[];
  repairedText?: string;
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const recentText = (context?: HermesReadOnlyContext) =>
  (context?.conversation?.history || [])
    .slice(-6)
    .map((entry) => entry.content)
    .join(' ');

const isCatalogRequest = (message: string) =>
  /\b(servicio|servicios|catalogo|catalogo|opciones|ofrecen|ofreces|tienen|tienes|precio|cuesta|costo|duracion|dura|demora|reserv|agend|cita)\b/.test(normalize(message));

const isCatalogPivot = (reply: string) =>
  /\b(tenemos|contamos con|servicios disponibles|estos servicios|catalogo|1\.\s+|2\.\s+|3\.\s+)\b/.test(normalize(reply));

const isCatalogDump = (reply: string) =>
  (reply.match(/(?:^|\n)\s*\d+\.\s+/g) || []).length >= 2
  || /\b1\.\s+[\s\S]*\b2\.\s+[\s\S]*\b3\.\s+/.test(reply);

const isOffDomainReply = (reply: string) =>
  /\b(no ofrecemos|no ofrezco|fuera de dominio|no puedo ayudarte con eso|no es un servicio que ofrecemos|no ofrecemos comida)\b/.test(normalize(reply));

const mentionsExternalCategoryAbsentFromMessage = (message: string, reply: string) => {
  const user = normalize(message);
  const text = normalize(reply);
  if (/\b(comida|lomo saltado|pollo|ceviche|torta)\b/.test(text) && !/\b(comida|lomo saltado|lomos saltados|pollo|ceviche|tortas?)\b/.test(user)) return true;
  if (/\b(tarea|historia|colegio|examen)\b/.test(text) && !/\b(tarea|historia|colegio|examen)\b/.test(user)) return true;
  if (/\b(vuelo|pasaje|hotel|viaje)\b/.test(text) && !/\b(vuelo|pasaje|hotel|viaje|cusco)\b/.test(user)) return true;
  return false;
};

const hasTechnicalAnswerSignal = (reply: string) =>
  /\b(sensor|maf|obd|codigo|codigos|cableado|conector|lectura|sintoma|sintomas|embrague|transmision|hidraulico|motor|freno|diagnostico|revisar|causas|potencia|ralenti|check engine)\b/.test(normalize(reply));

const hasDiagnosticStepsSignal = (reply: string) =>
  /\bobd\b/.test(normalize(reply))
  && /\b(conector|cableado|lecturas?|rpm|admision)\b/.test(normalize(reply));

const isMostlyEnglish = (reply: string) => {
  const normalized = normalize(reply);
  const englishHits = (normalized.match(/\b(the|and|you|your|can|can't|cannot|steps|sensor|engine|american|language|today|thanks)\b/g) || []).length;
  const spanishHits = (normalized.match(/\b(que|para|con|puedo|gracias|sensor|motor|espanol|servicio|revision|diagnostico)\b/g) || []).length;
  return englishHits >= 3 && englishHits > spanishHits;
};

const hasBrokenSpanish = (reply: string) =>
  /\bcomo se suena\b|\bcomo se (?:vibra|falla|ruido)\b|\bque te suena\b|\bcomo se siente\b.*\bruido\b/i.test(normalize(reply));

const compactEchoText = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const echoTokens = (value: string) =>
  compactEchoText(value)
    .split(' ')
    .filter((token) => token.length >= 3);

const echoesCurrentUserMessage = (message: string, reply: string) => {
  const user = compactEchoText(message);
  const text = compactEchoText(reply);
  if (Boolean(user) && user.length >= 8 && text === user) return true;
  const userTokens = echoTokens(message);
  const replyTokens = echoTokens(reply);
  if (userTokens.length < 2 || replyTokens.length < 2 || userTokens.length > 8 || replyTokens.length > 8) return false;
  const replySet = new Set(replyTokens);
  const overlap = userTokens.filter((token) => replySet.has(token)).length;
  const coverage = overlap / Math.max(userTokens.length, replyTokens.length);
  return coverage >= 0.75 && Math.abs(userTokens.length - replyTokens.length) <= 2;
};

const echoesRecentUserMessage = (reply: string, context?: HermesReadOnlyContext) =>
  (context?.conversation?.history || [])
    .slice(-8)
    .some((entry) => entry.role === 'user' && echoesCurrentUserMessage(entry.content, reply));

const isWeakEchoQuestion = (message: string, reply: string) => {
  const user = normalize(message);
  const text = normalize(reply);
  return /\bsuena|ruido|vibra|falla\b/.test(user)
    && /\?/.test(reply)
    && (
      /\bcomo se siente\b/.test(text)
      || /\bcomo es con\b/.test(text)
      || /\bque sucede cuando\b/.test(text)
      || /\bcomo puedo ayudarte\b/.test(text)
      || /\bpuedes describir\b/.test(text)
    )
    && !/\b(apenas|prendes|apagas|aceleras|revoluciones|frenar|minimo|velocidad|fuerte|suave|constante)\b/.test(text);
};

const echoesOldCommercialQuestion = (message: string, reply: string) =>
  !/\b(precio|cuesta|costo|vale|tarifa|cobra|cobran)\b/.test(normalize(message))
  && /\b(cuanto cuesta|precio|costo)\b/.test(normalize(reply))
  && /\?/.test(reply);

const hasIdentityContradiction = (reply: string) =>
  /\b(no soy peruana|no puedo hablar espanol|no puedo cambiar.*idioma|i'?m american|i am american|soy americana|i cannot speak spanish|can't speak spanish)\b/i.test(normalize(reply));

const isMafQuestion = (message: string, context?: HermesReadOnlyContext) =>
  /\bmaf\b/i.test(`${recentText(context)} ${message}`);

const hasMafMapContradiction = (reply: string) => {
  const normalized = normalize(reply);
  return /\bmaf\b/.test(normalized) && (
    /\bmanifold absolute\b/.test(normalized)
    || /\babsolute flow\b/.test(normalized)
    || /\bescaner(?:a)? de combustible\b/.test(normalized)
  );
};

const hasUnderbodyProtectionContradiction = (message: string, reply: string) =>
  /\b(parte inferior|bajos|chasis|undercoating|oxido|humedad)\b/.test(normalize(message))
  && /\b(desempeno|estabilidad|rendimiento)\b.*\bmotor\b|\bmotor\b.*\b(desempeno|estabilidad|rendimiento)\b/.test(normalize(reply));

const missesUnderbodyProtectionAnswer = (message: string, reply: string) =>
  /\b(parte inferior|bajos|chasis|undercoating|oxido|humedad)\b/.test(normalize(message))
  && /\b(proteger|proteccion|recomiendas|conviene|mejor)\b/.test(normalize(message))
  && !/\b(undercoating|arenado|chasis|oxido|humedad|desgaste|anticorrosiv)\b/.test(normalize(reply));

const asksForPreviousSteps = (message: string, context?: HermesReadOnlyContext) => {
  const normalized = normalize(message);
  const history = normalize(recentText(context));
  return /\b(cuales son los pasos|que pasos|los pasos|cuales pasos)\b/.test(normalized)
    && /\b(pasos|maf|sensor|diagnostic|diagnost|obd|motor)\b/.test(history);
};

const answerMaf = (message: string, context?: HermesReadOnlyContext) => {
  if (asksForPreviousSteps(message, context)) {
    return [
      'Primero se escanean codigos OBD y datos en vivo.',
      'Luego se revisan conector, cableado, filtro de aire y posibles fugas de admision.',
      'Despues se comparan las lecturas del MAF con RPM y carga del motor.',
      'Si esta sucio, se evalua limpieza con producto especifico para MAF; si sigue fuera de rango, recien se considera reemplazo.',
      'Turagua puede revisarlo con un diagnostico general.',
    ].join(' ');
  }
  return [
    'El MAF es el sensor de flujo de masa de aire, no el MAP.',
    'Cuando falla puede causar perdida de potencia, ralenti inestable, mayor consumo, tirones, dificultad para arrancar o check engine.',
    'Esos sintomas tambien pueden venir de otras causas, asi que conviene revisar codigos OBD, cableado, admision y lecturas del sensor antes de cambiar piezas.',
  ].join(' ');
};

const answerIdentity = (context?: HermesReadOnlyContext) => {
  const businessName = context?.business?.businessName || context?.business?.businessSlug || 'Turagua';
  const agentName = context?.business?.agent?.name || 'Iris';
  return `Soy ${agentName}, la asistente virtual de ${businessName}. Estoy configurada para atenderte en espanol peruano; no tengo nacionalidad como una persona, pero puedo conversar contigo de forma natural en espanol.`;
};

const conservativeRepair = async (input: {
  userMessage: string;
  context?: HermesReadOnlyContext;
  rejectionReasons: HermesCoherenceRejectionReason[];
}) => {
  const message = normalize(input.userMessage);
  const semantic = await classifyHermesSemanticTurn({ message: input.userMessage, context: input.context });
  const domain = await resolveHermesDomain({ message: input.userMessage, context: input.context });
  if (input.rejectionReasons.includes('IDENTITY_CONTRADICTION') || /\b(americana|peruana|idioma|espanol|español|quien eres|como te llamas)\b/.test(message)) {
    return answerIdentity(input.context);
  }
  if (semantic.intent === 'booking_intent') {
    return 'Claro, te ayudo a reservar. Primero dime que servicio necesita tu vehiculo para coordinarlo correctamente.';
  }
  if (semantic.intent === 'off_domain') {
    return await buildExternalDomainReply({ message: input.userMessage, context: input.context });
  }
  if (isAutomotiveSemanticIntent(semantic.intent) || await hasAutomotiveDomainSignal(input.userMessage, input.context)) {
    return await buildAutomotiveGuidanceReply({ message: input.userMessage, context: input.context, semantic });
  }
  if (isMafQuestion(input.userMessage, input.context) || asksForPreviousSteps(input.userMessage, input.context)) {
    return answerMaf(input.userMessage, input.context);
  }
  if (domain.domain === 'uncertain') {
    return 'Entiendo que podria tratarse de una revision automotriz. Podrias contarme que comportamiento o falla presenta el vehiculo para orientarte mejor?';
  }
  if (input.context?.process?.active) {
    const field = input.context.process.awaiting?.nextRecommendedField || input.context.process.awaiting?.field;
    if (/phone|telefono/i.test(String(field || ''))) return 'Claro, respondo tu duda y mantenemos la reserva en pausa. Para seguir despues me faltaria tu numero de contacto.';
    if (/lastName|apellido/i.test(String(field || ''))) return 'Claro, respondo tu duda y mantenemos la reserva en pausa. Para seguir despues me faltaria tu apellido.';
  }
  return 'Te sigo en el mismo tema. Cuentame un poco mas y te respondo sin mover la conversacion al catalogo ni a la reserva si no lo pides.';
};

export const evaluateHermesConversationalCoherence = async (input: {
  userMessage?: string;
  reply: string;
  context?: HermesReadOnlyContext;
  candidate?: HermesResponseCandidate;
}): Promise<HermesCoherenceGateResult> => {
  const userMessage = String(input.userMessage || '');
  const reply = String(input.reply || '').trim();
  const rejectionReasons: HermesCoherenceRejectionReason[] = [];
  const semantic = await classifyHermesSemanticTurn({ message: userMessage, context: input.context });
  const domain = await resolveHermesDomain({ message: userMessage, context: input.context });
  const delta = buildHermesConversationalDelta({ context: input.context, userMessage });
  const obligations = deriveHermesResponseObligations({
    userMessage,
    context: input.context,
  });
  const requiredObligationIds = new Set(obligations.filter((item) => item.priority === 'required').map((item) => item.id));
  const obligationCoverage = evaluateHermesObligationCoverage({
    reply,
    obligations,
  });
  const automotive = domain.domain === 'automotive' || isAutomotiveSemanticIntent(semantic.intent) || await hasAutomotiveDomainSignal(userMessage, input.context);

  if (echoesCurrentUserMessage(userMessage, reply) || echoesRecentUserMessage(reply, input.context)) rejectionReasons.push('USER_MESSAGE_ECHO');
  if (isMostlyEnglish(reply) || hasBrokenSpanish(reply)) rejectionReasons.push('LOCALE_MISMATCH');
  if (isWeakEchoQuestion(userMessage, reply)) rejectionReasons.push('TOPIC_REFERENCE_LOST');
  if (echoesOldCommercialQuestion(userMessage, reply)) rejectionReasons.push('TOPIC_REFERENCE_LOST');
  if (hasIdentityContradiction(reply)) rejectionReasons.push('IDENTITY_CONTRADICTION');
  if (hasMafMapContradiction(reply)) rejectionReasons.push('TECHNICAL_FACT_CONTRADICTION');
  if (hasUnderbodyProtectionContradiction(userMessage, reply)) rejectionReasons.push('TECHNICAL_FACT_CONTRADICTION');
  if (missesUnderbodyProtectionAnswer(userMessage, reply)) rejectionReasons.push('TECHNICAL_FACT_CONTRADICTION');
  if (!isCatalogRequest(userMessage) && isCatalogPivot(reply)) rejectionReasons.push('UNREQUESTED_CATALOG_PIVOT');
  if (asksForPreviousSteps(userMessage, input.context) && isCatalogPivot(reply)) rejectionReasons.push('TOPIC_DISCONTINUITY');
  if (automotive && isOffDomainReply(reply)) rejectionReasons.push('OFF_DOMAIN_FALSE_POSITIVE');
  if (automotive && isOffDomainReply(reply)) rejectionReasons.push('DOMAIN_RESPONSE_MISMATCH');
  if (automotive && isOffDomainReply(reply)) rejectionReasons.push('AUTOMOTIVE_QUERY_REJECTED_AS_OFF_DOMAIN');
  if (mentionsExternalCategoryAbsentFromMessage(userMessage, reply)) rejectionReasons.push('IRRELEVANT_OFF_DOMAIN_REASON');
  if (semantic.intent === 'off_domain' && !/\b(taller automotriz|vehiculo|auto|carro)\b/.test(normalize(reply))) {
    rejectionReasons.push('DOMAIN_RESPONSE_MISMATCH');
  }
  if (
    (semantic.intent === 'automotive_qa' || semantic.intent === 'active_process_question')
    && isCatalogPivot(reply)
    && !hasTechnicalAnswerSignal(reply)
  ) rejectionReasons.push('UNANSWERED_TECHNICAL_QUESTION');
  if (!isCatalogRequest(userMessage) && isCatalogDump(reply)) rejectionReasons.push('CATALOG_DUMP_WITHOUT_REQUEST');
  if (asksForPreviousSteps(userMessage, input.context) && !hasTechnicalAnswerSignal(reply)) rejectionReasons.push('TOPIC_REFERENCE_LOST');
  if (asksForPreviousSteps(userMessage, input.context) && !hasDiagnosticStepsSignal(reply)) rejectionReasons.push('TOPIC_REFERENCE_LOST');
  if (
    isSubstantiallyRepeated(reply, input.context)
    && (Object.keys(delta.newFacts).length || Object.keys(delta.correctedFacts).length || delta.answeredQuestion)
  ) rejectionReasons.push('REPEATED_RESPONSE_AFTER_NEW_EVIDENCE');
  if (obligationCoverage.some((entry) => requiredObligationIds.has(entry.obligationId) && entry.status === 'missing')) rejectionReasons.push('OBLIGATION_MISSING');
  if (obligationCoverage.some((entry) => requiredObligationIds.has(entry.obligationId) && entry.status === 'contradicted')) rejectionReasons.push('OBLIGATION_CONTRADICTED');

  const accepted = rejectionReasons.length === 0;
  return {
    accepted,
    rejectionReasons,
    repairedText: accepted ? undefined : await conservativeRepair({ userMessage, context: input.context, rejectionReasons }),
  };
};
