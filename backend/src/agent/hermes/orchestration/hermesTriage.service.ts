import { HermesDispatchPlan } from '../contracts/hermesDispatchPlan.contract';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesTriageResult } from '../contracts/hermesTriage.contract';
import { HermesSkillResult } from '../contracts/hermesSkillRegistry.contract';
import { HermesQuestionSummary, HermesSkillId, HermesTurnAssessment } from '../contracts/hermesTurnAssessment.contract';

const normalizeText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const awaitingFromState = (state?: any) =>
  String(
    state?.awaiting?.nextRecommendedField
    || state?.awaiting?.field
    || state?.awaiting?.type
    || ''
  ).trim() || undefined;

const selectedAgentFromSkill = (skill?: HermesSkillId): HermesTriageResult['selectedAgent'] => {
  if (skill === 'catalog-advisor') return 'catalog-agent';
  if (skill === 'scheduling-specialist' || skill === 'scheduling-companion') return 'scheduling-agent';
  if (skill === 'recovery-escalation') return 'recovery-agent';
  return 'conversation-agent';
};

const modeFromDecision = (decision?: string, runtimeResult?: any): HermesTriageResult['mode'] => {
  if (decision === 'PROPOSE_ACTION') return 'respond_and_act';
  if (decision === 'CONTINUE_ACTIVE_PROCESS') {
    return Array.isArray(runtimeResult?.toolResults) && runtimeResult.toolResults.length ? 'respond_and_act' : 'respond_only';
  }
  if (decision === 'DELEGATE_INFORMATIONAL' || decision === 'RESPOND_DIRECTLY') return 'respond_only';
  if (decision === 'ASK_FOR_INFORMATION') return 'clarify';
  return 'recover';
};

const sideQuestionTopicFrom = (questions: HermesQuestionSummary[]) => {
  const first = questions[0];
  if (!first) return undefined;
  if (first.type === 'duration') return 'offering_duration';
  if (first.type === 'price') return 'published_price';
  if (first.type === 'compatibility') return 'offering_compatibility';
  if (first.type === 'business_information') return 'business_information';
  return 'general_question';
};

const requiredContextFromAgent = (selectedAgent: HermesTriageResult['selectedAgent'], activeProcess: boolean) => {
  if (selectedAgent === 'catalog-agent') return ['businessContext', 'catalogContext'];
  if (selectedAgent === 'scheduling-agent') {
    return activeProcess
      ? ['businessContext', 'catalogContext', 'customerContext', 'processContext']
      : ['businessContext', 'catalogContext', 'customerContext'];
  }
  if (selectedAgent === 'recovery-agent') return ['businessContext', 'processContext'];
  return ['businessContext'];
};

const supportingAgentsFrom = (selectedAgent: HermesTriageResult['selectedAgent'], questions: HermesQuestionSummary[]) => {
  if (selectedAgent === 'scheduling-agent' && questions.some((question) => ['duration', 'price', 'compatibility'].includes(question.type))) {
    return ['catalog-agent'] as const;
  }
  return [];
};

const sanitizedFactsFrom = (assessment: HermesTurnAssessment, plan: HermesDispatchPlan) => ({
  firstName: assessment.extractedData.firstName,
  lastNamePresent: Boolean(assessment.extractedData.lastName),
  phonePresent: assessment.extractedData.phonePresent,
  emailPresent: assessment.extractedData.emailPresent,
  offeringId: assessment.extractedData.offeringId || plan.skillContext.relevantFacts.offeringId,
  requestedDate: assessment.extractedData.requestedDate,
  requestedTime: assessment.extractedData.requestedTime,
  requestedDayPart: assessment.extractedData.requestedDayPart,
  slotId: assessment.extractedData.slotId,
  managedEntityHint: assessment.extractedData.managedEntityHint,
  managedEntityYear: assessment.extractedData.managedEntityYear,
  customerKnown: assessment.knownData.customerKnown,
  phoneKnown: assessment.knownData.phoneKnown,
  emailKnown: assessment.knownData.emailKnown,
  selectedOfferingKnown: assessment.knownData.selectedOfferingKnown,
});

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const hasCatalogQuestion = (message: string) =>
  /\b(servicio|servicios|catalogo|catálogo|opciones|ofrecen|ofreces|tienen|tienes)\b/i.test(normalize(message));

const hasExplicitServiceRequest = (message: string) =>
  /\b(quiero|quisiera|necesito|busco|me haces|preparame|prepárame|dame)\b/i.test(normalize(message));

