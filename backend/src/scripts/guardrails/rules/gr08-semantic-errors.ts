import { GuardrailRule, result, GuardrailViolation } from '../ruleTypes';
import { contentViolations, violation } from './shared';

const requiredCodes = [
  'VALIDATION_ERROR',
  'CUSTOMER_NOT_FOUND',
  'MANAGED_ENTITY_NOT_FOUND',
  'CASE_NOT_FOUND',
  'WORK_TEAM_NOT_FOUND',
  'NO_AVAILABILITY',
  'DOUBLE_BOOKING_CONFLICT',
  'RESERVATION_FAILED',
  'APPOINTMENT_CREATION_FAILED',
  'TIMELINE_WRITE_FAILED',
  'IDEMPOTENCY_KEY_REQUIRED',
  'IDEMPOTENCY_CONFLICT',
  'COMMAND_IN_PROGRESS',
  'IDEMPOTENCY_RECORD_FAILED',
  'INTERNAL_ERROR',
];

export const gr08SemanticErrors: GuardrailRule = {
  id: 'GR-08',
  name: 'Stable semantic errors',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const registry = context.getFile('backend/src/services/demoTest/core/errorRegistry.ts');
    const semanticError = context.getFile('backend/src/services/demoTest/core/SemanticError.ts');
    const serializer = context.getFile('backend/src/services/demoTest/core/errorSerialization.ts');
    const errors = context.getFile('backend/src/services/demoTest/errors.ts');
    if (!semanticError?.content.includes('class SemanticError')) {
      violations.push(violation('backend/src/services/demoTest/core/SemanticError.ts', 'GR-08 violation: SemanticError must be the canonical domain error class.'));
    }
    if (!serializer?.content.includes('toApiErrorEnvelope')) {
      violations.push(violation('backend/src/services/demoTest/core/errorSerialization.ts', 'GR-08 violation: API error envelopes must be serialized centrally.'));
    }
    for (const code of requiredCodes) {
      if (!registry?.content.includes(`'${code}'`)) violations.push(violation('backend/src/services/demoTest/core/errorRegistry.ts', `GR-08 violation: missing semantic error code ${code}.`));
    }
    if (!errors?.content.includes('extends SemanticError')) {
      violations.push(violation('backend/src/services/demoTest/errors.ts', 'GR-08 violation: DemoTestDomainError must bridge to SemanticError instead of defining a parallel authority.'));
    }
    const controllers = context.files.filter((file) => file.path.startsWith('backend/src/controllers/demoTest'));
    violations.push(...controllers.flatMap((file) =>
      contentViolations(file, /catch\s*\(\s*error|sendDemoTestError|toDemoTestErrorResponse|error\.message/, 'GR-08 violation: demoTest controllers must not manually serialize errors or expose error.message.')
    ));
    const schedule = context.getFile('backend/src/services/demoTest/scheduleConsultation.service.ts');
    if (schedule && !schedule.content.includes('DOUBLE_BOOKING_CONFLICT')) {
      violations.push(violation(schedule.path, 'GR-08 violation: scheduling failures must preserve DOUBLE_BOOKING_CONFLICT semantics.'));
    }
    return result('GR-08', 'Stable semantic errors', 'demoTest keeps centralized semantic error codes, stable envelopes, and scheduling error distinctions.', violations);
  },
};
