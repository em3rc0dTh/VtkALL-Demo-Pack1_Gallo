import { CasePublicSummary, HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesQaCategory, HermesQaIneligibleReason } from './hermesQaEligibility.contract';
import { classifyHermesSemanticTurn } from './hermesSemanticTurn.service';

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[!?.,;:()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const operationalCaseStatuses = new Set([
  'lead',
  'new',
  'open',
  'pending',
  'in_progress',
  'waiting_customer',
  'waiting_for_customer_data',
  'waiting_for_slot_selection',
  'pre_order',
]);

export const isOperationalCaseActive = (caseContext?: CasePublicSummary) => {
  if (!caseContext) return false;
  const status = normalize(String(caseContext.status || ''));
  const statusGroup = normalize(String(caseContext.statusGroup || ''));
  if (['closed', 'cancelled', 'completed', 'archived'].includes(status)) return false;
  return operationalCaseStatuses.has(status) || operationalCaseStatuses.has(statusGroup);
};

export const hasSecurityRisk = (message: string) =>
  /\b(ignore|revela|muestra|imprime|dump|bypass|system prompt|agents\.md|soul\.md|\.env|api key|password|mongo_uri|token|secret)\b/i.test(message);

export const hasAttachment = (attachmentIds?: string[]) => Boolean(attachmentIds?.length);

export const hasActiveProcess = (context?: HermesReadOnlyContext) => context?.process?.active === true;

export const classifyTransactionalExclusion = (message: string): HermesQaIneligibleReason | undefined => {
  const text = normalize(message);
  if (/\b(cancela(?:r)?|cancelar|anula(?:r)?|anular|elimina(?:r)? mi cita)\b/.test(text)) return 'CANCELLATION_REQUEST';
  if (/\b(reprograma(?:r)?|reprogramar|cambia(?:r)?.*fecha|mueve(?:r)?.*cita|pasala|pasarla)\b/.test(text)) return 'RESCHEDULE_REQUEST';
  if (/\b(confirma(?:r)?|confirmar|quedo|quedo confirmada|esta listo|esta confirmado)\b/.test(text)) return 'CONFIRMATION_REQUEST';
  if (/\b(mi nombre es|me llamo|mi numero|mi telefono|mi correo|email|dni|documento|cambia mi nombre|actualiza mis datos|registra mis datos)\b/.test(text)) return 'PERSONAL_DATA_WRITE';
  if (/\b(reserv\w*|agenda\w*|cita|turno|consulta para|quiero ese horario|ese horario|la segunda opcion)\b/.test(text)) return 'BOOKING_REQUEST';
  if (/\b(disponib|cupo|horarios?|libre|puedo ir|manana|mañana|viernes|lunes|martes|miercoles|jueves|sabado|domingo|a las (tres|cuatro|cinco|seis|7|8|9|10|11|12))\b/.test(text)) return 'AVAILABILITY_REQUEST';
  if (/^(si|ok|dale|ese|esa|ricardo|ana|roberto|\d{7,}|el viernes|a las \w+)$/.test(text)) return 'AMBIGUOUS_MESSAGE';
  return undefined;
};

export const classifyQaCategory = async (message: string, context?: HermesReadOnlyContext): Promise<HermesQaCategory | undefined> => {
  const text = normalize(message);
  const semantic = await classifyHermesSemanticTurn({ message, context });
  if (semantic.intent === 'automotive_qa') return 'automotive_qa';
  if (semantic.intent === 'automotive_symptom') return 'automotive_symptom';
  if (semantic.intent === 'active_process_question') return 'active_process_question';
  if (/^(hola|buenos dias|buenas tardes|buenas noches|hi|hello|hey)\.?$/.test(text)) return 'greeting';
  if (/\b(quien eres|quién eres|como te llamas|cómo te llamas|que puedes hacer|qué puedes hacer|en que puedes ayudar|en qué puedes ayudar)\b/.test(text)) return 'agent_identity';
  if (/\b(a que se dedica|a qué se dedica|horario general|empresa|negocio|donde estan|dónde están|ubicacion|ubicación)\b/.test(text)) return context?.business ? 'business_information' : undefined;
  if (/\b(que servicios|qué servicios|servicios tienen|muestrame.*servicios|mu[eé]strame.*servicios|cuales son las opciones|cuáles son las opciones|opciones tienen)\b/.test(text)) return (context?.catalog?.length || 0) > 0 ? 'catalog_list' : undefined;
  if (/\b(cuanto dura|cuánto dura|duracion|duración|incluye|precio publicado|cuesta|costo|vale|consulta basica|consulta básica|servicio)\b/.test(text)) return (context?.catalog?.length || 0) > 0 ? 'catalog_detail' : undefined;
  if (/\b(diferencia|compar|conviene|mejor opcion|mejor opción|estas dos opciones)\b/.test(text)) return (context?.catalog?.length || 0) > 1 ? 'catalog_comparison' : undefined;
  if (/\b(pregunta frecuente|faq|politica|política|informacion general|información general)\b/.test(text)) return 'general_faq';
  return undefined;
};
