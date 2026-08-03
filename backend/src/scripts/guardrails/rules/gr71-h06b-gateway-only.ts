import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr71H06BGatewayOnly: GuardrailRule = {
  id: 'GR-71',
  name: 'H06B uses agentCapabilityGateway only',
  run: (context) => {
    const file = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const violations = [];
    if (!file?.content.includes("from '../../capabilities/agentCapabilityGateway'")) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-71 violation: H06B must execute through agentCapabilityGateway.'));
    }
    if (/@temporalio\/|temporalMcpClient|vtkallTemporalMcpServer/.test(file?.content || '')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-71 violation: H06B bridge cannot call Temporal primitives directly.'));
    }
    return result('GR-71', 'H06B uses agentCapabilityGateway only', 'Hermes scheduling bridge delegates execution through the existing backend gateway.', violations);
  },
};
