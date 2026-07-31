import { HermesSubAgentInput, HermesSubAgentResult } from '../contracts/hermesSubAgent.contract';
import { HermesSkillResult } from '../contracts/hermesSkillRegistry.contract';

export const runSchedulingAgent = async (input: HermesSubAgentInput & {
  specialistResult?: HermesSkillResult;
}): Promise<HermesSubAgentResult> => {
  const status = input.specialistResult?.status;
  const outcome = status === 'ACTION_PROPOSAL'
    ? 'action_proposed'
    : status === 'NEEDS_INPUT'
      ? 'clarification_required'
      : status === 'FAILED' || status === 'TIMED_OUT'
        ? 'recovered'
        : 'respond';

  return {
    agent: 'scheduling-agent',
    outcome,
    replyDraft: input.specialistResult?.summary || 'Hermes mantiene el proceso de agendamiento en el flujo autorizado.',
    proposedActions: input.specialistResult?.proposedAction
      ? [{ type: input.specialistResult.proposedAction, payload: {} }]
      : [],
    knownFacts: input.knownFacts,
    pendingFacts: input.triage.process?.awaiting ? [input.triage.process.awaiting] : [],
    requiresAuthoritativeExecution: outcome === 'action_proposed',
    customerFacingFacts: Object.keys(input.knownFacts).filter((key) => /offering|requested|slot|firstName/i.test(key)),
    prohibitedClaims: ['authoritative_booking_confirmation', 'direct_temporal_execution', 'direct_persistence'],
  };
};
