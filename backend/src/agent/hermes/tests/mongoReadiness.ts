import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoServerError, MongoServerSelectionError } from 'mongodb';
import { env } from '../../../config/env';
import { BusinessProfile } from '../../../models/BusinessProfile.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Case } from '../../../models/Case.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';

type Check = {
  name: string;
  passed: boolean;
  code?: string;
  stage?: string;
  status?: 'PASS' | 'FAIL' | 'EMPTY_VALID';
  detail?: string;
};

const businessSlug = 'demo_test';
const conversationId = 'hermes-h04-readiness';
const messageId = 'mongo-readiness-fixture';
const fixtureId = `ci_h04_readiness_${crypto.randomUUID()}`;

const check = (name: string, passed: boolean, extra: Partial<Check> = {}): Check => ({
  name,
  passed,
  status: passed ? 'PASS' : 'FAIL',
  ...extra,
});

const classifyMongoError = (error: any): { code: string; stage: string; message: string } => {
  const message = String(error?.message || 'MongoDB operation failed.');
  if (message.toLowerCase().includes('authentication failed')) {
    return {
      code: 'MONGO_AUTHENTICATION_FAILED',
      stage: 'authentication',
      message: 'MongoDB rejected the configured credentials.',
    };
  }
  if (error instanceof MongoServerSelectionError || /ECONNREFUSED|ENOTFOUND|server selection/i.test(message)) {
    return {
      code: 'MONGO_HOST_UNREACHABLE',
      stage: 'connection',
      message: 'MongoDB host or port is unreachable.',
    };
  }
  if (error instanceof MongoServerError && /not authorized|unauthorized/i.test(message)) {
    return {
      code: 'MONGO_AUTHORIZATION_FAILED',
      stage: 'authorization',
      message: 'MongoDB authenticated but rejected the operation.',
    };
  }
  return {
    code: 'MONGO_READ_FAILED',
    stage: 'unknown',
    message: 'MongoDB readiness operation failed.',
  };
};

