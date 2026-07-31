import { HermesSubAgentInput, HermesSubAgentResult } from '../contracts/hermesSubAgent.contract';

export const runCatalogAgent = async (input: HermesSubAgentInput): Promise<HermesSubAgentResult> => ({
  agent: 'catalog-agent',
  outcome: 'respond',
  replyDraft: 'Hermes puede responder usando solo el contexto de catalogo autorizado.',
  knownFacts: input.knownFacts,
  pendingFacts: [],
  requiresAuthoritativeExecution: false,
  customerFacingFacts: Object.keys(input.knownFacts).filter((key) => /offering|requested/i.test(key)),
  prohibitedClaims: ['invented_price', 'availability_confirmation', 'reservation_creation'],
});
