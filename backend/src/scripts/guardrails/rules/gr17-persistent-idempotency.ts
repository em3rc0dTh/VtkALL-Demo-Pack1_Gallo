import { GuardrailRule, GuardrailViolation, result } from '../ruleTypes';
import { contentViolations, violation } from './shared';

export const gr17PersistentIdempotency: GuardrailRule = {
  id: 'GR-17',
  name: 'Persistent command idempotency',
  run: (context) => {
    const violations: GuardrailViolation[] = [];
    const model = context.getFile('backend/src/models/IdempotencyRecord.model.ts');
    if (!model?.content.includes('IdempotencyRecordSchema.index({ businessSlug: 1, scope: 1, idempotencyKey: 1 }, { unique: true })')) {
      violations.push(violation('backend/src/models/IdempotencyRecord.model.ts', 'GR-17 violation: IdempotencyRecord must have unique businessSlug+scope+idempotencyKey protection.'));
    }
    if (!model?.content.includes("enum: ['processing', 'succeeded', 'failed_retryable', 'failed_final']")) {
      violations.push(violation('backend/src/models/IdempotencyRecord.model.ts', 'GR-17 violation: IdempotencyRecord must preserve the processing/succeeded/failed status enum.'));
    }

    const service = context.getFile('backend/src/services/demoTest/core/idempotency/idempotentCommand.service.ts');
    if (!service?.content.includes('executeIdempotentCommand')) {
      violations.push(violation('backend/src/services/demoTest/core/idempotency/idempotentCommand.service.ts', 'GR-17 violation: idempotent command execution must be centralized.'));
    }
    if (!service?.content.includes('leaseExpiresAt') || !service.content.includes('ownerToken')) {
      violations.push(violation('backend/src/services/demoTest/core/idempotency/idempotentCommand.service.ts', 'GR-17 violation: idempotent commands must use ownerToken and leaseExpiresAt processing leases.'));
    }
    if (!service?.content.includes('reconcileScheduleConsultationResult')) {
      violations.push(violation('backend/src/services/demoTest/core/idempotency/idempotentCommand.service.ts', 'GR-17 violation: scheduling idempotency must have an ambiguous-completion reconciliation path.'));
    }

    const schedule = context.getFile('backend/src/services/demoTest/scheduleConsultation.service.ts');
    if (!schedule?.content.includes("scope: 'consultation.schedule'") || !schedule.content.includes('requireKey: true')) {
      violations.push(violation('backend/src/services/demoTest/scheduleConsultation.service.ts', 'GR-17 violation: scheduleConsultation must be wrapped as a required-key idempotent command.'));
    }

    const controller = context.getFile('backend/src/controllers/demoTest.controller.ts');
    if (!controller?.content.includes('IDEMPOTENCY_KEY_REQUIRED') || !controller.content.includes('req.executionContext?.idempotencyKey')) {
      violations.push(violation('backend/src/controllers/demoTest.controller.ts', 'GR-17 violation: public schedule-consultation write must require propagated Idempotency-Key.'));
    }

    const activity = context.getFile('backend/src/temporal/activities/scheduleConsultation.activities.ts');
    if (!activity?.content.includes('scheduleIdempotencyKey') || /randomUUID\(|Date\.now\(\)/.test(activity?.content || '')) {
      violations.push(violation('backend/src/temporal/activities/scheduleConsultation.activities.ts', 'GR-17 violation: Temporal scheduling idempotency key must be stable and not generated from attempt-local randomness/time.'));
    }

    const sourceFiles = context.files.filter((file) =>
      file.path.startsWith('backend/src/') &&
      !file.path.includes('/guardrails/') &&
      !file.path.includes('/tests/')
    );
    violations.push(...sourceFiles.flatMap((file) =>
      contentViolations(file, /new\s+Map\s*<[^>]*idempot|new\s+Map\s*\([^)]*idempot|idempotencyCache|idempotencyMap/i, 'GR-17 violation: idempotency must not be implemented as an in-memory map/cache.')
    ));

    return result('GR-17', 'Persistent command idempotency', 'demoTest write idempotency is persisted with unique keys, leases, replay, and stable Temporal keys.', violations);
  },
};
