import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr83H06BReconciliation: GuardrailRule = {
  id: 'GR-83',
  name: 'Ambiguous execution requires reconciliation',
  run: (context) => {
    const bridge = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts');
    const reconcile = context.getFile('backend/src/agent/hermes/scheduling/hermesSchedulingReconciliation.service.ts');
    const violations = [];
    if (!bridge?.content.includes('reconcileHermesSchedulingExecution')) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts', 'GR-83 violation: bridge must invoke reconciliation on ambiguous dispatch errors.'));
    }
    if (!reconcile?.content.includes("outcome: 'EXECUTION_UNKNOWN'")) {
      violations.push(violation('backend/src/agent/hermes/scheduling/hermesSchedulingReconciliation.service.ts', 'GR-83 violation: reconciliation must be able to report EXECUTION_UNKNOWN.'));
    }
    return result('GR-83', 'Ambiguous execution requires reconciliation', 'Transport ambiguity is reconciled instead of replayed blindly.', violations);
  },
};