const run = async () => {
  const results: Check[] = [];

  if (!env.mongoUri) {
    results.push(check('mongo uri present', false, {
      code: 'MONGO_CONFIG_MISSING',
      stage: 'configuration',
      detail: 'MONGO_URI is not configured.',
    }));
    console.log(JSON.stringify({ ok: false, total: results.length, passed: 0, failed: 1, results }, null, 2));
    process.exit(1);
  }

  try {
    // Validate URI shape without printing it.
    new URL(env.mongoUri);
    results.push(check('mongo uri parse', true));
  } catch {
    results.push(check('mongo uri parse', false, {
      code: 'MONGO_URI_INVALID',
      stage: 'configuration',
      detail: 'Configured Mongo URI is not parseable.',
    }));
    console.log(JSON.stringify({ ok: false, total: results.length, passed: 0, failed: 1, results }, null, 2));
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    results.push(check('mongo connection', true));
    await mongoose.connection.db?.admin().ping();
    results.push(check('mongo ping', true));

    const profile = await BusinessProfile.findOne({ businessSlug }).lean().exec();
    results.push(profile
      ? check('BusinessProfile read', true)
      : check('BusinessProfile read', true, { status: 'EMPTY_VALID', detail: 'No BusinessProfile found for demo_test.' }));

    const offering = await CatalogOffering.findOne({ businessSlug }).lean().exec();
    results.push(offering
      ? check('CatalogOffering read', true)
      : check('CatalogOffering read', true, { status: 'EMPTY_VALID', detail: 'No CatalogOffering found for demo_test.' }));

    const caseRecord = await Case.findOne({ businessSlug }).lean().exec();
    results.push(caseRecord
      ? check('Case read', true)
      : check('Case read', true, { status: 'EMPTY_VALID', detail: 'No Case found for demo_test.' }));

    try {
      await CustomerInteraction.create({
        _id: fixtureId,
        businessSlug,
        caseId: fixtureId,
        conversationId,
        messageId,
        channel: 'api',
        direction: 'inbound',
        visibility: 'internal',
        interactionType: 'system_event',
        body: 'HERMES-04 readiness fixture',
        message: 'HERMES-04 readiness fixture',
        content: { text: 'HERMES-04 readiness fixture', attachmentIds: [] },
        participant: { type: 'system' },
        metadata: { fixture: true, hermes04Readiness: true },
      });
      results.push(check('CustomerInteraction fixture write', true));
    } catch (error: any) {
      const classified = classifyMongoError(error);
      results.push(check('CustomerInteraction fixture write', false, {
        code: classified.code === 'MONGO_READ_FAILED' ? 'MONGO_FIXTURE_WRITE_FAILED' : classified.code,
        stage: 'fixture_write',
        detail: classified.message,
      }));
      throw error;
    }

    const fixture = await CustomerInteraction.findOne({ businessSlug, conversationId, messageId }).lean().exec();
    results.push(check('CustomerInteraction fixture read', Boolean(fixture), {
      code: fixture ? undefined : 'MONGO_FIXTURE_READ_FAILED',
      stage: fixture ? undefined : 'fixture_read',
      detail: fixture ? undefined : 'Fixture was not found by businessSlug + conversationId + messageId.',
    }));

    const cleanup = await CustomerInteraction.deleteOne({
      businessSlug,
      conversationId,
      messageId,
      'metadata.hermes04Readiness': true,
    }).exec();
    results.push(check('CustomerInteraction fixture cleanup', cleanup.deletedCount === 1, {
      code: cleanup.deletedCount === 1 ? undefined : 'MONGO_FIXTURE_CLEANUP_FAILED',
      stage: cleanup.deletedCount === 1 ? undefined : 'fixture_cleanup',
      detail: cleanup.deletedCount === 1 ? undefined : `Expected one fixture cleanup, deleted ${cleanup.deletedCount}.`,
    }));

    await CustomerInteraction.createIndexes();
    const indexes = await CustomerInteraction.collection.indexes();
    const indexNames = indexes.map((index) => JSON.stringify(index.key));
    const requiredIndexes = [
      JSON.stringify({ businessSlug: 1, conversationId: 1, createdAt: 1 }),
      JSON.stringify({ businessSlug: 1, caseId: 1, createdAt: -1 }),
      JSON.stringify({ businessSlug: 1, customerId: 1, createdAt: -1 }),
      JSON.stringify({ businessSlug: 1, visibility: 1, createdAt: -1 }),
    ];
    for (const required of requiredIndexes) {
      results.push(check(`index ${required}`, indexNames.includes(required), {
        code: indexNames.includes(required) ? undefined : 'MONGO_DATABASE_NOT_FOUND',
        stage: indexNames.includes(required) ? undefined : 'indexes',
        detail: indexNames.includes(required) ? undefined : 'Required CustomerInteraction index is missing.',
      }));
    }
  } catch (error: any) {
    if (!results.some((item) => item.passed === false)) {
      const classified = classifyMongoError(error);
      results.push(check('mongo readiness exception', false, {
        code: classified.code,
        stage: classified.stage,
        detail: classified.message,
      }));
    }
  } finally {
    try {
      await CustomerInteraction.deleteOne({
        businessSlug,
        conversationId,
        messageId,
        'metadata.hermes04Readiness': true,
      }).exec();
    } catch {}
    await mongoose.disconnect().catch(() => undefined);
  }

  const failed = results.filter((item) => !item.passed);
  console.log(JSON.stringify({
    ok: failed.length === 0,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  }, null, 2));
  if (failed.length) process.exit(1);
};

run().catch((error) => {
  const classified = classifyMongoError(error);
  console.log(JSON.stringify({
    ok: false,
    total: 1,
    passed: 0,
    failed: 1,
    results: [check('mongo readiness fatal', false, {
      code: classified.code,
      stage: classified.stage,
      detail: classified.message,
    })],
  }, null, 2));
  process.exit(1);
});
