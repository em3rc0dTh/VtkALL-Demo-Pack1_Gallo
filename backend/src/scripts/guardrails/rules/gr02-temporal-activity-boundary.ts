import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations, importViolations, violation } from './shared';
import { importsOf } from '../importScanner';

const allowedCurrentModelReads: Record<string, string[]> = {
  'backend/src/temporal/activities/scheduleConsultation.activities.ts': ['../../models/CatalogOffering.model', '../../models/ManagedEntity.model'],
};

export const gr02TemporalActivityBoundary: GuardrailRule = {
  id: 'GR-02',
  name: 'Temporal Activity boundary',
  run: (context) => {
    const activityFiles = context.files.filter((file) => file.path.includes('backend/src/temporal/activities/'));
    const violations = activityFiles.flatMap((file) => [
      ...contentViolations(file, /WORKFLOW_API_BASE_URL|\/api\/v1\/workflow-data|\/workflow-data\//, 'GR-02 violation: demoTest Activities must not call legacy workflow-data HTTP paths.'),
      ...importViolations(file, (specifier) => specifier.includes('/workflows/'), (specifier) => `GR-02 violation: Activity imports workflow code (${specifier}).`),
      ...importsOf(file)
        .filter((record) => record.specifier.includes('/models/'))
        .filter((record) => !(allowedCurrentModelReads[file.path] || []).includes(record.specifier))
        .map((record) => violation(file.path, 'GR-02 violation: Activity imports a Mongoose model without an explicit migration exception.', record.statement, record.line)),
    ]);
    return result('GR-02', 'Temporal Activity boundary', 'Activities call services/ports and do not regress to internal HTTP or workflow code.', violations);
  },
};
