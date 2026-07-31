import { recordAgentConversationMessage } from '../../../services/agentConversation.service';
import { buildHermesReadOnlyContext } from '../context/hermesContextBuilder.service';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesDispatchPlan } from '../contracts/hermesDispatchPlan.contract';
import {
  HermesCorrectionSummary,
  HermesDecision,
  HermesIntentSummary,
  HermesQuestionSummary,
  HermesSkillId,
  HermesTurnAssessment,
} from '../contracts/hermesTurnAssessment.contract';
import { HermesSchedulingIntent } from '../contracts/hermesSchedulingIntent.contract';
import { extractHermesSchedulingIntent } from '../scheduling/hermesSchedulingIntent.service';
import { evaluateHermesQaEligibility } from '../routing/hermesQaEligibility.service';
import { classifyQaCategory, classifyTransactionalExclusion, hasAttachment, hasActiveProcess as qaHasActiveProcess, hasSecurityRisk } from '../routing/hermesQaEligibility.policy';
import { classifyHermesSemanticTurn } from '../routing/hermesSemanticTurn.service';
import { arbitrateHermesTurn } from './hermesTurnArbitration.service';

export interface HermesReceptionDeskInput {
  businessSlug: string;
  conversationId: string;
  message: string;
  attachmentIds?: string[];
  workflowId?: string;
  channel?: string;
  messageId?: string;
  correlationId: string;
  causationId?: string;
  processState?: any;
  customerId?: string;
  managedEntityId?: string;
  caseId?: string;
}

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const PRICE_QUESTION = /\b(cuanto cuesta|cuÃ¡nto cuesta|precio|cost[oa]|tarifa)\b/i;
const DURATION_QUESTION = /\b(cuanto dura|cuÃ¡nto dura|duracion|duraciÃ³n|duration)\b/i;
const COMPATIBILITY_QUESTION = /\b(hibrid|h[iÃ­]bridos?|automatic|diesel|toyota|marca|modelo)\b/i;

const questionSummariesFrom = (message: string): HermesQuestionSummary[] => {
  const questions: HermesQuestionSummary[] = [];
  if (PRICE_QUESTION.test(message)) questions.push({ type: 'price', summary: 'pricing question present' });
  if (DURATION_QUESTION.test(message)) questions.push({ type: 'duration', summary: 'duration question present' });
  if (COMPATIBILITY_QUESTION.test(message)) questions.push({ type: 'compatibility', summary: 'compatibility question present' });
  if (!questions.length && /\?/.test(message)) questions.push({ type: 'unknown', summary: 'general question present' });
  return questions;
};

const correctionSummariesFrom = (message: string): HermesCorrectionSummary[] => {
  const normalized = normalize(message);
  const corrections: HermesCorrectionSummary[] = [];
  if (!/\b(perdon|perd[oÃ³]n|corrijo|mejor dicho|quise decir)\b/.test(normalized)) return corrections;

  const yearMatches = [...message.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map((match) => match[1]);
  if (yearMatches.length >= 2) {
    corrections.push({
      field: 'managedEntityYear',
      previousValue: yearMatches[0],
      nextValue: yearMatches[yearMatches.length - 1],
      reason: 'explicit_correction',
    });
  }

  const nameMatches = [...message.matchAll(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÃÃ‰ÃÃ“ÃšÃœÃ‘Ã¡Ã©Ã­Ã³ÃºÃ¼Ã±]{2,})/gi)].map((match) => match[1]);
  if (nameMatches.length >= 2) {
    corrections.push({
      field: 'firstName',
      previousValue: nameMatches[0],
      nextValue: nameMatches[nameMatches.length - 1],
      reason: 'explicit_correction',
    });
  }

  return corrections;
};

const managedEntityHintFrom = (message: string) => {
  const vehicleMatch = message.match(/\b(?:toyota|nissan|kia|hyundai|mazda|chevrolet|ford|honda)\b[^,.!?]*/i);
  return vehicleMatch?.[0]?.trim();
};

const managedEntityYearFrom = (message: string) =>
  message.match(/\b(20\d{2}|19\d{2})\b/)?.[1];

