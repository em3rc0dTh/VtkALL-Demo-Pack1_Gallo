import assert from 'assert';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { executionContextMiddleware } from '../../middleware/executionContext.middleware';
import {
  createSystemExecutionContext,
  normalizeIdempotencyKey,
  SemanticError,
  toApiErrorEnvelope,
} from '../../services/demoTest/core';
import { recordTimelineEvent } from '../../services/demoTest/timeline.service';
import { TimelineEvent } from '../../models/TimelineEvent.model';

const connectForVerification = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
};

const isMongoAccessBlocker = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /server selection|authentication failed|econnrefused|getaddrinfo|enotfound|timed out/i.test(message);
};

const fakeResponse = () => {
  const headers = new Map<string, string>();
  return {
    setHeader: (key: string, value: string) => headers.set(key, value),
    headers,
  };
};

const runMiddleware = (headers: Record<string, string | undefined>) => {
  const req: any = {
    method: 'POST',
    path: '/customers',
    header: (name: string) => headers[name.toLowerCase()],
  };
  const res: any = fakeResponse();
  let nextError: unknown;
  executionContextMiddleware(req, res, (error?: unknown) => {
    nextError = error;
  });
  return { req, res, nextError };
};

const run = async () => {
  console.log('BE-CORE-01 execution context contract');

  assert.strictEqual(normalizeIdempotencyKey(' abc-123 '), 'abc-123');
  assert.throws(() => normalizeIdempotencyKey('bad key'), /unsupported characters/);

  const middlewareResult = runMiddleware({
    'x-correlation-id': 'corr_manual',
    'x-causation-id': 'cause_manual',
    'idempotency-key': 'idem-001',
  });
  assert.ifError(middlewareResult.nextError);
  assert.strictEqual(middlewareResult.req.executionContext.correlationId, 'corr_manual');
  assert.strictEqual(middlewareResult.req.executionContext.causationId, 'cause_manual');
  assert.strictEqual(middlewareResult.req.executionContext.idempotencyKey, 'idem-001');
  assert.strictEqual(middlewareResult.res.headers.get('X-Correlation-Id'), 'corr_manual');
  assert.strictEqual(middlewareResult.res.headers.get('X-Causation-Id'), 'cause_manual');

  const invalidMiddlewareResult = runMiddleware({ 'idempotency-key': 'bad key' });
  assert(invalidMiddlewareResult.nextError instanceof SemanticError, 'invalid idempotency key must become SemanticError');

  const context = createSystemExecutionContext({
    correlationId: 'corr_contract',
    causationId: 'cause_contract',
    idempotencyKey: 'idem_contract',
    businessSlug: 'demo_test',
    caseId: 'case_contract',
    channel: 'test',
    actor: { type: 'staff', id: 'tester', name: 'Tester' },
  });
  const envelope = toApiErrorEnvelope(
    new SemanticError({ code: 'NO_AVAILABILITY', message: 'No slots.' }),
    context
  );
  assert.strictEqual(envelope.statusCode, 409);
  assert.strictEqual(envelope.body.error.code, 'NO_AVAILABILITY');
  assert.strictEqual(envelope.body.context.correlationId, 'corr_contract');
  assert(!JSON.stringify(envelope.body).includes('stack'), 'error envelope must not expose stack');

  try {
    await connectForVerification();
    const event: any = await recordTimelineEvent({
      businessSlug: 'demo_test',
      caseId: 'case_core_contract',
      eventType: 'case.created',
      title: 'Core contract timeline event',
      visibility: 'internal',
    }, context);
    const persisted: any = await TimelineEvent.findById(event._id).lean().exec();
    assert.strictEqual(persisted.execution.correlationId, 'corr_contract');
    assert.strictEqual(persisted.execution.idempotencyKey, 'idem_contract');
    assert.strictEqual(persisted.actor.id, 'tester');
    console.log('ok timeline execution metadata persisted');
  } catch (error) {
    const blocked = isMongoAccessBlocker(error);
    console.log(blocked ? 'timeline persistence check skipped due to Mongo host/auth blocker.' : 'timeline persistence check failed.');
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    if (!blocked) {
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }

  console.log('ok execution context middleware contract');
  console.log('ok semantic error envelope contract');
};

run();
