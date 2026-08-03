import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesDecision, HermesIntentSummary, HermesQuestionSummary } from '../contracts/hermesTurnAssessment.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { HermesSemanticTurn, isAutomotiveSemanticIntent } from '../routing/hermesSemanticTurn.service';

export type HermesTurnArbitrationLane =
  | 'identity_recovery'
  | 'active_process_data'
  | 'active_process_side_question'
  | 'action_or_booking'
  | 'domain_conversation'
  | 'social'
  | 'clarification'
  | 'clearly_external';

export interface HermesTurnArbitrationDecision {
  lane: HermesTurnArbitrationLane;
  primaryIntent: HermesIntentSummary;
  recommendedDecision: HermesDecision;
  reasonCode: string;
}

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const THANKS_ONLY = /^\s*(gracias|ok|vale|perfecto|listo)\s*[.!]*\s*$/i;
const CASUAL_GREETING = /^(h+o+l+a+|holi+s*|hello+|h+i+|hey+|buenas+|que tal|como vas|como estas|como andas|que onda)\b/i;
const TERSER_PROCESS_REPLY = /^\s*(si|no|ok|vale|perfecto|a las?\s+\d{1,2}|maÃ±ana|manana|ricardo|roberto)\b/i;
const SECURITY_RISK = /\b(ignore|ignora|ejecuta|run|start)\b.*\b(temporal|workflow|signal|activity|mongodb|mongoose|shell command)\b/i;
const UNSUPPORTED_SERVICE_REQUEST = /\b(quiero|quisiera|necesito|busco|me haces|preparame|prepÃ¡rame|dame)\b/i;
const CONTINUITY_IDENTIFIER = /\b(?:mi\s+)?(?:numero|n[uú]mero|telefono|tel[eé]fono|celular|dni|documento|placa)\b|(?:\+?\d[\d\s().-]{6,}\d)|\b(?:soy|me llamo|mi nombre es)\s+[a-záéíóúñ]{2,}/i;

const intent = (type: string, summary: string, confidence: HermesIntentSummary['confidence']): HermesIntentSummary => ({
  type,
  summary,
  confidence,
});

const schedulingIntentSummary = (schedulingIntent: HermesSchedulingIntent): HermesIntentSummary =>
  intent(schedulingIntent.type, `scheduling intent ${schedulingIntent.type}`, schedulingIntent.confidence);

const semanticIntentSummary = (semantic: HermesSemanticTurn): HermesIntentSummary =>
  intent(semantic.intent, `semantic turn ${semantic.intent}`, semantic.confidence);

