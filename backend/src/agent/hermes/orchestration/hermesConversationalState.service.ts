import { HermesReadOnlyContext } from '../context/hermesContext.contract';

export type HermesConversationalState = {
  currentTopic: string | null;
  userGoal: string | null;
  knownFacts: Array<{
    key: string;
    value: unknown;
    confidence: number;
    sourceTurnId: string;
  }>;
  corrections: Array<{
    replaces: string;
    correctedValue: unknown;
    sourceTurnId: string;
  }>;
  hypothesesDiscussed: string[];
  questionsAlreadyAsked: string[];
  questionsAlreadyAnswered: string[];
  unresolvedQuestions: string[];
  lastAssistantCommitment: string | null;
  activeProcessSummary: unknown | null;
};

export type HermesConversationalDelta = {
  newFacts: Record<string, unknown>;
  correctedFacts: Record<string, unknown>;
  answeredQuestion: string | null;
  newQuestion: string | null;
  topicChanged: boolean;
  topicReference: string | null;
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const recentEntries = (context?: HermesReadOnlyContext) =>
  (context?.conversation?.history || []).slice(-8);

const addFact = (
  facts: Map<string, HermesConversationalState['knownFacts'][number]>,
  key: string,
  value: unknown,
  sourceTurnId: string,
  confidence = 0.8
) => {
  facts.set(key, { key, value, confidence, sourceTurnId });
};

const factValue = (state: HermesConversationalState, key: string) =>
  state.knownFacts.find((fact) => fact.key === key)?.value;

const topicFrom = (text: string) => {
  const value = normalize(text);
  if (/\baire acondicionado|compresor|enfria|enfria|enfriar\b/.test(value)) return 'air_conditioning';
  if (/\bembrague|clutch\b/.test(value)) return 'clutch';
  if (/\bfreno|frenos|pastilla|disco|frenar\b/.test(value)) return 'brakes';
  if (/\bmaf|sensor|obd|check\b/.test(value)) return 'engine_diagnostics';
  if (/\bvibra|vibracion\b/.test(value)) return 'vibration';
  return null;
};

const isLikelyVehicleConditionReport = (text: string) => {
  const value = normalize(text).replace(/\s+/g, ' ').trim();
  if (!value || /\?$/.test(value)) return false;
  const vehicleContext = /\b(auto|carro|vehiculo|camioneta|moto|motor|freno|frenos|aceite|llanta|direccion|suspension)\b/.test(value);
  const conditionSignal = /\b(pierde|perdio|perdiendo|falla|fallando|suena|ruido|vibra|vibracion|se apaga|apag[aó]|no responde|cuesta|testigo|luz|humo|consume|consumo|calienta|potencia|fuerza|acelerar|lento|raspa|raspado)\b/.test(value);
  const userReport = /\b(mi|el|la|siento|noto|escucho|tiene|hace|esta|cuando|al|ultimamente|a veces|ya no|sobre todo|en frio|en caliente|se siente|se pone)\b/.test(value);
  const drivingContext = /\b(acelero|acelera|subida|subidas|detenido|recorrido|marcha|velocidad)\b/.test(value);
  return (conditionSignal || drivingContext) && (vehicleContext || userReport);
};

const questionKeyFrom = (assistantText: string) => {
  const text = normalize(assistantText);
  if (/\b(cuando|momento)\b.*\b(enfria|enfriar|deja de enfriar|ocurre|aparece)\b/.test(text)) return 'condition_when_occurs';
  if (/\bduro|patina|ruido|vibra|marcha\b/.test(text) && /\bembrague|clutch\b/.test(text)) return 'clutch_symptom_detail';
  if (/\bperdida de potencia|jaloneos|consumo|luz\b/.test(text)) return 'engine_symptom_detail';
  if (/\bactiva|apaga|aire\b/.test(text)) return 'ac_noise_activation';
  return /\?/.test(assistantText) || /\b(queda|aparece|cuando|donde|como|cual|que)\b/.test(text) ? 'general_question' : null;
};

const factsFromUserText = (message: string, sourceTurnId: string) => {
  const text = normalize(message);
  const facts = new Map<string, HermesConversationalState['knownFacts'][number]>();
  const corrections: HermesConversationalState['corrections'] = [];

  if (/\bno deja de enfriar\b/.test(text)) {
    addFact(facts, 'air_conditioning.cooling', true, sourceTurnId, 0.95);
    corrections.push({ replaces: 'air_conditioning.does_not_cool', correctedValue: false, sourceTurnId });
  }

  if (/\bsi enfria|sí enfría|enfria pero|enfria,? pero\b/.test(text)) {
    addFact(facts, 'air_conditioning.cooling', true, sourceTurnId, 0.95);
    corrections.push({ replaces: 'air_conditioning.does_not_cool', correctedValue: false, sourceTurnId });
  }
  if (/\bno enfria|no esta enfriando|dejo de enfriar|deja de enfriar\b/.test(text) && !/\bno deja de enfriar\b/.test(text)) {
    addFact(facts, 'air_conditioning.cooling', false, sourceTurnId, 0.9);
  }
  if (/\bcompresor\b/.test(text) && /\bsuena|ruido|ronca|chilla|golpea\b/.test(text)) {
    addFact(facts, 'air_conditioning.noiseSource', 'compressor', sourceTurnId, 0.9);
  }
  if (/\bsuena|ruido|ronca|chilla|golpea\b/.test(text)) {
    addFact(facts, 'symptom.noise', true, sourceTurnId, 0.8);
  }
  if (/\bcuando prendo|al prender|activo el aire|activas el aire\b/.test(text)) {
    addFact(facts, 'air_conditioning.noiseOnActivation', true, sourceTurnId, 0.85);
  }
  if (/\bmucho calor|hace calor|alta temperatura|calor fuerte\b/.test(text)) {
    addFact(facts, 'condition.highAmbientTemperature', true, sourceTurnId, 0.85);
  }
  if (/\bno\b.{0,20}\bpierde potencia|no pierde potencia|solo vibra\b/.test(text)) {
    addFact(facts, 'engine.powerLoss', false, sourceTurnId, 0.9);
    if (/\bsolo vibra\b/.test(text)) addFact(facts, 'symptom.vibration', true, sourceTurnId, 0.9);
    corrections.push({ replaces: 'engine.powerLoss', correctedValue: false, sourceTurnId });
  }
  if (/\bno\b.{0,20}\bduro|no esta duro|no,? patina|patina cuando acelero\b/.test(text)) {
    addFact(facts, 'clutch.hardPedal', false, sourceTurnId, 0.9);
    if (/\bpatina\b/.test(text)) addFact(facts, 'clutch.slips', true, sourceTurnId, 0.9);
    corrections.push({ replaces: 'clutch.hardPedal', correctedValue: false, sourceTurnId });
  }
  if (/\bsolo aparece en frio|en frio|frio\b/.test(text)) {
    addFact(facts, 'condition.coldOnly', true, sourceTurnId, 0.85);
  }
  if (isLikelyVehicleConditionReport(message)) {
    addFact(facts, 'vehicle.reportedCondition', String(message || '').trim(), sourceTurnId, 0.82);
  }
  return { facts, corrections };
};

export const deriveHermesConversationalState = (input: {
  context?: HermesReadOnlyContext;
  userMessage?: string;
}): HermesConversationalState => {
  const facts = new Map<string, HermesConversationalState['knownFacts'][number]>();
  const corrections: HermesConversationalState['corrections'] = [];
  const questionsAlreadyAsked: string[] = [];
  const questionsAlreadyAnswered: string[] = [];
  let currentTopic: string | null = null;
  let lastAssistantCommitment: string | null = null;
  let lastQuestionKey: string | null = null;

  const entries = recentEntries(input.context);
  entries.forEach((entry, index) => {
    const sourceTurnId = `history:${index}`;
    const topic = topicFrom(entry.content);
    if (topic) currentTopic = topic;
    if (entry.role === 'assistant') {
      lastAssistantCommitment = entry.content;
      const questionKey = questionKeyFrom(entry.content);
      if (questionKey) {
        questionsAlreadyAsked.push(questionKey);
        lastQuestionKey = questionKey;
      }
      return;
    }
    const extracted = factsFromUserText(entry.content, sourceTurnId);
    extracted.facts.forEach((fact, key) => facts.set(key, fact));
    corrections.push(...extracted.corrections);
    if (lastQuestionKey && extracted.facts.size) {
      questionsAlreadyAnswered.push(lastQuestionKey);
      lastQuestionKey = null;
    }
  });

  const currentTopicFromUser = input.userMessage ? topicFrom(input.userMessage) : null;
  if (currentTopicFromUser) currentTopic = currentTopicFromUser;
  const current = input.userMessage ? factsFromUserText(input.userMessage, 'current') : undefined;
  current?.facts.forEach((fact, key) => facts.set(key, fact));
  if (current) {
    corrections.push(...current.corrections);
    if (lastQuestionKey && current.facts.size) questionsAlreadyAnswered.push(lastQuestionKey);
  }

  const unresolvedQuestions = questionsAlreadyAsked.filter((question) => !questionsAlreadyAnswered.includes(question));
  return {
    currentTopic,
    userGoal: null,
    knownFacts: [...facts.values()],
    corrections,
    hypothesesDiscussed: [],
    questionsAlreadyAsked: [...new Set(questionsAlreadyAsked)],
    questionsAlreadyAnswered: [...new Set(questionsAlreadyAnswered)],
    unresolvedQuestions: [...new Set(unresolvedQuestions)],
    lastAssistantCommitment,
    activeProcessSummary: input.context?.process || null,
  };
};

export const buildHermesConversationalDelta = (input: {
  context?: HermesReadOnlyContext;
  userMessage: string;
}): HermesConversationalDelta => {
  const history = input.context?.conversation?.history || [];
  const lastEntry = history[history.length - 1];
  const currentAlreadyInHistory = lastEntry?.role === 'user'
    && normalize(lastEntry.content).replace(/\s+/g, ' ').trim() === normalize(input.userMessage).replace(/\s+/g, ' ').trim();
  const previousContext = currentAlreadyInHistory
    ? {
      ...input.context,
      conversation: {
        ...input.context?.conversation,
        history: history.slice(0, -1),
      },
    } as HermesReadOnlyContext
    : input.context;
  const previous = deriveHermesConversationalState({ context: previousContext });
  const next = deriveHermesConversationalState({ context: previousContext, userMessage: input.userMessage });
  const previousFacts = new Map(previous.knownFacts.map((fact) => [fact.key, fact.value]));
  const newFacts: Record<string, unknown> = {};
  const correctedFacts: Record<string, unknown> = {};
  for (const fact of next.knownFacts) {
    if (!previousFacts.has(fact.key)) newFacts[fact.key] = fact.value;
    else if (previousFacts.get(fact.key) !== fact.value) correctedFacts[fact.key] = fact.value;
  }
  for (const correction of next.corrections) {
    if (correction.sourceTurnId === 'current') correctedFacts[correction.replaces] = correction.correctedValue;
  }
  const answered = next.questionsAlreadyAnswered.find((question) => !previous.questionsAlreadyAnswered.includes(question)) || null;
  return {
    newFacts,
    correctedFacts,
    answeredQuestion: answered,
    newQuestion: null,
    topicChanged: Boolean(previous.currentTopic && next.currentTopic && previous.currentTopic !== next.currentTopic),
    topicReference: next.currentTopic,
  };
};

export const hasFact = (state: HermesConversationalState, key: string, value?: unknown) => {
  const current = factValue(state, key);
  return value === undefined ? current !== undefined : current === value;
};

export const isSubstantiallyRepeated = (reply: string, context?: HermesReadOnlyContext) => {
  const normalizedReply = normalize(reply).replace(/\s+/g, ' ').trim();
  if (!normalizedReply) return false;
  return (context?.conversation?.history || [])
    .filter((entry) => entry.role === 'assistant')
    .slice(-3)
    .some((entry) => {
      const previous = normalize(entry.content).replace(/\s+/g, ' ').trim();
      if (!previous) return false;
      const replyTokens = new Set(normalizedReply.split(/\s+/).filter((token) => token.length > 4));
      const previousTokens = previous.split(/\s+/).filter((token) => token.length > 4);
      const overlap = previousTokens.filter((token) => replyTokens.has(token)).length;
      return overlap >= 10 && overlap / Math.max(1, previousTokens.length) > 0.55;
    });
};
