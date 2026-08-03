import { HermesSkillId } from '../contracts/hermesTurnAssessment.contract';
import { HermesAgentId } from '../contracts/hermesTriage.contract';

export type HermesAgentManifest = {
  id: HermesAgentId;
  skill: HermesSkillId;
  supportedIntents: string[];
  requiredContext: string[];
  allowedActions: string[];
  prohibitedActions: string[];
  resultType: 'conversation' | 'catalog' | 'scheduling' | 'recovery';
};

const AGENT_REGISTRY: HermesAgentManifest[] = [
  {
    id: 'conversation-agent',
    skill: 'customer-conversation',
    supportedIntents: ['conversation', 'greeting', 'agent_identity', 'general_faq', 'business_information'],
    requiredContext: ['businessContext'],
    allowedActions: [],
    prohibitedActions: ['create_appointment', 'create_resource_reservation', 'execute_temporal'],
    resultType: 'conversation',
  },
  {
    id: 'catalog-agent',
    skill: 'catalog-advisor',
    supportedIntents: ['catalog_list', 'catalog_detail', 'catalog_compare', 'price', 'duration', 'compatibility'],
    requiredContext: ['businessContext', 'catalogContext'],
    allowedActions: [],
    prohibitedActions: ['invent_price', 'assert_availability', 'create_resource_reservation'],
    resultType: 'catalog',
  },
  {
    id: 'scheduling-agent',
    skill: 'scheduling-companion',
    supportedIntents: ['start_booking', 'request_availability', 'provide_customer_data', 'select_offering', 'select_slot', 'side_question', 'ambiguous'],
    requiredContext: ['businessContext', 'catalogContext', 'customerContext', 'processContext'],
    allowedActions: ['propose_schedule_consultation_action'],
    prohibitedActions: ['create_appointment', 'create_resource_reservation', 'direct_persistence'],
    resultType: 'scheduling',
  },
  {
    id: 'recovery-agent',
    skill: 'recovery-escalation',
    supportedIntents: ['fallback', 'security_risk', 'conversation'],
    requiredContext: ['businessContext', 'processContext'],
    allowedActions: [],
    prohibitedActions: ['repeat_authoritative_action', 'legacy_post_commit'],
    resultType: 'recovery',
  },
];

export const getHermesAgentRegistry = () => [...AGENT_REGISTRY];

export const resolveHermesAgentManifest = (agentId: HermesAgentId) =>
  AGENT_REGISTRY.find((manifest) => manifest.id === agentId);
