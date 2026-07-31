import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { getHermesQaCanaryConfig } from './hermesQaCanary.service';

export type HermesQaRejectionReason =
  | 'EMPTY_REPLY'
  | 'TOO_LONG'
  | 'UNAUTHORIZED_ACTION_CLAIM'
  | 'FALSE_AVAILABILITY'
  | 'INTERNAL_LEAKAGE'
  | 'FILESYSTEM_PATH_LEAKAGE'
  | 'PROMPT_DISCLOSURE'
  | 'RAW_ID_LEAKAGE'
  | 'SECRET_LEAKAGE'
  | 'UNSUPPORTED_PRICE'
  | 'MALFORMED_JSON_VISIBLE'
  | 'PROVIDER_BOILERPLATE';

export interface HermesQaValidationResult {
  accepted: boolean;
  rejectionReasons: HermesQaRejectionReason[];
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const validateHermesQaVisibleReply = ({
  reply,
  context,
}: {
  reply: unknown;
  context?: HermesReadOnlyContext;
}): HermesQaValidationResult => {
  const config = getHermesQaCanaryConfig();
  const text = typeof reply === 'string' ? reply.trim() : '';
  const normalized = normalize(text);
  const reasons: HermesQaRejectionReason[] = [];
  const contextText = normalize(JSON.stringify(context || {}));
  const hasNotPublishedPrice = /\bnot_published\b/.test(contextText);

  if (!text) reasons.push('EMPTY_REPLY');
  if (text.length > config.maxReplyChars) reasons.push('TOO_LONG');
  if (/\b(tu cita quedo confirmada|ya reserve|el horario es tuyo|registre tus datos|actualice tu informacion|cree tu caso|cancele la cita|reprograme la reserva|la reserva fue completada)\b/.test(normalized)) reasons.push('UNAUTHORIZED_ACTION_CLAIM');
  if (/\b(hay disponibilidad|esta disponible|tengo disponibilidad|puedes venir manana|horario disponible|esta libre)\b/.test(normalized)) reasons.push('FALSE_AVAILABILITY');
  if (/\b(backendaccess|toolresults|agentdecision|waiting_for_customer_data|mongoose|mongodb|temporal workflow|taskqueue|runid)\b/.test(normalized)) reasons.push('INTERNAL_LEAKAGE');
  if (/\b[a-z]:\\|\/etc\/|\/root\/|\.env\b/i.test(text)) reasons.push('FILESYSTEM_PATH_LEAKAGE');
  if (/\b(agents\.md|soul\.md|skill\.md|system prompt|instrucciones internas|prompt del sistema)\b/i.test(text)) reasons.push('PROMPT_DISCLOSURE');
  if (/\b(offeringid|customerid|caseid|managedentityid|conversationid|workflowid|ci_[0-9a-f-]{8,})\b/i.test(text)) reasons.push('RAW_ID_LEAKAGE');
  if (/\b(api[_-]?key|mongo_uri|password|secret|token)\b/i.test(text)) reasons.push('SECRET_LEAKAGE');
  if (hasNotPublishedPrice && /\b(s\/|pen\s*\d|\d+\s*soles|\$\s*\d|precio estimado)\b/i.test(text)) reasons.push('UNSUPPORTED_PRICE');
  if (/^\s*[{[]/.test(text)) reasons.push('MALFORMED_JSON_VISIBLE');
  if (/\b(as an ai language model|como modelo de lenguaje|no tengo acceso a informacion en tiempo real)\b/i.test(text)) reasons.push('PROVIDER_BOILERPLATE');

  return {
    accepted: reasons.length === 0,
    rejectionReasons: reasons,
  };
};

