import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import {
  buildHermesConversationalDelta,
  deriveHermesConversationalState,
  hasFact,
} from '../orchestration/hermesConversationalState.service';
import { callModelJson, ModelMessageBatch } from '../orchestration/hermesConversationalTurn.service';

export type HermesTurnIntent =
  | 'social_conversation'
  | 'automotive_qa'
  | 'automotive_symptom'
  | 'catalog_general'
  | 'catalog_offering_question'
  | 'service_request'
  | 'booking_intent'
  | 'active_process_data'
  | 'active_process_question'
  | 'conversation_recovery'
  | 'domain_clarification'
  | 'off_domain';

export type HermesSemanticTurn = {
  intent: HermesTurnIntent;
  confidence: 'high' | 'medium' | 'low';
  automotiveTopic?: string;
  reasonCode: string;
};

export type DomainResolution = {
  domain: 'automotive' | 'business_operations' | 'social' | 'clearly_external' | 'uncertain';
  confidence: number;
  automotiveConcepts: string[];
  externalCategory?: 'food' | 'schoolwork' | 'travel' | 'retail' | 'health' | 'finance' | 'other';
  catalogMatches: Array<{
    offeringId: string;
    confidence: number;
    relation: 'exact' | 'equivalent' | 'broader' | 'possible';
  }>;
  goal?: string;
  topic?: string;
  facts?: string[];
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[!?.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const AUTOMOTIVE_TERMS = [
  'auto',
  'carro',
  'vehiculo',
  'motor',
  'sensor',
  'maf',
  'map',
  'obd',
  'check engine',
  'tablero',
  'embrague',
  'clutch',
  'caja',
  'transmision',
  'freno',
  'frenos',
  'suspension',
  'amortiguador',
  'direccion',
  'bateria',
  'alternador',
  'radiador',
  'aceite',
  'humo',
  'potencia',
  'ralenti',
  'acelera',
  'acelerar',
  'vibra',
  'vibracion',
  'ruido',
  'suena',
  'llanta',
  'neumatico',
  'aire acondicionado',
  'inyector',
  'bujia',
  'bujias',
  'correa',
  'fuga',
  'admision',
  'turbo',
];

const activeProcess = (context?: HermesReadOnlyContext) => Boolean(context?.process?.active);

const extractConcepts = (message: string) => {
  const text = normalize(message);
  const stripped = text
    .replace(/\b(quiero|quisiera|necesito|busco|podrian|pueden|hacer|hacerle|revisar|revisen|limpiar|escanear|pasarle|un|una|el|la|los|las|mi|mis|del|de|para|por favor)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const concepts = new Set<string>();
  for (const term of AUTOMOTIVE_TERMS) {
    if (text.includes(term)) concepts.add(term);
  }
  if (stripped && stripped.length >= 4) concepts.add(stripped);
  return [...concepts].slice(0, 4);
};

const hasOpenWorldServiceShape = (message: string) =>
  /\b(quiero|quisiera|necesito|busco|podrian|pueden)\b.{0,80}\b(afinacion|afinamiento|revision|revisar|limpieza|limpiar|escanear|scanner|diagnostico|diagnosticar|servicio|sistema|electronico|computadora|inyeccion|encendido|motor)\b/.test(normalize(message));

const hasOpenWorldSymptomShape = (message: string) =>
  /\b(se|esta|siento|noto|anda|funciona|motor|carro|vehiculo)\b.{0,80}\b(falla|fallando|chancha|jalonea|queda|piso|gasta|gastando|gasolina|cabecea|cascabelea|tironea|lento|pesado|raro|prendio|luz|check)\b/.test(normalize(message));

const catalogMatchesFrom = (message: string, context?: HermesReadOnlyContext): DomainResolution['catalogMatches'] => {
  const text = normalize(message);
  const catalog = context?.catalog || [];
  const matches: DomainResolution['catalogMatches'] = [];
  for (const offering of catalog) {
    const name = normalize(offering.name || '');
    const description = normalize(offering.description || '');
    const haystack = `${name} ${description}`;
    if (name && text.includes(name)) {
      matches.push({ offeringId: offering.id, confidence: 0.95, relation: 'exact' });
      continue;
    }
    if (/\b(afinacion|afinamiento|preventivo|bujia|bujias|bobina|bobinas|inyector|inyectores|aceite|filtro)\b/.test(text)
      && /\bmantenimiento|motor|rendimiento|diagnostico\b/.test(haystack)) {
      matches.push({ offeringId: offering.id, confidence: 0.72, relation: 'broader' });
      continue;
    }
    if (/\b(electronico|computadora|scanner|escanear|obd|check|sensor|inyeccion|encendido|cuerpo de aceleracion|egr|catalizador)\b/.test(text)
      && /\bmotor|rendimiento|diagnostico|mantenimiento\b/.test(haystack)) {
      matches.push({ offeringId: offering.id, confidence: 0.68, relation: 'broader' });
      continue;
    }
    if (/\b(embrague|clutch|caja|transmision)\b/.test(text) && /\bdiagnostico|motor|rendimiento|mantenimiento\b/.test(haystack)) {
      matches.push({ offeringId: offering.id, confidence: 0.55, relation: 'possible' });
    }
  }
  return matches.slice(0, 3);
};

export const resolveHermesDomain = async (input: {
  message: string;
  context?: HermesReadOnlyContext;
}): Promise<DomainResolution> => {
  const message = String(input.message || '');
  const text = normalize(message);
  const social = hasSocialSignal(message);
  const catalogMatches = catalogMatchesFrom(message, input.context);
  const concepts = extractConcepts(message);
  const directAutomotive = AUTOMOTIVE_TERMS.some((term) => text.includes(term));
  const serviceShape = hasOpenWorldServiceShape(message);
  const symptomShape = hasOpenWorldSymptomShape(message);

  if (social) {
    return {
      domain: 'social',
      confidence: 0.85,
      automotiveConcepts: [],
      catalogMatches: [],
    };
  }

  const prompt = `Actúa como clasificador de dominios semánticos para un taller automotriz.
Evalúa el siguiente mensaje del usuario y determina a qué dominio pertenece, el objetivo principal, el tema y los hechos relevantes reportados.
Reglas estrictas de clasificación:
1. "clearly_external": SÓLO aplica cuando hay evidencia positiva y clara de que el usuario está solicitando algo de OTRO dominio conocido (ej. recetas de comida, consejos de inversión, viajes). No uses clearly_external ni off_domain solo porque falten términos automotrices.
2. "automotive": Aplica cuando el usuario habla de autos, síntomas físicos (ej. recalentamiento, temperatura, agujas, frenos), situaciones de manejo (ej. en tráfico), repuestos, o consultas técnicas. ¡Ojo! Pedir "revisión" o "mantenimiento" de un objeto desconocido NO lo hace automotive automáticamente.
3. "social": Saludos o preguntas sobre tu identidad.
4. "uncertain": Aplica cuando la intención es ambigua o pide un servicio sobre algo que puede no ser del auto (ej. "revisión de dientes"). NUNCA asumas "automotive" solo porque use la palabra "revisión". NUNCA lo conviertas a off_domain automáticamente si faltan datos.

Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "domain": "automotive" | "social" | "clearly_external" | "uncertain",
  "confidence": <número entre 0 y 1>,
  "goal": "technical_orientation" | "service_booking" | "social_greeting" | "out_of_domain_request" | "unknown",
  "topic": "<resumen corto del tema, ej. engine_overheating>",
  "facts": ["<hecho reportado 1, ej. la aguja sube>", "<hecho reportado 2, ej. ocurre en tráfico>"],
  "automotiveConcepts": [<array de strings con conceptos clave detectados>],
  "externalCategory": "food" | "schoolwork" | "travel" | "retail" | "health" | "finance" | "other" (solo si es clearly_external)
}`;

  const messages = Object.assign([
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: message }
  ], { projectionStats: undefined });

  let parsed: any = {};
  if (message.trim().length > 0) {
    const result = await callModelJson(messages, {
      stage: 'turn_interpretation',
      conversationId: input.context?.conversation?.conversationId
    });
    parsed = result?.parsed || {};
  }

  const llmDomain = parsed.domain || 'uncertain';
  
  if (llmDomain === 'clearly_external') {
    return {
      domain: 'clearly_external',
      confidence: parsed.confidence || 0.9,
      automotiveConcepts: [],
      externalCategory: parsed.externalCategory || 'other',
      catalogMatches: [],
      goal: parsed.goal,
      topic: parsed.topic,
      facts: parsed.facts,
    };
  }

  if (llmDomain === 'automotive' || directAutomotive || catalogMatches.length) {
    return {
      domain: 'automotive',
      confidence: parsed.confidence || (directAutomotive ? 0.9 : 0.62),
      automotiveConcepts: parsed.automotiveConcepts || concepts,
      catalogMatches,
      goal: parsed.goal,
      topic: parsed.topic,
      facts: parsed.facts,
    };
  }

  return {
    domain: 'uncertain',
    confidence: parsed.confidence || 0.35,
    automotiveConcepts: parsed.automotiveConcepts || concepts,
    catalogMatches: [],
    goal: parsed.goal,
    topic: parsed.topic,
    facts: parsed.facts,
  };
};

export const hasAutomotiveDomainSignal = async (message: string, context?: HermesReadOnlyContext) => {
  const current = normalize(message);
  const resolved = await resolveHermesDomain({ message, context });
  if (resolved.domain === 'automotive') return true;
  if (AUTOMOTIVE_TERMS.some((term) => current.includes(term))) return true;
  const referentialFollowUp = /\b(cuales son los pasos|que pasos|los pasos|cuales pasos|eso|ese problema|esa falla|lo reviso|como hago|puedo manejar|manejar asi|conducir asi|riesgo|grave|peligroso|seguro)\b/.test(current);
  if (!referentialFollowUp) return false;
  const recent = (context?.conversation?.history || [])
    .slice(-4)
    .map((entry) => entry.content)
    .join(' ');
  const text = normalize(`${context?.conversation?.memory?.activeTopic || ''} ${recent} ${message}`);
  return AUTOMOTIVE_TERMS.some((term) => text.includes(term));
};

const hasTechnicalQuestion = (message: string) => {
  const text = normalize(message);
  return /[?]/.test(message)
    || /\b(como saber|como se|que significa|por que|porque|que hace|como funciona|cuales son los pasos|que pasos|como reviso|como detectar|esta mal|fallando|falla)\b/.test(text);
};

const hasSymptomSignal = (message: string) => {
  const text = normalize(message);
  return /\b(esta duro|duro|patina|vibra|vibracion|tiembla|ruido|suena|humo|pierde potencia|no enfria|no arranca|se apaga|jalonea|tirones|fuga|check engine|luz del tablero|calienta|se calienta|cuesta cambiar|no prende)\b/.test(text);
};

const hasCatalogGeneralRequest = (message: string) =>
  /\b(que servicios|servicios tienen|muestrame servicios|mostrar servicios|catalogo|opciones tienen|que hacen|ofrecen)\b/.test(normalize(message));

const hasCatalogOfferingQuestion = (message: string) =>
  /\b(hacen|ofrecen|tienen|cuanto cuesta|precio|costo|cuanto demora|cuanto dura|duracion|incluye|en que consiste)\b/.test(normalize(message));

const hasBookingIntent = (message: string) =>
  /\b(reserv|agend|cita|turno|horario|disponib|quiero reservar|agendame|separar)\w*/.test(normalize(message));

const hasServiceRequest = (message: string) =>
  /\b(quiero que revisen|quiero revisar|necesito revisar|necesito que revisen|quiero que vean|necesito solucionar|revisen mi|revisar mi|evaluar mi|evaluacion para|revision para|quiero un|quiero una|necesito un|necesito una|limpiar|escanear|pasarle scanner)\b/.test(normalize(message));

const hasSocialSignal = (message: string) =>
  /^(h+o+l+a+|buenas+|h+i+|hello+|hey+|que tal|como estas|como vas)\b/.test(normalize(message))
  || /\b(eres peruana|eres americana|quien eres|como te llamas|por que respondiste en ingles|idioma)\b/.test(normalize(message));

export const classifyHermesSemanticTurn = async (input: {
  message: string;
  context?: HermesReadOnlyContext;
}): Promise<HermesSemanticTurn> => {
  const message = String(input.message || '').trim();
  const text = normalize(message);

  if (!message) return { intent: 'social_conversation', confidence: 'low', reasonCode: 'EMPTY_MESSAGE' };
  if (hasSocialSignal(message)) return { intent: 'social_conversation', confidence: 'high', reasonCode: 'SOCIAL_SIGNAL' };

  if (/\baguja.*temperatura|temperatura.*sube|temperatura.*eleva|recalienta|sobrecalienta\b/.test(text)) {
    return { intent: 'automotive_symptom', confidence: 'high', automotiveTopic: text, reasonCode: 'EXPLICIT_AUTOMOTIVE_SYMPTOM' };
  }
  const domain = await resolveHermesDomain({ message, context: input.context });

  if (domain.domain === 'clearly_external') return { intent: 'off_domain', confidence: 'high', reasonCode: `EXTERNAL_${domain.externalCategory || 'other'}` };
  if (hasBookingIntent(message)) return { intent: 'booking_intent', confidence: 'high', reasonCode: 'BOOKING_TERMS' };
  if (hasCatalogGeneralRequest(message)) return { intent: 'catalog_general', confidence: 'high', reasonCode: 'CATALOG_GENERAL_TERMS' };

  const automotive = domain.domain === 'automotive' || (await hasAutomotiveDomainSignal(message, input.context));
  if (activeProcess(input.context) && automotive && hasTechnicalQuestion(message)) {
    return { intent: 'active_process_question', confidence: 'high', automotiveTopic: text, reasonCode: 'ACTIVE_PROCESS_AUTOMOTIVE_QUESTION' };
  }
  if (automotive && hasServiceRequest(message)) {
    return { intent: 'service_request', confidence: 'high', automotiveTopic: text, reasonCode: 'AUTOMOTIVE_SERVICE_REQUEST' };
  }
  if (automotive && hasTechnicalQuestion(message)) {
    return { intent: 'automotive_qa', confidence: 'high', automotiveTopic: text, reasonCode: 'AUTOMOTIVE_TECHNICAL_QUESTION' };
  }
  if (automotive && hasSymptomSignal(message)) {
    return { intent: 'automotive_symptom', confidence: 'high', automotiveTopic: text, reasonCode: 'AUTOMOTIVE_SYMPTOM' };
  }
  if (automotive && hasOpenWorldSymptomShape(message)) {
    return { intent: 'automotive_symptom', confidence: 'medium', automotiveTopic: text, reasonCode: 'OPEN_WORLD_AUTOMOTIVE_SYMPTOM' };
  }
  if (automotive && hasCatalogOfferingQuestion(message)) {
    return { intent: 'catalog_offering_question', confidence: 'medium', automotiveTopic: text, reasonCode: 'AUTOMOTIVE_CATALOG_OFFERING_QUESTION' };
  }
  if (automotive) {
    return { intent: hasServiceRequest(message) ? 'service_request' : 'automotive_symptom', confidence: 'medium', automotiveTopic: text, reasonCode: 'OPEN_WORLD_AUTOMOTIVE_DOMAIN' };
  }
  if (domain.domain === 'uncertain') {
    if (hasOpenWorldServiceShape(message) || hasOpenWorldSymptomShape(message) || hasServiceRequest(message) || hasSymptomSignal(message)) {
      return { intent: 'domain_clarification', confidence: 'high', automotiveTopic: text, reasonCode: 'UNCERTAIN_CLARIFY_IN_AUTOMOTIVE_CONTEXT' };
    }
    return { intent: 'off_domain', confidence: 'low', automotiveTopic: text, reasonCode: 'UNCERTAIN_OUT_OF_DOMAIN' };
  }
  return { intent: 'social_conversation', confidence: 'low', reasonCode: 'NO_DOMAIN_SIGNAL' };
};

export const isAutomotiveSemanticIntent = (intent?: string) =>
  intent === 'automotive_qa'
  || intent === 'automotive_symptom'
  || intent === 'active_process_question'
  || intent === 'service_request';

const automotiveSideAnswersFrom = (message: string) => {
  const text = normalize(message);
  const answers: string[] = [];
  if (/\b(peligroso|grave|riesgo|seguro|puedo manejar|puedo seguir)\b|\?/.test(text) && /\b(peligroso|grave|riesgo|seguro|puedo manejar|puedo seguir)\b/.test(text)) {
    answers.push('Sobre el riesgo: sin revisar el vehiculo no conviene confirmarlo como seguro; si el ruido es fuerte, nuevo o aumenta, mejor no exigirlo y revisarlo pronto.');
  }
  if (/\b(precio|cuesta|costo|vale|tarifa|cobra|cobran)\b/.test(text)) {
    answers.push('Sobre el costo: no tengo un precio confirmado desde aqui; depende de la evaluacion y de lo que se encuentre.');
  }
  if (/\b(cuanto demora|cuanto dura|duracion|demora|dura|tiempo)\b/.test(text)) {
    answers.push('Sobre la duracion: puedo usar el tiempo publicado del servicio si elegimos uno, pero para una falla concreta depende de la revision.');
  }
  return answers;
};

const withAutomotiveSideAnswers = (reply: string, message: string) => {
  const sideAnswers = automotiveSideAnswersFrom(message);
  if (!sideAnswers.length) return reply;
  const answerText = sideAnswers.join(' ');
  const match = reply.match(/^(.*?)([^.?!]*\?)\s*$/s);
  if (!match) return `${reply} ${answerText}`;
  return `${match[1].trim()} ${answerText} ${match[2].trim()}`.replace(/\s+/g, ' ').trim();
};

export const buildAutomotiveGuidanceReply = async (input: {
  message: string;
  context?: HermesReadOnlyContext;
  semantic?: HermesSemanticTurn;
}) => {
  const current = normalize(input.message);
  const conversationState = deriveHermesConversationalState({ context: input.context, userMessage: input.message });
  const delta = buildHermesConversationalDelta({ context: input.context, userMessage: input.message });
  const domain = await resolveHermesDomain({ message: input.message, context: input.context });
  const recent = (input.context?.conversation?.history || [])
    .slice(-4)
    .map((entry) => entry.content)
    .join(' ');
  const text = normalize(`${input.context?.conversation?.memory?.activeTopic || ''} ${recent} ${input.message}`);
  const pendingField = input.context?.process?.awaiting?.nextRecommendedField || input.context?.process?.awaiting?.field;
  const resume = pendingField && !/catalogOfferingId|offering|service_selection/i.test(String(pendingField))
    ? ` Cuando quieras seguimos con la reserva; me falta ${String(pendingField).replace(/_/g, ' ')}.`
    : '';
  const relatedOfferings = domain.catalogMatches
    .map((match) => input.context?.catalog?.find((offering) => offering.id === match.offeringId)?.name)
    .filter(Boolean)
    .slice(0, 2);
  const related = relatedOfferings.length
    ? ` En Turagua podemos evaluarlo mediante ${relatedOfferings.join(' o ')}.`
    : '';
  const finalize = (reply: string) => withAutomotiveSideAnswers(reply, input.message);
  const currentMentionsBrakes = /\bfreno|frenos|pastilla|pastillas|disco|discos|frenar\b/.test(current);
  const currentAsksBrakeWarningSigns = currentMentionsBrakes
    && /\b(como saber|senales|senal|sintomas|fallan|fallando|detectar|identificar)\b/.test(current);
  const currentMentionsMaf = /\bmaf\b/.test(current);
  const currentAsksPreviousSteps = /\b(cuales son los pasos|que pasos|los pasos|cuales pasos)\b/.test(current);
  const currentIsCatalogOrOffering = /\b(undercoating|arenado|servicio|servicios|catalogo|catalogo|opciones|ofrecen|ofreces|tienen|tienes|corresponde)\b/.test(current);

  if (delta.correctedFacts['engine.powerLoss'] === false && hasFact(conversationState, 'symptom.vibration', true)) {
    return finalize(`Perfecto, entonces no es perdida de potencia: el dato clave es la vibracion. Puede venir de soportes, ruedas, suspension, frenos o transmision segun cuando aparece. Vibra en minimo, al acelerar o al frenar?${resume}`);
  }
  if (delta.correctedFacts['clutch.hardPedal'] === false && hasFact(conversationState, 'clutch.slips', true)) {
    return finalize(`Entiendo: no esta duro, mas bien patina cuando aceleras. Eso puede apuntar a desgaste del disco, regulacion o algun problema hidraulico. Patina mas en subida o al exigir el motor?${resume}`);
  }

  if (currentAsksPreviousSteps && /\bmaf|flujo de masa|sensor\b/.test(text)) {
    return finalize(`Primero se escanean codigos OBD. Luego se revisan conector, cableado, filtro de aire y posibles fugas de admision. Despues se comparan las lecturas del MAF con las RPM y la carga del motor. Si esta sucio, puede limpiarse con producto especifico para sensores MAF; si sigue fuera de rango, se evalua reemplazarlo.${resume}`);
  }

  if (currentMentionsBrakes) {
    if (currentAsksBrakeWarningSigns) {
      return finalize(`Algunas senales de falla en frenos son raspado o chillido, vibracion al frenar, pedal esponjoso, mayor distancia de frenado o que el vehiculo se desvie. Cual de esas notas?${resume}`);
    }
    if (/\bfreno fuerte|frenar fuerte|cuando freno fuerte|al frenar fuerte\b/.test(current)) {
      return finalize(`Gracias, entonces el ruido aparece al frenar fuerte. Eso orienta mas a pastillas, discos, caliper o algun juego en suspension. Suena como chillido metalico, raspado continuo o golpe seco?${resume}`);
    }
    return finalize(`Claro. Podemos revisar el sistema de frenos sin asumir un sintoma especifico: pastillas, discos, caliper, pedal, vibracion y distancia de frenado. Notas raspado, chillido, vibracion, pedal esponjoso o mayor distancia para detenerte?${resume}`);
  }

  if (/\bembrague|clutch\b/.test(current)) {
    if (input.semantic?.intent === 'service_request') {
      return finalize(`Claro. Podemos comenzar con una evaluacion para identificar si el problema esta en el embrague, el sistema hidraulico o la transmision. Quieres que coordinemos una cita?${resume}`);
    }
    return finalize(`Claro. Que notas exactamente: esta duro, patina, hace ruido, vibra o cuesta cambiar de marcha? Con ese dato puedo orientarte mejor y decirte que tipo de revision conviene.${resume}`);
  }

  if (currentMentionsMaf || (currentAsksPreviousSteps && /\bmaf\b/.test(text))) {
    return finalize(`El MAF es el sensor de flujo de masa de aire. Algunas senales de problema son perdida de potencia, ralenti inestable, tirones, mayor consumo o check engine. Esos sintomas tambien pueden venir de otras causas, asi que conviene revisar codigos OBD, cableado, fugas de admision y lecturas del sensor antes de cambiar piezas. Has notado alguno de esos sintomas?${resume}`);
  }

  if (currentIsCatalogOrOffering && domain.catalogMatches.length) {
    const offeringName = relatedOfferings[0] || 'ese servicio';
    return finalize(`Si, ${offeringName} esta dentro de los servicios que puedo ubicar en el catalogo. Si quieres reservarlo, te ayudo a coordinar una evaluacion.${resume}`);
  }

  if (/\b(afinamiento|afinacion)\b/.test(current)) {
    return finalize(`Claro. Un afinamiento electronico normalmente implica diagnostico por scanner y revision de encendido, inyeccion y rendimiento.${related || ' Podemos evaluarlo con una revision tecnica del motor.'} Buscas un afinamiento general o tu vehiculo presenta alguna falla especifica?${resume}`);
  }

  if (/\b(inyector|inyectores|inyeccion|bobina|bobinas|bujia|bujias|encendido|cuerpo de aceleracion|egr|catalizador|computadora|scanner|escanear|obd|check)\b/.test(current)) {
    return finalize(`Claro. Eso se revisa con diagnostico electronico y una inspeccion de componentes relacionados con encendido, inyeccion y rendimiento.${related || ' Segun el sintoma, podria empezar por diagnostico general o motor y rendimiento.'} El vehiculo tiene perdida de potencia, jaloneos, consumo alto o alguna luz encendida?${resume}`);
  }

  if (conversationState.currentTopic === 'air_conditioning') {
    const coolingConfirmed = hasFact(conversationState, 'air_conditioning.cooling', true);
    const coolingFailed = hasFact(conversationState, 'air_conditioning.cooling', false);
    const compressorNoise = hasFact(conversationState, 'air_conditioning.noiseSource', 'compressor');
    const highHeat = hasFact(conversationState, 'condition.highAmbientTemperature', true);
    const noiseOnActivation = hasFact(conversationState, 'air_conditioning.noiseOnActivation', true);
    if (/\bno deja de enfriar\b/.test(current)) {
      return finalize(`Perfecto, entonces no esta perdiendo frio; el foco sigue siendo el ruido del compresor. Eso ayuda a separar el problema de una falta de enfriamiento. El sonido es chillido, zumbido o golpe?${resume}`);
    }
    if (coolingConfirmed && compressorNoise) {
      const condition = highHeat ? ', sobre todo cuando hace mucho calor' : '';
      const nextQuestion = noiseOnActivation
        ? 'El ruido cambia si subes las revoluciones o al apagar el aire?'
        : 'El ruido aparece solo cuando activas el aire y desaparece al apagarlo?';
      return finalize(`Entiendo: si enfria, pero el compresor hace ruido${condition}. Eso puede relacionarse con el embrague o rodamiento del compresor, presion de trabajo elevada o desgaste interno. No conviene asumir que solo falta gas. ${nextQuestion}${resume}`);
    }
    if (coolingFailed) {
      return finalize(`Entiendo: ahora el dato cambio, dejo de enfriar al menos por momentos. Ahi conviene revisar presiones, fugas, funcionamiento del compresor, ventilador y parte electrica antes de cargar gas. Ocurre en trafico, en carretera o despues de un rato encendido?${resume}`);
    }
    if (hasFact(conversationState, 'symptom.noise')) {
      return finalize(`Entiendo, el punto principal es el ruido del aire acondicionado. Para orientarte mejor: el sonido aparece apenas prendes el aire, cambia con la velocidad del motor o continua despues de apagarlo?${resume}`);
    }
  }

  if (/\bhumo blanco|humo\b/.test(text)) {
    return finalize(`El humo puede tener varias causas segun color, olor y momento en que aparece. Si es blanco constante conviene revisar refrigerante, temperatura y posibles fugas; si aparece solo al arrancar puede ser otra condicion. Lo prudente es diagnosticar antes de cambiar piezas. Desde cuando lo notas?${resume}`);
  }

  if (/\bvibra|vibracion|tiembla\b/.test(text)) {
    return finalize(`Una vibracion puede venir de llantas, soportes, frenos, suspension, motor o transmision segun cuando aparece. Dime si vibra al acelerar, al frenar, en minimo o a cierta velocidad y te oriento mejor.${resume}`);
  }

  if (/\baire acondicionado|no enfria\b/.test(text)) {
    return finalize(`Si el aire acondicionado no enfria, puede ser bajo gas, fuga, compresor, relay, ventilador o filtro obstruido. Conviene revisar presiones y funcionamiento electrico antes de cargar gas a ciegas. En que momento deja de enfriar?${resume}`);
  }

  if (hasOpenWorldSymptomShape(input.message)) {
    return finalize(`Entiendo. Ese comportamiento puede venir de encendido, inyeccion, sensores, admision o rendimiento del motor, segun cuando aparece.${related} Pasa al acelerar, en subida, en minimo o despues de calentar?${resume}`);
  }

  if (/\baguja.*temperatura|temperatura.*sube|temperatura.*eleva|recalienta|sobrecalienta\b/.test(text)) {
    return finalize(`El problema de temperatura puede deberse a falla en el ventilador, falta de refrigerante, termostato o problema en la bomba de agua y radiador. Para orientarte mejor, la temperatura sube mas cuando estas parado en trafico o al acelerar a velocidad?${resume}`);
  }

  if (domain.domain === 'uncertain' || input.semantic?.confidence === 'low') {
    return finalize(`Entiendo que buscas revisar algo del vehiculo. Podrias contarme que comportamiento o falla presenta para orientarte mejor?${resume}`);
  }

  const concept = domain.automotiveConcepts[0];
  return concept
    ? finalize(`Claro. Podemos orientar la revision de ${concept} sin asumir una causa unica.${related} Cuentame que sintoma notas o que trabajo quieres realizar exactamente.${resume}`)
    : finalize(`Entiendo. Puede haber varias causas y conviene revisar sintomas, codigos o una inspeccion antes de afirmar una falla. Cuentame que notas exactamente: ruido, vibracion, perdida de potencia, humo, luz de tablero o dificultad al manejar?${resume}`);
};

export const buildExternalDomainReply = async (input: {
  message: string;
  context?: HermesReadOnlyContext;
}) => {
  const domain = await resolveHermesDomain(input);
  if (domain.externalCategory === 'food') {
    return 'No ofrecemos comida. Somos un taller automotriz; puedo ayudarte con dudas, revisiones y reservas para tu vehiculo.';
  }
  if (domain.externalCategory === 'schoolwork') {
    return 'No puedo realizar tareas escolares desde este canal. Iris atiende consultas automotrices, servicios y reservas del taller.';
  }
  if (domain.externalCategory === 'travel') {
    return 'No gestionamos viajes ni pasajes. Soy Iris y puedo ayudarte con consultas automotrices, revisiones y reservas del taller.';
  }
  if (domain.externalCategory === 'retail') {
    return 'No vendemos ese tipo de producto por este canal. Puedo ayudarte con servicios automotrices, revisiones y reservas para tu vehiculo.';
  }
  if (domain.externalCategory === 'health' || domain.externalCategory === 'finance') {
    return 'No atiendo ese tipo de consulta por este canal. Iris esta enfocada en orientacion automotriz, servicios y reservas del taller.';
  }
  return 'No puedo ayudarte con esa solicitud desde este canal. Puedo orientarte sobre servicios automotrices, dudas tecnicas generales y reservas.';
};
