import { GuardrailRule, result } from '../ruleTypes';
import { importViolations, violation } from './shared';

export const gr96H06GNoNewBusinessCapabilities: GuardrailRule = {
  id: 'GR-96',
  name: 'H06G does not introduce new business capabilities',
  run: (context) => {
    const orchestrator = context.getFile('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts');
    const report = context.getFile('backend/docs/reviews/HERMES_06G_CONVERSATIONAL_CONSOLIDATION_REPORT.md');
    const violations = [
      ...(orchestrator ? importViolations(
        orchestrator,
        (specifier) => /notification|cancel|resched|reschedule/i.test(specifier),
        (specifier) => `GR-96 violation: H06G orchestrator must not introduce new business capability import ${specifier}.`
      ) : []),
    ];

    if (!report?.content.includes('No cancellation, rescheduling, notifications, attachments workflow, or new business capabilities were added in this phase.')) {
      violations.push(violation('backend/docs/reviews/HERMES_06G_CONVERSATIONAL_CONSOLIDATION_REPORT.md', 'GR-96 violation: H06G report must explicitly state that no new business capabilities were added.'));
    }

    return result('GR-96', 'H06G does not introduce new business capabilities', 'H06G stays within conversational consolidation scope.', violations);
  },
};
