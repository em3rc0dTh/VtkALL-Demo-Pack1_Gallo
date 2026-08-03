import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr72H06BNoAuthoritativeWorkflowId: GuardrailRule = {
  id: 'GR-72',
  name: 'Hermes cannot provide authoritative workflowId',
  run: (context) => {
    const policy = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts');
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!policy?.content.includes('workflowId cannot be authoritative')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts', 'GR-72 violation: workflow authority must be rejected when not backend-resolved.'));
    }
    if (!bridge?.content.includes('sanitizeProposalWorkflowAuthority')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-72 violation: bridge must sanitize workflow authority before execution.'));
    }
    return result('GR-72', 'Hermes cannot provide authoritative workflowId', 'Workflow ownership stays in backend resolution, not in Hermes proposals.', violations);
  },
};
