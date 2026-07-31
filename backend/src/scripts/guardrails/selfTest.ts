import assert from 'assert';
import { GuardrailContext, ProjectFile } from './ruleTypes';
import { guardrailRules } from './rules';

const contextFromFiles = (files: ProjectFile[]): GuardrailContext => {
  const byPath = new Map(files.map((file) => [file.path, file]));
  return {
    repoRoot: 'fixture',
    files,
    getFile: (filePath) => byPath.get(filePath.replace(/\\/g, '/')),
    hasFile: (filePath) => byPath.has(filePath.replace(/\\/g, '/')),
  };
};

const rule = (id: string) => {
  const found = guardrailRules.find((item) => item.id === id);
  assert(found, `Missing rule ${id}`);
  return found;
};

const assertFails = (ruleId: string, files: ProjectFile[], expectedFile: string) => {
  const result = rule(ruleId).run(contextFromFiles(files));
  assert.strictEqual(result.passed, false, `${ruleId} fixture must fail`);
  assert(result.violations.some((entry) => entry.file === expectedFile), `${ruleId} must identify ${expectedFile}`);
  assert(result.violations.some((entry) => entry.message.includes(ruleId)), `${ruleId} failure must include rule id`);
};

const assertPasses = (ruleId: string, files: ProjectFile[]) => {
  const result = rule(ruleId).run(contextFromFiles(files));
  assert.strictEqual(result.passed, true, `${ruleId} fixture must pass: ${result.violations.map((v) => v.message).join('; ')}`);
};

const run = () => {
  console.log('VtkALL Backend Architecture Guardrails self-tests');

  assertFails('GR-01', [{
    path: 'backend/src/temporal/workflows/bad.workflow.ts',
    content: "import mongoose from 'mongoose';\nexport const x = 1;",
  }], 'backend/src/temporal/workflows/bad.workflow.ts');
  assertPasses('GR-01', [{
    path: 'backend/src/temporal/workflows/good.workflow.ts',
    content: "import { condition } from '@temporalio/workflow';\nexport const x = condition;",
  }]);

  assertFails('GR-02', [{
    path: 'backend/src/temporal/activities/bad.activities.ts',
    content: "const url = process.env.WORKFLOW_API_BASE_URL + '/api/v1/workflow-data';",
  }], 'backend/src/temporal/activities/bad.activities.ts');

  assertFails('GR-03', [{
    path: 'backend/src/controllers/bad.controller.ts',
    content: "import { ResourceReservation } from '../models/ResourceReservation.model';",
  }], 'backend/src/controllers/bad.controller.ts');

  assertFails('GR-10', [{
    path: 'backend/src/services/demoTest/bad.service.ts',
    content: "import { TimelineEvent } from '../../models/TimelineEvent.model';\nTimelineEvent.create({});",
  }], 'backend/src/services/demoTest/bad.service.ts');
  assertFails('GR-10', [{
    path: 'backend/src/services/demoTest/timeline.service.ts',
    content: "export const recordTimelineEvent = () => TimelineEvent.create({ actor: { type: 'system' } });",
  }], 'backend/src/services/demoTest/timeline.service.ts');

  assertFails('GR-11', [{
    path: 'backend/src/services/demoTest/bad.service.ts',
    content: "import xmlrpc from 'xmlrpc';\nconst model = 'res.partner';",
  }], 'backend/src/services/demoTest/bad.service.ts');

  assertFails('GR-13', [{
    path: 'frontend/app/bad.js',
    content: "import { Client } from '@temporalio/client';",
  }], 'frontend/app/bad.js');

  assertFails('GR-14', [{
    path: 'backend/.env.example',
    content: 'TEMPORAL_ADDRESS=http://localhost:7233',
  }, {
    path: 'backend/src/config/env.ts',
    content: 'export const env = {};',
  }], 'backend/.env.example');
  assertFails('GR-14', [{
    path: 'backend/.env.example',
    content: 'TEMPORAL_ADDRESS=localhost:7233',
  }, {
    path: 'backend/src/config/env.ts',
    content: 'export const validateTemporalAddress = () => true;',
  }, {
    path: 'backend/src/app.ts',
    content: "app.use('/api/demo-test', demoTestRoutes);",
  }, {
    path: 'backend/src/temporal/activities/scheduleConsultation.activities.ts',
    content: "throw new Error(error.message);",
  }], 'backend/src/app.ts');

  assertFails('GR-08', [{
    path: 'backend/src/services/demoTest/core/errorRegistry.ts',
    content: "export const semanticErrorRegistry = { VALIDATION_ERROR: {} };",
  }, {
    path: 'backend/src/services/demoTest/core/SemanticError.ts',
    content: "export class SemanticError extends Error {}",
  }, {
    path: 'backend/src/services/demoTest/core/errorSerialization.ts',
    content: "export const toApiErrorEnvelope = () => {};",
  }, {
    path: 'backend/src/services/demoTest/errors.ts',
    content: "export class DemoTestDomainError extends SemanticError {}",
  }, {
    path: 'backend/src/controllers/demoTest.controller.ts',
    content: "try { await x(); } catch (error) { res.json({ error: error.message }); }",
  }, {
    path: 'backend/src/services/demoTest/scheduleConsultation.service.ts',
    content: "throw new Error('oops');",
  }], 'backend/src/services/demoTest/core/errorRegistry.ts');

  assertFails('GR-15', [{
    path: 'backend/src/services/seed.service.ts',
    content: "const DEMO_TEST_BUSINESS_PROFILE = { agent: 'Iris', required: 'vehiclePlate' }; const OFFERING_DURATION_BY_ID = {};",
  }], 'backend/src/services/seed.service.ts');

  assertFails('GR-17', [{
    path: 'backend/src/models/IdempotencyRecord.model.ts',
    content: "IdempotencyRecordSchema.index({ idempotencyKey: 1 }, { unique: true });",
  }, {
    path: 'backend/src/services/demoTest/core/idempotency/idempotentCommand.service.ts',
    content: "export const executeIdempotentCommand = async () => {};",
  }, {
    path: 'backend/src/services/demoTest/scheduleConsultation.service.ts',
    content: "export const scheduleConsultation = async () => {};",
  }, {
    path: 'backend/src/controllers/demoTest.controller.ts',
    content: "router.post('/schedule-consultation', handler);",
  }, {
    path: 'backend/src/temporal/activities/scheduleConsultation.activities.ts',
    content: "const idempotencyKey = randomUUID();",
  }], 'backend/src/models/IdempotencyRecord.model.ts');

  console.log('ok failing fixtures are detected');
  console.log('ok passing fixtures remain clean');
};

run();