export const arbitrateHermesTurn = (input: {
  message: string;
  context: HermesReadOnlyContext;
  schedulingIntent: HermesSchedulingIntent;
  semantic: HermesSemanticTurn;
  activeProcess: boolean;
  missingData: string[];
  informationalIntent?: HermesIntentSummary;
  questions: HermesQuestionSummary[];
}): HermesTurnArbitrationDecision => {
  const normalized = normalize(input.message);
  const semanticIntent = input.semantic.intent as string;

  if (SECURITY_RISK.test(normalized)) {
    return {
      lane: 'clearly_external',
      primaryIntent: intent('unsafe_request', 'unsafe operational request', 'high'),
      recommendedDecision: 'DECLINE_UNSAFE_REQUEST',
      reasonCode: 'SECURITY_RISK',
    };
  }

  if (input.activeProcess && input.schedulingIntent.type === 'side_question') {
    return {
      lane: 'active_process_side_question',
      primaryIntent: semanticIntentSummary({ ...input.semantic, intent: 'active_process_question' }),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: 'ACTIVE_PROCESS_SIDE_QUESTION',
    };
  }

  if (input.activeProcess && (
    input.schedulingIntent.type === 'provide_customer_data'
    || input.schedulingIntent.type === 'select_slot'
    || input.schedulingIntent.type === 'select_offering'
    || TERSER_PROCESS_REPLY.test(normalized)
    || semanticIntent === 'active_process_data'
  )) {
    return {
      lane: 'active_process_data',
      primaryIntent: schedulingIntentSummary(input.schedulingIntent.type === 'none'
        ? { ...input.schedulingIntent, type: 'provide_customer_data', confidence: 'medium' }
        : input.schedulingIntent),
      recommendedDecision: 'CONTINUE_ACTIVE_PROCESS',
      reasonCode: 'ACTIVE_PROCESS_EXPECTED_DATA',
    };
  }

  if (!input.activeProcess && CONTINUITY_IDENTIFIER.test(normalized)) {
    return {
      lane: 'identity_recovery',
      primaryIntent: intent('conversation_recovery', 'explicit continuity identifier', 'high'),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: 'EXPLICIT_CONTINUITY_IDENTIFIER',
    };
  }

  if (isAutomotiveSemanticIntent(semanticIntent) || semanticIntent === 'active_process_question') {
    return {
      lane: 'domain_conversation',
      primaryIntent: semanticIntentSummary(input.semantic),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: input.semantic.reasonCode,
    };
  }

  if (semanticIntent === 'service_request' && !input.activeProcess) {
    return {
      lane: 'domain_conversation',
      primaryIntent: semanticIntentSummary(input.semantic),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: input.semantic.reasonCode,
    };
  }

  if (semanticIntent === 'catalog_general' || semanticIntent === 'catalog_offering_question') {
    return {
      lane: 'domain_conversation',
      primaryIntent: semanticIntentSummary(input.semantic),
      recommendedDecision: 'DELEGATE_INFORMATIONAL',
      reasonCode: input.semantic.reasonCode,
    };
  }

  if (input.schedulingIntent.type !== 'none' && input.schedulingIntent.type !== 'side_question' && input.schedulingIntent.type !== 'ambiguous') {
    return {
      lane: 'action_or_booking',
      primaryIntent: schedulingIntentSummary(input.schedulingIntent),
      recommendedDecision: input.activeProcess ? 'CONTINUE_ACTIVE_PROCESS' : 'PROPOSE_ACTION',
      reasonCode: 'SCHEDULING_INTENT',
    };
  }

  if (input.informationalIntent && /^catalog_/.test(input.informationalIntent.type)) {
    return {
      lane: 'domain_conversation',
      primaryIntent: input.informationalIntent,
      recommendedDecision: 'DELEGATE_INFORMATIONAL',
      reasonCode: 'INFORMATIONAL_CATALOG',
    };
  }

  if (semanticIntent === 'social_conversation' || CASUAL_GREETING.test(normalized) || (input.informationalIntent && THANKS_ONLY.test(input.message))) {
    return {
      lane: 'social',
      primaryIntent: semanticIntentSummary({ ...input.semantic, intent: 'social_conversation', confidence: input.semantic.confidence || 'high' }),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: semanticIntent === 'social_conversation' ? input.semantic.reasonCode : 'SOCIAL_SIGNAL',
    };
  }

  if (semanticIntent === 'domain_clarification' || input.schedulingIntent.type === 'ambiguous' || input.missingData.includes('clarifying_information')) {
    return {
      lane: 'clarification',
      primaryIntent: semanticIntent === 'domain_clarification' ? semanticIntentSummary(input.semantic) : schedulingIntentSummary(input.schedulingIntent),
      recommendedDecision: UNSUPPORTED_SERVICE_REQUEST.test(normalized) ? 'RESPOND_DIRECTLY' : 'ASK_FOR_INFORMATION',
      reasonCode: input.semantic.reasonCode || 'CLARIFICATION_REQUIRED',
    };
  }

  if (semanticIntent === 'off_domain') {
    return {
      lane: 'clearly_external',
      primaryIntent: semanticIntentSummary(input.semantic),
      recommendedDecision: 'RESPOND_DIRECTLY',
      reasonCode: input.semantic.reasonCode,
    };
  }

  return {
    lane: 'clarification',
    primaryIntent: input.informationalIntent || intent('conversation', 'general conversational turn', 'medium'),
    recommendedDecision: 'ASK_FOR_INFORMATION',
    reasonCode: 'NO_AUTHORITATIVE_LANE',
  };
};