const catalogMatchFrom = (input: {
  assessment: HermesTurnAssessment;
  plan: HermesDispatchPlan;
  context?: HermesReadOnlyContext;
}): HermesTriageResult['catalogMatch'] => {
  const offeringId = input.assessment.extractedData.offeringId || String(input.plan.skillContext.relevantFacts.offeringId || '').trim() || undefined;
  if (offeringId) {
    return {
      status: 'exact',
      offeringId,
      confidence: 'high',
    };
  }

  if (input.assessment.knownData.selectedOfferingKnown) {
    return {
      status: 'recent_list_reference',
      confidence: 'high',
    };
  }

  if (hasCatalogQuestion(input.assessment.turnText || '') && (input.context?.catalog || []).length > 1) {
    return {
      status: 'ambiguous',
      confidence: 'medium',
    };
  }

  if (hasExplicitServiceRequest(input.assessment.turnText || '')) {
    return {
      status: 'none',
      confidence: 'medium',
    };
  }

  return {
    status: 'none',
    confidence: 'low',
  };
};

const customerDataFromAssessment = (assessment: HermesTurnAssessment) => {
  const data: Record<string, unknown> = {};
  const turnText = String(assessment.turnText || '');
  const awaitingField = String(assessment.awaiting?.nextRecommendedField || '').trim();
  const normalizedTurn = normalize(turnText);
  const awaitingCustomerIdentity = /firstName|lastName|customer_identity|customer_last_name|nombre|apellido/i.test(awaitingField);
  if (
    awaitingCustomerIdentity
    && /\b(freno|frenos|suena|suenan|sonando|ruido|fuerte|suave|frenar|suspension|problema|falla|quiero|quisiera|necesito|revisarlo|revision|evaluacion|cita|agendar|reservar|hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/i.test(normalizedTurn)
  ) {
    return data;
  }
  if (assessment.extractedData.firstName) data.firstName = assessment.extractedData.firstName;
  if (assessment.extractedData.lastName) data.lastName = assessment.extractedData.lastName;
  const phone = turnText.match(/\b(?:\+?\d[\d\s-]{6,}\d)\b/)?.[0]?.replace(/\D/g, '');
  const email = turnText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  if (phone) data.phone = phone;
  if (email) data.email = email;
  if (
    /managedentitydisplayname|managed_entity|vehiculo|elemento|equipo/i.test(awaitingField)
  ) {
    const managedEntityDisplayName = assessment.extractedData.managedEntityHint
      || (
        turnText.trim().length >= 3
        && turnText.trim().length <= 80
        && !/[?¿!]/.test(turnText)
        && !/\b(soy|me llamo|mi nombre es|telefono|celular|correo|email)\b/i.test(normalizedTurn)
          ? turnText.trim()
          : undefined
      );
    if (managedEntityDisplayName) data.managedEntityDisplayName = managedEntityDisplayName;
  }
  return data;
};

const proposalsFrom = (input: {
  assessment: HermesTurnAssessment;
  plan: HermesDispatchPlan;
  catalogMatch: HermesTriageResult['catalogMatch'];
  skillResult?: HermesSkillResult;
}): HermesTriageResult['proposals'] => {
  const proposals: HermesTriageResult['proposals'] = [];
  const turnText = String(input.assessment.turnText || '');
  const extractedCustomerData = customerDataFromAssessment(input.assessment);
  const hasContactData = Boolean(input.assessment.extractedData.phonePresent || input.assessment.extractedData.emailPresent);
  const primaryIntent = input.assessment.primaryIntent.type;
  const activeProcess = Boolean(input.assessment.activeProcess);
  const normalizedTurn = normalizeText(turnText);
  const bookingNegated = /\b(no quiero|no deseo|no voy a|todavia no|aun no|solo|solamente)\b.*\b(reserv|agend|cita|turno)\w*/.test(normalizedTurn)
    || /\b(solo|solamente)\s+(estoy\s+)?(consultando|preguntando|averiguando)\b/.test(normalizedTurn);

  if (input.plan.decision === 'DELEGATE_INFORMATIONAL') {
    proposals.push({
      capability: input.catalogMatch.offeringId ? 'get_offering_details' : 'search_catalog',
      arguments: input.catalogMatch.offeringId ? { offeringId: input.catalogMatch.offeringId } : { query: turnText },
      reasonCode: input.catalogMatch.offeringId ? 'CATALOG_DETAIL' : 'CATALOG_LIST',
    });
    return proposals;
  }

  if (!['PROPOSE_ACTION', 'CONTINUE_ACTIVE_PROCESS'].includes(input.plan.decision)) return proposals;
  if (bookingNegated) return proposals;
  const transactionalQuestion =
    primaryIntent === 'request_availability'
    || primaryIntent === 'select_slot'
    || primaryIntent === 'provide_customer_data'
    || primaryIntent === 'select_offering';
  if (primaryIntent === 'side_question' || (input.assessment.questions.length && !transactionalQuestion)) return proposals;

  if (primaryIntent === 'start_booking' && !activeProcess) {
    proposals.push({
      capability: 'start_schedule_consultation',
      arguments: {
        ...(input.catalogMatch.offeringId ? { offeringId: input.catalogMatch.offeringId } : {}),
        customerMessage: turnText,
      },
      reasonCode: input.catalogMatch.offeringId ? 'START_BOOKING_WITH_OFFERING' : 'START_BOOKING_GENERIC',
    });

    if (Object.keys(extractedCustomerData).length || hasContactData) {
      proposals.push({
        capability: 'continue_schedule_consultation',
        arguments: {
          action: 'submit_customer_information',
          data: extractedCustomerData,
        },
        reasonCode: 'SUBMIT_CUSTOMER_INFORMATION_AFTER_START',
      });
    }

    return proposals;
  }

  if (primaryIntent === 'provide_customer_data' && (Object.keys(extractedCustomerData).length || hasContactData)) {
    proposals.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_customer_information',
        data: extractedCustomerData,
      },
      reasonCode: 'SUBMIT_CUSTOMER_INFORMATION',
    });
  }

  if (primaryIntent === 'select_offering' && input.catalogMatch.offeringId) {
    proposals.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_offering_selection',
        data: { catalogOfferingId: input.catalogMatch.offeringId },
      },
      reasonCode: 'SUBMIT_OFFERING_SELECTION',
    });
  }

  if (primaryIntent === 'request_availability' && (
    input.assessment.extractedData.requestedDate
    || input.assessment.extractedData.requestedTime
    || input.assessment.extractedData.requestedDayPart
    || input.assessment.extractedData.notBeforeTime
  )) {
    proposals.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_date_preference',
        data: {
          ...(input.assessment.extractedData.requestedDate ? { preferredDate: input.assessment.extractedData.requestedDate } : {}),
          ...(input.assessment.extractedData.requestedTime ? { preferredTime: input.assessment.extractedData.requestedTime } : {}),
          ...(input.assessment.extractedData.requestedDayPart ? { preferredDayPart: input.assessment.extractedData.requestedDayPart } : {}),
          ...(input.assessment.extractedData.notBeforeTime ? { notBeforeTime: input.assessment.extractedData.notBeforeTime } : {}),
        },
      },
      reasonCode: 'SUBMIT_DATE_PREFERENCE',
    });
  }

  if (primaryIntent === 'select_slot' && input.assessment.extractedData.slotId) {
    proposals.push({
      capability: 'continue_schedule_consultation',
      arguments: {
        action: 'submit_slot_selection',
        data: { slotId: input.assessment.extractedData.slotId },
      },
      reasonCode: 'SUBMIT_SLOT_SELECTION',
    });
  }

  return proposals.slice(0, 2);
};

