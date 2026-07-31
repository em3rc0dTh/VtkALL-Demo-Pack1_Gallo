import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { contentViolations, isTestOrFixture, violation } from './shared';

export const gr10TimelineOwnership: GuardrailRule = {
  id: 'GR-10',
  name: 'Timeline ownership',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const timelineService = context.getFile('backend/src/services/demoTest/timeline.service.ts');
    if (!timelineService?.content.includes('execution:') || !timelineService.content.includes('correlationId')) {
      violations.push(violation('backend/src/services/demoTest/timeline.service.ts', 'GR-10 violation: TimelineEvent writes must attach execution metadata from ExecutionContext.'));
    }
    if (!timelineService?.content.includes('actorFromContext')) {
      violations.push(violation('backend/src/services/demoTest/timeline.service.ts', 'GR-10 violation: TimelineEvent actor must be derivable from ExecutionContext.'));
    }
    const allowed = new Set(['backend/src/services/demoTest/timeline.service.ts', 'backend/src/services/seed.service.ts']);
    const files = context.files.filter((file) => file.path.startsWith('backend/src/') && !allowed.has(file.path) && !isTestOrFixture(file));
    violations.push(...files.flatMap((file) =>
      contentViolations(file, /TimelineEvent\.(create|insertMany)|new\s+TimelineEvent\s*\(/, 'GR-10 violation: TimelineEvent writes must go through the centralized timeline service.')
    ));
    return result('GR-10', 'Timeline ownership', 'Operational timeline writes are centralized through timeline service and carry execution context.', violations);
  },
};
