import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { contentViolations, violation } from './shared';

export const gr14ConfigHygiene: GuardrailRule = {
  id: 'GR-14',
  name: 'Configuration hygiene',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const envExample = context.getFile('backend/.env.example');
    if (!envExample?.content.includes('TEMPORAL_ADDRESS=localhost:7233')) {
      violations.push(violation('backend/.env.example', 'GR-14 violation: TEMPORAL_ADDRESS example must use host:port.'));
    }
    const config = context.getFile('backend/src/config/env.ts');
    if (!config?.content.includes('validateTemporalAddress')) {
      violations.push(violation('backend/src/config/env.ts', 'GR-14 violation: TEMPORAL_ADDRESS must be startup-validated.'));
    }
    const app = context.getFile('backend/src/app.ts');
    if (!app?.content.includes('executionContextMiddleware') || !app.content.includes('demoTestErrorMiddleware')) {
      violations.push(violation('backend/src/app.ts', 'GR-14 violation: /api/demo-test must mount execution-context and semantic-error middleware.'));
    }
    const activities = context.getFile('backend/src/temporal/activities/scheduleConsultation.activities.ts');
    if (!activities?.content.includes('activityInfo') || !activities.content.includes("channel: 'temporal'")) {
      violations.push(violation('backend/src/temporal/activities/scheduleConsultation.activities.ts', 'GR-14 violation: Temporal activities must propagate ExecutionContext metadata.'));
    }
    const genericFiles = context.files.filter((file) =>
      file.path.startsWith('backend/src/services/demoTest/') ||
      file.path.startsWith('backend/src/temporal/')
    );
    violations.push(...genericFiles.flatMap((file) =>
      contentViolations(file, /WORKFLOW_API_BASE_URL/, 'GR-14 violation: active demoTest code must not require WORKFLOW_API_BASE_URL.')
    ));
    return result('GR-14', 'Configuration hygiene', 'Temporal config is host:port, demoTest context middleware is active, and source avoids legacy workflow API config.', violations);
  },
};
