import { AgentRuntimeResult } from '../../runtime/agentDecision';
import { HermesResponseCandidate } from '../contracts/hermesResponseCandidate.contract';
import { HermesReadOnlyContext } from '../context/hermesContext.contract';
import { HermesSkillId } from '../contracts/hermesTurnAssessment.contract';
import { validateHermesQaVisibleReply } from '../routing/hermesQaResponseValidator.service';
import { isInHermesQaCanary, stableCanaryBucket } from '../routing/hermesQaCanary.service';
import { evaluateHermesConversationalCoherence } from './hermesConversationalCoherenceGate.service';

export type HermesVisibleRoute = 'initial' | 'continuation';

export type HermesVisibleArbitrationLane =
  | 'identity_recovery'
  | 'active_process_data'
  | 'active_process_side_question'
  | 'action_or_booking'
  | 'domain_conversation'
  | 'social'
  | 'clarification'
  | 'clearly_external';

export type HermesVisibleRuntimeDecision = {
  runtime: 'hermes' | 'legacy';
  message: string;
  canaryBucket: number;
  selectedSkill?: HermesSkillId;
  naturalizationFallbackUsed: boolean;
  validationResult: {
    accepted: boolean;
    rejectionReasons: string[];
  };
  fallbackMode: 'none' | 'legacy_pre_commit' | 'deterministic_post_commit' | 'legacy_outside_canary' | 'legacy_disabled';
  route: HermesVisibleRoute;
};

export const getHermesVisibleRuntimeConfig = () => {
  const canaryPercent = Number(process.env.HERMES_VISIBLE_RUNTIME_CANARY_PERCENT || '0');
  return {
    enabled: process.env.HERMES_VISIBLE_RUNTIME_ENABLED === 'true',
    canaryPercent: Number.isFinite(canaryPercent) ? Math.max(0, Math.min(100, Math.trunc(canaryPercent))) : 0,
    failOpen: process.env.HERMES_VISIBLE_RUNTIME_FAIL_OPEN !== 'false',
    postCommitLegacyFallback: process.env.HERMES_VISIBLE_RUNTIME_POST_COMMIT_LEGACY_FALLBACK === 'true',
  };
};

const knownSkills = new Set<HermesSkillId>([
  'customer-conversation',
  'catalog-advisor',
  'scheduling-specialist',
  'scheduling-companion',
  'recovery-escalation',
]);

const candidateCanBeVisible = (candidate?: HermesResponseCandidate) =>
  Boolean(candidate)
  && (candidate?.status === 'CANDIDATE_READY' || candidate?.status === 'NEEDS_CLARIFICATION')
  && Boolean(candidate?.candidateText?.trim());

const hasCommittedAction = (result: AgentRuntimeResult) =>
  Array.isArray(result.toolResults)
  && result.toolResults.some((entry) => {
    const payload: any = entry?.result;
    return Boolean(payload) && payload?.skipped !== true;
  });

const normalizeVisibleText = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sanitizeVisibleFieldNames = (value: string) =>
  String(value || '')
    .replace(/\bfirstName\b/g, 'nombre')
    .replace(/\blastName\b/g, 'apellido')
    .replace(/\bmanagedEntityDisplayName\b/g, 'vehiculo')
    .replace(/\bmanagedEntityDescription\b/g, 'vehiculo')
    .replace(/\bpreferredDate\b/g, 'fecha')
    .replace(/\bselectedSlotId\b/g, 'horario')
    .trim();

const isExternalRejectionReply = (message?: string) => {
  const normalized = normalizeVisibleText(message);
  return normalized.includes('no puedo ayudarte con esa solicitud desde este canal')
    || normalized.includes('no puedo ayudarte con eso desde este canal')
    || (normalized.includes('no puedo ayudarte') && normalized.includes('canal'))
    || (normalized.includes('no puedo ayudarte') && normalized.includes('solicitud'))
    || (normalized.includes('no puedo ayudarte') && normalized.includes('alcance'))
    || normalized.includes('esta solicitud queda fuera del alcance')
    || normalized.includes('fuera del alcance de este canal')
    || normalized.includes('queda fuera de mi alcance')
    || normalized.includes('solo puedo ayudarte con temas');
};

const canPublishExternalRejection = (lane?: HermesVisibleArbitrationLane) =>
  lane === 'clearly_external';

const defaultLanePreservingFallback = (lane?: HermesVisibleArbitrationLane) => {
  if (lane === 'social') return 'Aqui estoy contigo. En que te ayudo?';
  if (lane === 'identity_recovery') return 'Gracias. Estoy revisando tus datos para continuar desde donde quedamos.';
  if (lane === 'active_process_side_question') return 'Claro. Te respondo y mantenemos pendiente el dato que falta para continuar.';
  if (lane === 'active_process_data') return 'Gracias, ya registre ese dato. Seguimos con la reserva.';
  if (lane === 'action_or_booking') return 'Entiendo. Ya inicie la coordinacion para revisar lo que comentas y seguimos con el siguiente dato.';
  if (lane === 'domain_conversation') return 'Entiendo lo que comentas. Sin una evaluacion no voy a diagnosticar una causa, pero puedo ayudarte a coordinar una revision.';
  if (lane === 'clarification') return 'Te sigo. Necesito un dato mas para ayudarte bien.';
  return 'Te leo. Dame un momento para responderte bien.';
};

