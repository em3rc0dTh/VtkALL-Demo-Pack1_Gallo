import { GuardrailRule, result } from '../ruleTypes';

export const gr19AgentProcessContinuity: GuardrailRule = {
  id: 'GR-19',
  name: 'Active Agent process continuity',
  run: (context) => {
    const violations = [];
    const controller = context.getFile('backend/src/controllers/agentSim.controller.ts');
    if (!controller?.content.includes('resolveActiveWorkflowForConversation')) {
      violations.push({
        file: 'backend/src/controllers/agentSim.controller.ts',
        message: 'GR-19 violation: Agent open-message path must resolve active workflow by conversationId before runtime reasoning.',
      });
    }
    if (!controller?.content.includes('workflowId: activeWorkflowId')) {
      violations.push({
        file: 'backend/src/controllers/agentSim.controller.ts',
        message: 'GR-19 violation: Resolved workflowId must be passed into runAgentRuntime.',
      });
    }

    const runtime = context.getFile('backend/src/agent/runtime/agentRuntime.ts');
    if (!runtime?.content.includes('activeProcessFound')) {
      violations.push({
        file: 'backend/src/agent/runtime/agentRuntime.ts',
        message: 'GR-19 violation: Agent Runtime should log active process resolution for continuity diagnostics.',
      });
    }

    return result(
      'GR-19',
      'Active Agent process continuity',
      'Agent turns resolve active Temporal process by conversationId before generic reasoning.',
      violations
    );
  },
};
