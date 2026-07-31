import assert from 'assert';
import { deterministicFallback } from '../../fallback/deterministicFallback';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { buildHermesTriageResult } from '../orchestration/hermesTriage.service';
import { assessHermesTurn, buildHermesDispatchPlan } from '../orchestration/hermesReceptionDesk.service';
import { synthesizeHermesResponseCandidate } from '../orchestration/hermesResponseSynthesizer.service';
import { evaluateHermesConversationalCoherence } from '../orchestration/hermesConversationalCoherenceGate.service';
import { classifyHermesSemanticTurn } from '../routing/hermesSemanticTurn.service';

const businessSlug = 'demo_test';

const baseContext = (input: {
  history?: HermesReadOnlyContext['conversation']['history'];
  activeProcess?: boolean;
  nextRecommendedField?: string;
} = {}): HermesReadOnlyContext => ({
  business: {
    businessSlug,
    businessName: 'Turagua Racing Peru',
    timezone: 'America/Lima',
    agent: { name: 'Iris', role: 'asistente de atencion automotriz' },
  },
  conversation: {
    conversationId: 'h09-semantic',
    channel: 'web_agent',
    history: input.history || [],
  },
  process: input.activeProcess
    ? {
      active: true,
      processType: 'schedule_consultation',
      status: 'WAITING_FOR_CUSTOMER_DATA',
      awaiting: { type: 'customer_information', nextRecommendedField: input.nextRecommendedField || 'phone' },
      knownFacts: { firstName: 'Juan' },
      allowedActions: ['submit_customer_information'],
      informationalOnly: true,
    }
    : {
      active: false,
      allowedActions: [],
      informationalOnly: true,
    },
  catalog: [
    {
      id: 'diagnostico-general',
      name: 'Diagnostico general',
      description: 'Revision inicial para ubicar fallas.',
      durationMinutes: 60,
      pricing: { type: 'not_published' },
      publicVisible: true,
      active: true,
    },
    {
      id: 'motor-rendimiento',
      name: 'Motor y rendimiento',
      description: 'Evaluacion de potencia, consumo y funcionamiento del motor.',
      durationMinutes: 60,
      pricing: { type: 'not_published' },
      publicVisible: true,
      active: true,
    },
    {
      id: 'frenos-suspension',
      name: 'Frenos y suspension',
      description: 'Revision de frenos, ruidos y suspension.',
      durationMinutes: 60,
      pricing: { type: 'not_published' },
      publicVisible: true,
      active: true,
    },
  ],
  permissions: {
    mode: 'qa_primary',
    readOnly: true,
    canExecuteActions: false,
  },
});

const assess = async (message: string, context = baseContext()) => {
  const assessment = await assessHermesTurn({
    businessSlug,
    conversationId: context.conversation.conversationId,
    message,
    context,
    processState: context.process?.active ? {
      status: context.process.status,
      awaiting: context.process.awaiting,
    } : undefined,
    messageId: `h09-${Date.now()}`,
  });
  const plan = await buildHermesDispatchPlan({
    assessment,
    correlationId: `corr-${Date.now()}`,
    businessTimezone: 'America/Lima',
    locale: 'es-PE',
  });
  const triage = await buildHermesTriageResult({
    assessment,
    plan,
    context,
    runtimeResult: {
      state: context.process?.active ? {
        status: context.process.status,
        awaiting: context.process.awaiting,
      } : undefined,
      toolResults: [],
    },
  });
  const candidate = await synthesizeHermesResponseCandidate({
    turnId: plan.turnId,
    conversationId: plan.conversationId,
    correlationId: plan.correlationId,
    businessSlug,
    agentPersona: context.business?.agent,
    userMessage: message,
    turnAssessment: assessment,
    dispatchPlan: plan,
    skillResult: {
      invocationId: `${plan.turnId}:skill`,
      skillId: plan.selectedSkill,
      skillVersion: 'h09',
      status: 'ANSWER_READY',
      ownerRetainedByHermes: true,
      actionExecutionAllowed: false,
      summary: 'test skill result',
      fallbackUsed: false,
      durationMs: 1,
      producedAt: new Date().toISOString(),
    },
    readOnlyContext: context,
    activeProcessSummary: { active: Boolean(context.process?.active), status: context.process?.status },
    knownFacts: { catalogMatchStatus: triage.catalogMatch.status },
    sideQuestions: assessment.secondaryIntents.map((intent) => ({ type: intent.type, summary: intent.summary })),
    language: 'es',
    businessTimezone: 'America/Lima',
    visibilityMode: 'visible_controlled',
  });
  return { assessment, plan, triage, candidate };
};