export const resolveHermesVisibleRuntime = async (input: {
  businessSlug: string;
  conversationId: string;
  route: HermesVisibleRoute;
  runtimeResult: AgentRuntimeResult;
  visibleFallbackMessage?: string;
  committedFallbackMessage?: string;
  arbitrationLane?: HermesVisibleArbitrationLane;
  context?: HermesReadOnlyContext;
  candidate?: HermesResponseCandidate;
  selectedSkill?: HermesSkillId;
  userMessage?: string;
}): Promise<HermesVisibleRuntimeDecision> => {
  const config = getHermesVisibleRuntimeConfig();
  const canaryBucket = stableCanaryBucket(input.businessSlug, input.conversationId);
  const fallbackMessage = String(input.visibleFallbackMessage || input.runtimeResult.message || '').trim() || 'Estoy revisando tu solicitud.';
  const selectedSkill = input.selectedSkill;
  const committed = hasCommittedAction(input.runtimeResult);
  const committedFallbackMessage = String(input.committedFallbackMessage || '').trim();
  const externalRejectionAllowed = canPublishExternalRejection(input.arbitrationLane);
  const fallbackExternalConflict = !externalRejectionAllowed && isExternalRejectionReply(fallbackMessage);
  const candidateExternalConflict = !externalRejectionAllowed && isExternalRejectionReply(input.candidate?.candidateText);
  const safeFallbackMessage = fallbackExternalConflict
    ? committedFallbackMessage || defaultLanePreservingFallback(input.arbitrationLane)
    : committed && committedFallbackMessage
      ? committedFallbackMessage
      : fallbackMessage;
  const safeVisibleFallbackMessage = sanitizeVisibleFieldNames(safeFallbackMessage);

  if (!config.enabled) {
    return {
      runtime: 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: false,
      validationResult: { accepted: false, rejectionReasons: ['FEATURE_DISABLED'] },
      fallbackMode: 'legacy_disabled',
      route: input.route,
    };
  }

  if (!isInHermesQaCanary(input.businessSlug, input.conversationId, config.canaryPercent)) {
    return {
      runtime: 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: false,
      validationResult: { accepted: false, rejectionReasons: ['NOT_IN_CANARY'] },
      fallbackMode: 'legacy_outside_canary',
      route: input.route,
    };
  }

  if (!selectedSkill || !knownSkills.has(selectedSkill)) {
    return {
      runtime: committed && !config.postCommitLegacyFallback ? 'hermes' : 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: committed && !config.postCommitLegacyFallback,
      validationResult: { accepted: false, rejectionReasons: ['UNKNOWN_SKILL'] },
      fallbackMode: committed && !config.postCommitLegacyFallback ? 'deterministic_post_commit' : 'legacy_pre_commit',
      route: input.route,
    };
  }

  if (!candidateCanBeVisible(input.candidate)) {
    return {
      runtime: committed && !config.postCommitLegacyFallback ? 'hermes' : 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: committed && !config.postCommitLegacyFallback,
      validationResult: { accepted: false, rejectionReasons: ['CANDIDATE_NOT_VISIBLE'] },
      fallbackMode: committed && !config.postCommitLegacyFallback ? 'deterministic_post_commit' : 'legacy_pre_commit',
      route: input.route,
    };
  }

  const validation = validateHermesQaVisibleReply({
    reply: input.candidate?.candidateText,
    context: input.context,
  });
  if (!validation.accepted || candidateExternalConflict) {
    return {
      runtime: committed && !config.postCommitLegacyFallback ? 'hermes' : 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: committed && !config.postCommitLegacyFallback,
      validationResult: {
        accepted: false,
        rejectionReasons: [
          ...validation.rejectionReasons,
          ...(candidateExternalConflict ? ['EXTERNAL_REJECTION_INCOMPATIBLE_WITH_ARBITRATION'] : []),
        ],
      },
      fallbackMode: committed && !config.postCommitLegacyFallback ? 'deterministic_post_commit' : 'legacy_pre_commit',
      route: input.route,
    };
  }

  const coherence = await evaluateHermesConversationalCoherence({
    userMessage: input.userMessage,
    reply: String(input.candidate?.candidateText || ''),
    context: input.context,
    candidate: input.candidate,
  });
  if (!coherence.accepted) {
    const repairedValidation = validateHermesQaVisibleReply({
      reply: coherence.repairedText,
      context: input.context,
    });
    const repairedExternalConflict = !externalRejectionAllowed && isExternalRejectionReply(coherence.repairedText);
    if (coherence.repairedText && repairedValidation.accepted && !repairedExternalConflict) {
      return {
        runtime: 'hermes',
        message: sanitizeVisibleFieldNames(coherence.repairedText),
        canaryBucket,
        selectedSkill,
        naturalizationFallbackUsed: true,
        validationResult: {
          accepted: true,
          rejectionReasons: coherence.rejectionReasons.map((reason) => `REPAIRED_${reason}`),
        },
        fallbackMode: 'deterministic_post_commit',
        route: input.route,
      };
    }
    return {
      runtime: committed && !config.postCommitLegacyFallback ? 'hermes' : 'legacy',
      message: safeVisibleFallbackMessage,
      canaryBucket,
      selectedSkill,
      naturalizationFallbackUsed: committed && !config.postCommitLegacyFallback,
      validationResult: {
        accepted: false,
        rejectionReasons: [
          ...coherence.rejectionReasons,
          ...(repairedExternalConflict ? ['REPAIRED_EXTERNAL_REJECTION_INCOMPATIBLE_WITH_ARBITRATION'] : []),
        ],
      },
      fallbackMode: committed && !config.postCommitLegacyFallback ? 'deterministic_post_commit' : 'legacy_pre_commit',
      route: input.route,
    };
  }

  return {
    runtime: 'hermes',
    message: candidateExternalConflict
      ? safeVisibleFallbackMessage
      : sanitizeVisibleFieldNames(String(input.candidate?.candidateText || '').trim()),
    canaryBucket,
    selectedSkill,
    naturalizationFallbackUsed: false,
    validationResult: { accepted: true, rejectionReasons: [] },
    fallbackMode: 'none',
    route: input.route,
  };
};