const informationalIntentSummaries = async (message: string, context: HermesReadOnlyContext) => {
  const eligibility = await evaluateHermesQaEligibility({
    businessSlug: context.business?.businessSlug || 'demo_test',
    conversationId: context.conversation.conversationId,
    message,
    context,
  });
  if (!eligibility.eligible || !eligibility.category) return undefined;
  return {
    type: eligibility.category,
    summary: `informational category ${eligibility.category}`,
    confidence: 'high' as const,
  };
};

const fallbackInformationalIntentSummary = async (message: string, context: HermesReadOnlyContext) => {
  if (hasSecurityRisk(message)) return undefined;
  if (hasAttachment(undefined)) return undefined;
  if (qaHasActiveProcess(context)) return undefined;
  if (classifyTransactionalExclusion(message)) return undefined;
  const category = await classifyQaCategory(message, context);
  if (!category) return undefined;
  return {
    type: category,
    summary: `informational category ${category}`,
    confidence: 'high' as const,
  };
};

const dedupeSecondaryIntents = (intents: HermesIntentSummary[]) => {
  const seen = new Set<string>();
  return intents.filter((intent) => {
    const key = `${intent.type}:${intent.summary}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const knownDataFrom = (context: HermesReadOnlyContext, processState?: any) => ({
  customerKnown: context.customer?.identityStatus === 'identified',
  phoneKnown: context.customer?.knownFacts.phoneKnown || false,
  emailKnown: context.customer?.knownFacts.emailKnown || false,
  managedEntityKnown: Boolean(context.managedEntity?.managedEntityId),
  activeCaseKnown: Boolean(context.case?.caseId),
  selectedOfferingKnown: Boolean(processState?.selectedOffering?._id || context.process?.knownFacts?.offering),
});

const missingDataFrom = (intent: HermesSchedulingIntent, context: HermesReadOnlyContext, processState?: any) => {
  const missing: string[] = [];
  const activeProcess = Boolean(processState?.status || context.process?.active);
  if (intent.type === 'start_booking') {
    if (!intent.extracted.offeringId) missing.push('service_selection');
    if (!activeProcess && !context.customer?.knownFacts.phoneKnown && !intent.extracted.phone) missing.push('contact_information');
  }
  if (intent.type === 'request_availability' && !intent.extracted.requestedDate) missing.push('preferred_date');
  if (intent.type === 'provide_customer_data' && !intent.extracted.phone && !context.customer?.knownFacts.phoneKnown) missing.push('phone');
  if (activeProcess && String(processState?.status || '') === 'WAITING_FOR_SLOT_SELECTION' && !intent.extracted.slotId) {
    missing.push('slot_reference');
  }
  if (intent.type === 'ambiguous') missing.push('clarifying_information');
  return [...new Set(missing)];
};

const selectedSkillFrom = (decision: HermesDecision, informationalIntent?: HermesIntentSummary): HermesSkillId => {
  if (decision === 'DECLINE_UNSAFE_REQUEST' || decision === 'ESCALATE') return 'recovery-escalation';
  if (decision === 'PROPOSE_ACTION' || decision === 'CONTINUE_ACTIVE_PROCESS') return 'scheduling-specialist';
  if (decision === 'DELEGATE_INFORMATIONAL') return 'catalog-advisor';
  return 'customer-conversation';
};

const nextBehaviorFrom = (decision: HermesDecision): HermesDispatchPlan['nextBehavior'] => {
  if (decision === 'RESPOND_DIRECTLY') return 'respond_now';
  if (decision === 'ASK_FOR_INFORMATION') return 'ask_next_question';
  if (decision === 'DELEGATE_INFORMATIONAL') return 'delegate_read_only';
  if (decision === 'PROPOSE_ACTION') return 'prepare_dry_run_only';
  if (decision === 'CONTINUE_ACTIVE_PROCESS') return 'continue_existing_process';
  if (decision === 'DECLINE_UNSAFE_REQUEST') return 'decline';
  return 'escalate_or_fallback';
};

const selectionReasonFrom = (decision: HermesDecision, skill: HermesSkillId, assessment: HermesTurnAssessment) => {
  if (decision === 'CONTINUE_ACTIVE_PROCESS') return `active process ${assessment.processStatus || 'active'} stays with ${skill}`;
  if (decision === 'PROPOSE_ACTION') return `operational intent ${assessment.primaryIntent.type} requires ${skill}`;
  if (decision === 'DELEGATE_INFORMATIONAL') return `informational intent ${assessment.primaryIntent.type} delegated to ${skill}`;
  if (decision === 'RESPOND_DIRECTLY') return `${skill} can answer directly without specialist delegation`;
  if (decision === 'DECLINE_UNSAFE_REQUEST') return 'unsafe request must be contained by recovery-escalation';
  return `insufficient certainty, keep conversation controlled through ${skill}`;
};

export const assessHermesTurn = async (input: {
  businessSlug: string;
  conversationId: string;
  message: string;
  context: HermesReadOnlyContext;
  processState?: any;
  messageId: string;
}): Promise<HermesTurnAssessment> => {
  const schedulingIntent = extractHermesSchedulingIntent({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    message: input.message,
    messageId: input.messageId,
    context: input.context,
    processState: input.processState,
  });
  const semantic = await classifyHermesSemanticTurn({ message: input.message, context: input.context });
  const informationalIntent = await informationalIntentSummaries(input.message, input.context)
    || await fallbackInformationalIntentSummary(input.message, input.context);
  const semanticPrimaryIntent = semantic.intent !== 'active_process_data'
    ? {
      type: semantic.intent,
      summary: `semantic turn ${semantic.intent}`,
      confidence: semantic.confidence,
    }
    : undefined;
  const activeProcess = Boolean(input.processState?.status || input.context.process?.active);
  const knownData = knownDataFrom(input.context, input.processState);
  const missingData = missingDataFrom(schedulingIntent, input.context, input.processState);
  const questions = questionSummariesFrom(input.message);
  const arbitration = arbitrateHermesTurn({
    message: input.message,
    context: input.context,
    schedulingIntent,
    semantic,
    activeProcess,
    missingData,
    informationalIntent,
    questions,
  });
  const primaryIntent = arbitration.primaryIntent;

  const secondaryIntents = dedupeSecondaryIntents([
    ...(semanticPrimaryIntent && semanticPrimaryIntent.type !== primaryIntent.type ? [semanticPrimaryIntent] : []),
    ...(informationalIntent && informationalIntent.type !== primaryIntent.type ? [informationalIntent] : []),
    ...questions.map((question) => ({
      type: question.type,
      summary: question.summary,
      confidence: 'medium' as const,
    })),
  ]);

  return {
    turnId: input.messageId,
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    turnText: input.message,
    activeProcess,
    processStatus: String(input.processState?.status || input.context.process?.status || '') || undefined,
    awaiting: {
      type: String(input.processState?.awaiting?.type || input.context.process?.awaiting?.type || '') || undefined,
      nextRecommendedField: String(
        input.processState?.awaiting?.nextRecommendedField
        || input.context.process?.awaiting?.nextRecommendedField
        || ''
      ) || undefined,
    },
    primaryIntent,
    secondaryIntents,
    extractedData: {
      firstName: schedulingIntent.extracted.firstName,
      lastName: schedulingIntent.extracted.lastName,
      phonePresent: Boolean(schedulingIntent.extracted.phone),
      emailPresent: Boolean(schedulingIntent.extracted.email),
      offeringId: schedulingIntent.extracted.offeringId,
      requestedDate: schedulingIntent.extracted.requestedDate,
      requestedTime: schedulingIntent.extracted.requestedTime,
      requestedDayPart: schedulingIntent.extracted.requestedDayPart,
      notBeforeTime: schedulingIntent.extracted.notBeforeTime,
      slotId: schedulingIntent.extracted.slotId,
      managedEntityHint: managedEntityHintFrom(input.message),
      managedEntityYear: managedEntityYearFrom(input.message),
    },
    knownData,
    corrections: correctionSummariesFrom(input.message),
    questions,
    missingData,
    arbitration: {
      lane: arbitration.lane,
      reasonCode: arbitration.reasonCode,
    },
    recommendedDecision: arbitration.recommendedDecision,
    confidence: primaryIntent.confidence,
  };
};

export const buildHermesDispatchPlan = (input: {
  assessment: HermesTurnAssessment;
  correlationId: string;
  workflowId?: string;
  businessTimezone?: string;
  locale?: string;
  referenceTimestamp?: string;
}): HermesDispatchPlan => {
  const selectedSkill = selectedSkillFrom(input.assessment.recommendedDecision, input.assessment.secondaryIntents[0]);
  const referenceTimestamp = input.referenceTimestamp || new Date().toISOString();
  return {
    turnId: input.assessment.turnId,
    businessSlug: input.assessment.businessSlug,
    conversationId: input.assessment.conversationId,
    workflowId: input.workflowId,
    correlationId: input.correlationId,
    decision: input.assessment.recommendedDecision,
    selectedSkill,
    selectionReason: selectionReasonFrom(input.assessment.recommendedDecision, selectedSkill, input.assessment),
    confidence: input.assessment.confidence,
    activeProcessOwner: input.assessment.activeProcess ? 'scheduling-specialist' : undefined,
    dataMissing: input.assessment.missingData,
    actionAllowed: false,
    nextBehavior: nextBehaviorFrom(input.assessment.recommendedDecision),
    executionState: 'planned',
    assessment: input.assessment,
    skillContext: {
      objective: input.assessment.primaryIntent.summary,
      processStatus: input.assessment.processStatus,
      relevantFacts: {
        offeringId: input.assessment.extractedData.offeringId,
        requestedDate: input.assessment.extractedData.requestedDate,
        requestedTime: input.assessment.extractedData.requestedTime,
        managedEntityHint: input.assessment.extractedData.managedEntityHint,
        customerKnown: input.assessment.knownData.customerKnown,
        activeCaseKnown: input.assessment.knownData.activeCaseKnown,
      },
      missingData: input.assessment.missingData,
      temporalContext: {
        referenceTimestamp,
        businessTimezone: input.businessTimezone,
        locale: input.locale || 'es-PE',
      },
    },
    createdAt: referenceTimestamp,
  };
};

const sanitizedMetadataFromPlan = (plan: HermesDispatchPlan) => ({
  runtimeMode: 'reception_desk_orchestrator',
  decision: plan.decision,
  selectedSkill: plan.selectedSkill,
  primaryIntentType: plan.assessment.primaryIntent.type,
  secondaryIntentTypes: plan.assessment.secondaryIntents.map((intent) => intent.type),
  activeProcess: plan.assessment.activeProcess,
  processStatus: plan.assessment.processStatus,
  missingData: plan.dataMissing,
  phonePresent: plan.assessment.extractedData.phonePresent,
  emailPresent: plan.assessment.extractedData.emailPresent,
  customerKnown: plan.assessment.knownData.customerKnown,
  activeCaseKnown: plan.assessment.knownData.activeCaseKnown,
  actionAllowed: false,
  nextBehavior: plan.nextBehavior,
});

export const persistHermesDispatchPlan = async (input: {
  businessSlug: string;
  conversationId: string;
  workflowId?: string;
  correlationId: string;
  causationId?: string;
  plan: HermesDispatchPlan;
  state?: any;
}) => recordAgentConversationMessage({
  workflowId: input.workflowId || input.conversationId,
  businessSlug: input.businessSlug,
  conversationId: input.conversationId,
  role: 'system',
  visibility: 'internal',
  interactionType: 'system_event',
  body: `Hermes dispatch plan ${input.plan.decision} -> ${input.plan.selectedSkill}`,
  messageId: `${input.plan.turnId}:dispatch-plan`,
  correlationId: input.correlationId,
  causationId: input.causationId,
  metadata: sanitizedMetadataFromPlan(input.plan),
  state: input.state,
});

export const observeHermesReceptionDeskTurn = async (input: HermesReceptionDeskInput) => {
  const messageId = input.messageId || `turn_${input.correlationId}`;
  const referenceTimestamp = new Date().toISOString();
  const built = await buildHermesReadOnlyContext({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    channel: input.channel || 'web_agent',
    customerId: input.customerId,
    managedEntityId: input.managedEntityId,
    caseId: input.caseId,
    processState: input.processState,
  });

  const assessment = await assessHermesTurn({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    message: input.message,
    context: built.context,
    processState: input.processState,
    messageId,
  });
  const plan = buildHermesDispatchPlan({
    assessment,
    correlationId: input.correlationId,
    workflowId: input.workflowId,
    businessTimezone: built.context.business?.timezone,
    locale: 'es-PE',
    referenceTimestamp,
  });

  await persistHermesDispatchPlan({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    workflowId: input.workflowId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    plan,
    state: input.processState,
  });

  return {
    context: built.context,
    history: built.history,
    assessment,
    plan,
  };
};