const assertNoCatalogDump = (text: string) => {
  assert(!/\b1\.\s+[\s\S]*\b2\.\s+[\s\S]*\b3\.\s+/.test(text), `unexpected catalog dump: ${text}`);
};

const run = async () => {
  const maf = await assess('Como se si mi sensor MAF esta fallando?');
  assert(maf.assessment.primaryIntent.type === 'automotive_qa', `expected automotive_qa, got ${maf.assessment.primaryIntent.type}`);
  assert(maf.plan.decision === 'RESPOND_DIRECTLY', `expected respond directly, got ${maf.plan.decision}`);
  assert(maf.triage.workflowAdvanceAllowed === false, 'automotive qa must not advance workflow');
  assert(maf.triage.proposals.length === 0, 'automotive qa must not propose Temporal actions');
  assert(/MAF|sensor|OBD|potencia|ralenti/i.test(maf.candidate.candidateText), 'MAF answer should stay technical');
  assertNoCatalogDump(maf.candidate.candidateText);

  const brakeSigns = await assess('Como saber que mis frenos fallan?');
  assert(brakeSigns.assessment.primaryIntent.type === 'automotive_qa', `expected brake automotive_qa, got ${brakeSigns.assessment.primaryIntent.type}`);
  assert(/raspado|chillido|pedal|distancia|desvie/i.test(brakeSigns.candidate.candidateText), `brake answer should list general warning signs: ${brakeSigns.candidate.candidateText}`);
  assert(!/frenar fuerte|freno fuerte/i.test(brakeSigns.candidate.candidateText), `brake answer must not invent hard-braking symptom: ${brakeSigns.candidate.candidateText}`);

  const brakeFollowUp = await assess('Raspado', baseContext({
    history: [
      { role: 'user', content: 'Como saber que mis frenos fallan?' },
      { role: 'assistant', content: 'Algunas senales son raspado o chillido, vibracion al frenar, pedal esponjoso o mayor distancia de frenado.' },
    ],
  }));
  assert(/raspado|pastillas|discos|frenos/i.test(brakeFollowUp.candidate.candidateText), `brake follow-up should use reported raspado: ${brakeFollowUp.candidate.candidateText}`);

  const brakeReview = await assess('Quiero revisar mis frenos');
  assert(/frenos|pastillas|discos|caliper/i.test(brakeReview.candidate.candidateText), `brake review should orient generally: ${brakeReview.candidate.candidateText}`);
  assert(!/frenar fuerte|freno fuerte/i.test(brakeReview.candidate.candidateText), `brake review must not invent hard braking: ${brakeReview.candidate.candidateText}`);

  const stepsContext = baseContext({
    history: [
      { role: 'user', content: 'Como se si mi sensor MAF esta fallando?' },
      { role: 'assistant', content: 'Puede causar perdida de potencia y se revisa con diagnostico.' },
    ],
  });
  const steps = await assess('Cuales son los pasos?', stepsContext);
  assert(steps.assessment.primaryIntent.type === 'automotive_qa', `expected continuity automotive_qa, got ${steps.assessment.primaryIntent.type}`);
  assert(/OBD|conector|lecturas del MAF/i.test(steps.candidate.candidateText), 'steps should continue MAF topic');
  assertNoCatalogDump(steps.candidate.candidateText);

  const clutch = await assess('Mi embrague esta duro.');
  assert(clutch.assessment.primaryIntent.type === 'automotive_symptom', `expected automotive_symptom, got ${clutch.assessment.primaryIntent.type}`);
  assert(/duro|patina|ruido|cambiar de marcha|revision/i.test(clutch.candidate.candidateText), 'clutch symptom should ask diagnostic question');
  assertNoCatalogDump(clutch.candidate.candidateText);

  const catalog = await assess('Que servicios tienen?');
  assert(catalog.assessment.primaryIntent.type === 'catalog_general', `expected catalog_general, got ${catalog.assessment.primaryIntent.type}`);
  assert(catalog.plan.decision === 'DELEGATE_INFORMATIONAL', 'catalog request should go read-only catalog');
  assert(/Diagnostico general|Motor y rendimiento/i.test(catalog.candidate.candidateText), 'catalog answer should mention services');
  assert(!/precio no publicado|60 minutos/i.test(catalog.candidate.candidateText), 'catalog general should not dump price/duration by default');

  const food = await assess('Preparan lomos saltados?');
  assert(food.assessment.primaryIntent.type === 'off_domain', `expected off_domain, got ${food.assessment.primaryIntent.type}`);
  assert(/taller automotriz|vehiculo/i.test(food.candidate.candidateText), 'off-domain should redirect briefly to automotive help');
  assertNoCatalogDump(food.candidate.candidateText);

  const social = await assess('Holaaaa');
  assert(social.assessment.primaryIntent.type === 'social_conversation', `expected social_conversation, got ${social.assessment.primaryIntent.type}`);
  assert(social.assessment.arbitration?.lane === 'social', `expected social lane, got ${social.assessment.arbitration?.lane}`);
  assert(social.plan.decision === 'RESPOND_DIRECTLY', `expected social respond directly, got ${social.plan.decision}`);
  assert(!/No puedo|No ofrecemos/i.test(social.candidate.candidateText), `social greeting must not be rejected: ${social.candidate.candidateText}`);

  const recovery = await assess('Mi numero es 933075200');
  assert(recovery.assessment.primaryIntent.type === 'conversation_recovery', `expected conversation_recovery, got ${recovery.assessment.primaryIntent.type}`);
  assert(recovery.assessment.arbitration?.lane === 'identity_recovery', `expected identity recovery lane, got ${recovery.assessment.arbitration?.lane}`);
  assert(recovery.plan.decision === 'RESPOND_DIRECTLY', `expected recovery respond directly, got ${recovery.plan.decision}`);
  assert(!/No puedo|No ofrecemos/i.test(recovery.candidate.candidateText), `explicit identity must not be rejected: ${recovery.candidate.candidateText}`);

  const activeMafContext = baseContext({ activeProcess: true });
  const activeMaf = await assess('Antes, que sintomas da un sensor MAF malo?', activeMafContext);
  assert(activeMaf.assessment.primaryIntent.type === 'active_process_question', `expected active_process_question, got ${activeMaf.assessment.primaryIntent.type}`);
  assert(activeMaf.plan.decision === 'RESPOND_DIRECTLY', 'active process question should not be sent to Temporal');
  assert(activeMaf.triage.proposals.length === 0, 'active process question must not submit pending field');
  assert(/MAF|sensor|OBD/i.test(activeMaf.candidate.candidateText), 'active process question should answer automotive doubt');
  assert(/phone|telefono|contacto|numero/i.test(activeMaf.candidate.candidateText), 'active process question should softly resume pending phone');

  const activeNameContext = baseContext({ activeProcess: true, nextRecommendedField: 'firstName' });
  const activeName = await assess('A nombre de Pepelucho', activeNameContext);
  assert(activeName.assessment.primaryIntent.type === 'provide_customer_data', `expected provide_customer_data, got ${activeName.assessment.primaryIntent.type}`);
  assert(activeName.plan.decision === 'CONTINUE_ACTIVE_PROCESS', `expected active process continuation, got ${activeName.plan.decision}`);
  assert(activeName.triage.proposals.some((proposal) => proposal.capability === 'continue_schedule_consultation'), 'name answer should propose Temporal continuation');

  const activePhone = await assess('933075200', activeMafContext);
  assert(activePhone.assessment.primaryIntent.type === 'provide_customer_data', `expected provide_customer_data for phone, got ${activePhone.assessment.primaryIntent.type}`);
  assert(activePhone.plan.decision === 'CONTINUE_ACTIVE_PROCESS', `expected phone continuation, got ${activePhone.plan.decision}`);

  const activeExplicitPhone = await assess('Mi numero es 933075200', activeMafContext);
  assert(activeExplicitPhone.assessment.primaryIntent.type === 'provide_customer_data', `expected contextual phone data, got ${activeExplicitPhone.assessment.primaryIntent.type}`);
  assert(activeExplicitPhone.assessment.arbitration?.lane === 'active_process_data', `expected active process lane, got ${activeExplicitPhone.assessment.arbitration?.lane}`);

  const activePhoneQuestion = await assess('Cuanto demora la revision?', activeMafContext);
  assert(activePhoneQuestion.assessment.primaryIntent.type === 'active_process_question', `expected side question, got ${activePhoneQuestion.assessment.primaryIntent.type}`);
  assert(activePhoneQuestion.plan.decision === 'RESPOND_DIRECTLY', 'side question should not submit pending phone');

  const badOffDomain = await evaluateHermesConversationalCoherence({
    userMessage: 'Como se si mi sensor MAF esta fallando?',
    reply: 'No ofrecemos comida. Tenemos 1. Diagnostico general 2. Motor y rendimiento 3. Frenos y suspension.',
    context: baseContext(),
  });
  assert(!badOffDomain.accepted, 'coherence gate should reject automotive false off-domain');
  assert(badOffDomain.rejectionReasons.includes('OFF_DOMAIN_FALSE_POSITIVE'), 'missing off-domain false positive reason');
  assert(badOffDomain.rejectionReasons.includes('CATALOG_DUMP_WITHOUT_REQUEST'), 'missing catalog dump reason');

  const fallback = await deterministicFallback({
    conversation: {
      conversationId: 'h09-fallback',
      businessSlug,
      channel: 'web_agent',
      recentMessages: [],
    },
    business: {
      businessSlug,
      business: { name: 'Turagua Racing Peru', timezone: 'America/Lima' },
      agent: { name: 'Iris', role: 'asistente' },
      capabilities: [],
      catalogSummary: baseContext().catalog?.map((item) => ({
        id: item.id,
        name: item.name || item.id,
        description: item.description,
        durationMinutes: item.durationMinutes,
      })),
    },
  }, 'Mi embrague');
  assert(fallback.intent?.name === 'automotive_symptom', `expected fallback automotive_symptom, got ${fallback.intent?.name}`);
  assert(/embrague|cambiar de marcha/i.test(String(fallback.reply || '')), 'fallback should not redirect automotive symptom as unsupported');
  assertNoCatalogDump(String(fallback.reply || ''));

  const semanticService = await classifyHermesSemanticTurn({ message: 'Quiero que revisen mi embrague.', context: baseContext() });
  assert(semanticService.intent === 'service_request', `expected service_request, got ${semanticService.intent}`);
  const serviceRequest = await assess('Quiero que revisen mi embrague.');
  assert(serviceRequest.triage.workflowAdvanceAllowed === false, 'service request should wait for booking confirmation before Temporal');
  assert(/coordinar|cita/i.test(serviceRequest.candidate.candidateText), 'service request should ask for booking confirmation');

  const booking = await assess('Quiero reservar.');
  assert(booking.assessment.primaryIntent.type === 'booking_intent' || booking.assessment.primaryIntent.type === 'start_booking', `expected booking intent, got ${booking.assessment.primaryIntent.type}`);
  assert(booking.triage.workflowAdvanceAllowed === true, 'explicit booking intent should be allowed to start Temporal');
  assert(booking.triage.proposals.some((proposal) => proposal.capability === 'start_schedule_consultation'), 'explicit booking should propose start_schedule_consultation');
  assert(/reservar|servicio|vehiculo/i.test(booking.candidate.candidateText), 'booking reply should ask for service selection naturally');

  console.log('h09-semantic-routing: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
