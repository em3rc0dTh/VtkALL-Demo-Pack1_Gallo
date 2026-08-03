import { getHermesQaCanaryConfig, isInHermesQaCanary, stableCanaryBucket } from './hermesQaCanary.service';
import {
  classifyQaCategory,
  classifyTransactionalExclusion,
  hasActiveProcess,
  hasAttachment,
  hasSecurityRisk,
  isOperationalCaseActive,
} from './hermesQaEligibility.policy';
import { classifyHermesSemanticTurn } from './hermesSemanticTurn.service';
import { HermesQaEligibilityDecision, HermesQaEligibilityInput, HermesQaIneligibleReason } from './hermesQaEligibility.contract';

const legacy = (reason: HermesQaIneligibleReason, bucket?: number): HermesQaEligibilityDecision => ({
  eligible: false,
  runtime: 'legacy',
  reason,
  confidence: 'not_applicable',
  readOnly: true,
  canaryBucket: bucket,
});

export const evaluateHermesQaEligibility = async (input: HermesQaEligibilityInput): Promise<HermesQaEligibilityDecision> => {
  const config = getHermesQaCanaryConfig();
  const bucket = stableCanaryBucket(input.businessSlug, input.conversationId);
  const semantic = await classifyHermesSemanticTurn({ message: input.message, context: input.context });

  if (!config.enabled) return legacy('FEATURE_DISABLED', bucket);
  if (!isInHermesQaCanary(input.businessSlug, input.conversationId, config.percent)) return legacy('NOT_IN_CANARY', bucket);
  if (hasSecurityRisk(input.message)) return legacy('SECURITY_RISK', bucket);
  if (hasAttachment(input.attachmentIds)) return legacy('ATTACHMENT_PRESENT', bucket);
  if (
    config.requireNoActiveProcess
    && hasActiveProcess(input.context)
    && semantic.intent !== 'active_process_question'
  ) return legacy('ACTIVE_PROCESS', bucket);
  if (isOperationalCaseActive(input.context?.case)) return legacy('ACTIVE_OPERATIONAL_CASE', bucket);

  const exclusion = classifyTransactionalExclusion(input.message);
  if (exclusion) return legacy(exclusion, bucket);

  const category = await classifyQaCategory(input.message, input.context);
  if (!category) {
    return legacy(input.context ? 'UNSUPPORTED_CATEGORY' : 'INSUFFICIENT_CONTEXT', bucket);
  }

  return {
    eligible: true,
    runtime: 'hermes',
    category,
    reason: `ALLOWLIST_${category.toUpperCase()}` as HermesQaEligibilityDecision['reason'],
    confidence: 'high',
    readOnly: true,
    canaryBucket: bucket,
  };
};