export const buildHermesTriageResult = (input: {
  assessment: HermesTurnAssessment;
  plan: HermesDispatchPlan;
  context?: HermesReadOnlyContext;
  skillResult?: HermesSkillResult;
  runtimeResult?: any;
}): HermesTriageResult => {
  const selectedAgent = selectedAgentFromSkill(input.plan.selectedSkill);
  const sideTopic = sideQuestionTopicFrom(input.assessment.questions);
  const activeProcess = Boolean(input.assessment.activeProcess || input.runtimeResult?.state?.status);
  const supportingAgents = supportingAgentsFrom(selectedAgent, input.assessment.questions);
  const catalogMatch = catalogMatchFrom(input);
  const proposals = proposalsFrom({
    assessment: input.assessment,
    plan: input.plan,
    catalogMatch,
    skillResult: input.skillResult,
  });
  const workflowAdvanceAllowed = proposals.some((proposal) =>
    proposal.capability === 'start_schedule_consultation' || proposal.capability === 'continue_schedule_consultation'
  ) && input.assessment.primaryIntent.type !== 'service_request';
  const pendingField = awaitingFromState(input.runtimeResult?.state) || input.assessment.awaiting?.nextRecommendedField;
  return {
    intent: input.assessment.primaryIntent.type,
    mode: modeFromDecision(input.plan.decision, input.runtimeResult),
    facts: sanitizedFactsFrom(input.assessment, input.plan),
    catalogMatch,
    sideQuestion: sideTopic ? { detected: true, topic: sideTopic } : undefined,
    selectedAgent,
    supportingAgents: supportingAgents.length ? [...supportingAgents] : undefined,
    requiredContext: requiredContextFromAgent(selectedAgent, activeProcess),
    workflowAdvanceAllowed,
    proposals,
    responseGoal: {
      answerCurrentMessageFirst: true,
      discloseAuthoritativeResult: workflowAdvanceAllowed,
      resumePendingProcess: activeProcess || workflowAdvanceAllowed,
      ...(pendingField ? { pendingField } : {}),
    },
    confidence: input.assessment.confidence,
    reasonCode: `${input.plan.decision}:${input.assessment.primaryIntent.type}`,
    process: {
      active: activeProcess,
      status: input.assessment.processStatus || String(input.runtimeResult?.state?.status || '').trim() || undefined,
      awaiting: awaitingFromState(input.runtimeResult?.state),
    },
  };
};
