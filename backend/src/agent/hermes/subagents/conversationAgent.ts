import { HermesSubAgentInput, HermesSubAgentResult } from '../contracts/hermesSubAgent.contract';

export const runConversationAgent = async (input: HermesSubAgentInput): Promise<HermesSubAgentResult> => ({
  agent: 'conversation-agent',
  outcome: input.triage.mode === 'clarify' ? 'clarification_required' : 'respond',
  replyDraft: input.triage.mode === 'clarify'
    ? 'Necesito un poco mas de contexto para responderte bien.'
    : 'Hermes mantiene la continuidad conversacional desde el contexto autorizado.',
  knownFacts: input.knownFacts,
  pendingFacts: input.triage.mode === 'clarify' ? input.triage.process?.awaiting ? [input.triage.process.awaiting] : [] : [],
  requiresAuthoritativeExecution: false,
  customerFacingFacts: [],
  prohibitedClaims: ['authoritative_execution', 'booking_confirmation', 'workflow_internals'],
});
