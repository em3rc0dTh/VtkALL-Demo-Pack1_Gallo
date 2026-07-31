import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { violation } from './shared';

const caseReachableModels = ['Appointment', 'CustomerInteraction', 'DecisionRecord', 'Notification', 'TimelineEvent', 'Attachment'];

export const gr09CaseCentered: GuardrailRule = {
  id: 'GR-09',
  name: 'Case-centered architecture',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    for (const model of caseReachableModels) {
      const file = context.getFile(`backend/src/models/${model}.model.ts`);
      if (file && !file.content.includes('caseId')) {
        violations.push(violation(file.path, `GR-09 violation: ${model} must be reachable through Case via caseId when present.`));
      }
    }
    const appointment = context.getFile('backend/src/models/Appointment.model.ts');
    if (appointment?.content.includes('caseId') === false) {
      violations.push(violation(appointment.path, 'GR-09 violation: Appointment must not become the operational root; it must reference caseId.'));
    }
    return result('GR-09', 'Case-centered architecture', 'Operational entities remain rooted in or reachable from Case.', violations);
  },
};
