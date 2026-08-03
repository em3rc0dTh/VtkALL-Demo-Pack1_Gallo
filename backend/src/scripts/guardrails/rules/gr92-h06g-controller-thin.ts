import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

const bannedSnippets = [
  'runHermesQaPrimaryTurn',
  'runAgentRuntime',
  'resolveHermesVisibleRuntime',
  'runHermesSchedulingBridgeTurn',
  'observeHermesReceptionDeskTurn',
  'dispatchHermesSkillPlan',
  'runHermesResponseCandidateSynthesis',
];

export const gr92H06GControllerThin: GuardrailRule = {
  id: 'GR-92',
  name: 'H06G controllers stay thin',
  run: (context) => {
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    const violations = [];

    for (const snippet of bannedSnippets) {
      if (controller?.content.includes(snippet)) {
        violations.push(violation('backend/src/controllers/agentSim.controller.ts', `GR-92 violation: controller must not coordinate ${snippet} directly.`));
      }
    }

    return result('GR-92', 'H06G controllers stay thin', 'The controller validates and delegates instead of coordinating Hermes internals.', violations);
  },
};
