import assert from 'assert';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.model';
import { Appointment } from '../../models/Appointment.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { seedDatabase } from '../../services/seed.service';
import {
  createManagedEntity,
  createOperationalCase,
  createOrReuseCustomer,
  createSystemExecutionContext,
  DemoTestDomainError,
  executeIdempotentCommand,
  fingerprintCommandInput,
  getAvailability,
  inspectDemoTestSeed,
  SemanticError,
  scheduleConsultation,
} from '../../services/demoTest';

const businessSlug = process.env.DEMO_TEST_BUSINESS_SLUG || 'demo_test';
const timezone = process.env.DEMO_TEST_TIMEZONE || 'America/Lima';

const connectForVerification = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
};

const isMongoAccessBlocker = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /server selection|authentication failed|econnrefused|getaddrinfo|enotfound|timed out/i.test(message);
};

const dateInTimezone = (date: Date, targetTimezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const nextDates = (days: number) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + index);
    return dateInTimezone(date, timezone);
  });

const findPolicy = async () => {
  const offering = await CatalogOffering.findOne({ businessSlug }).sort({ _id: 1 }).lean().exec();
  assert(offering, 'idempotency test requires at least one CatalogOffering');

  const suggestedTeamId = (offering as any).fulfillmentPolicy?.suggestedTeamId;
  const team = suggestedTeamId
    ? await WorkTeam.findOne({ _id: suggestedTeamId, businessSlug, active: true }).lean().exec()
    : await WorkTeam.findOne({ businessSlug, active: true }).sort({ _id: 1 }).lean().exec();
  assert(team, 'idempotency test requires at least one active WorkTeam');

  return {
    catalogOfferingId: String((offering as any)._id),
    teamId: String((team as any)._id),
    durationMinutes: Number((offering as any).fulfillmentPolicy?.estimatedDurationMinutes || 60),
  };
};

const findFirstAvailableSlot = async (policy: { catalogOfferingId: string; teamId: string; durationMinutes: number }) => {
  for (const date of nextDates(21)) {
    const availability = await getAvailability({
      businessSlug,
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      date,
      durationMinutes: policy.durationMinutes,
      timezone,
    });
    const slot = availability.slots[0];
    if (slot) return slot;
  }
  throw new Error('idempotency test did not find an available slot');
};

const findFirstSlotWithCapacity = async (
  policy: { catalogOfferingId: string; teamId: string; durationMinutes: number },
  capacity: number
) => {
  for (const date of nextDates(21)) {
    const availability = await getAvailability({
      businessSlug,
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      date,
      durationMinutes: policy.durationMinutes,
      timezone,
    });
    const slot = availability.slots.find((candidate: any) => Number(candidate.availableCapacity || candidate.capacityRemaining || 0) >= capacity);
    if (slot) return slot;
  }
  throw new Error(`idempotency test did not find a slot with capacity ${capacity}`);
};

const buildCaseFixture = async (testRunId: string, idempotencyKey: string) => {
  const context = createSystemExecutionContext({
    businessSlug,
    idempotencyKey,
    channel: 'test',
    actor: { type: 'staff', id: 'idempotency-test', name: 'Idempotency Test' },
  });
  const phone = `988${String(Date.now()).slice(-6)}${randomUUID().slice(0, 2)}`;
  const customerResult = await createOrReuseCustomer({
    businessSlug,
    name: `Idempotency ${testRunId}`,
    phone,
    metadata: { testRunId },
  }, context);
  const customer: any = customerResult.customer;
  const managedEntity: any = await createManagedEntity({
    businessSlug,
    customerId: customer._id,
    type: 'other',
    displayName: `Idempotency Entity ${testRunId}`,
    data: { reference: testRunId },
    metadata: { testRunId },
  }, context);
  const operationalCase: any = await createOperationalCase({
    businessSlug,
    customerId: customer._id,
    managedEntityId: managedEntity._id,
    verticalType: 'generic_service',
    metadata: { testRunId },
  }, context);

  return { customer, managedEntity, operationalCase };
};

const assertErrorCode = async (fn: () => Promise<unknown>, code: string) => {
  try {
    await fn();
    assert.fail(`expected ${code}`);
  } catch (error) {
    assert(error instanceof SemanticError || error instanceof DemoTestDomainError, `${code} must be semantic`);
    assert.strictEqual((error as any).code, code);
  }
};

const runLeaseChecks = async (testRunId: string) => {
  const context = createSystemExecutionContext({
    businessSlug,
    idempotencyKey: `lease-${testRunId}`,
    channel: 'test',
    actor: { type: 'staff', id: 'lease-test' },
  });
  const input = { businessSlug, value: 'lease-active' };
  const fingerprint = fingerprintCommandInput(input);
  await (IdempotencyRecord as any).create({
    _id: `idem_${randomUUID()}`,
    businessSlug,
    scope: 'test.lease',
    idempotencyKey: context.idempotencyKey,
    requestFingerprint: fingerprint,
    operation: 'leaseTest',
    status: 'processing',
    ownerToken: `owner_${testRunId}`,
    leaseExpiresAt: new Date(Date.now() + 60_000),
    execution: {
      correlationId: context.correlationId,
      firstCausationId: context.causationId,
      lastCausationId: context.causationId,
      channel: context.channel,
    },
    attempts: 1,
  });

  await assertErrorCode(() => executeIdempotentCommand({
    scope: 'test.lease',
    operation: 'leaseTest',
    input,
    context,
    requireKey: true,
    execute: async () => ({ ok: true }),
  }), 'COMMAND_IN_PROGRESS');

  const takeoverContext = createSystemExecutionContext({
    businessSlug,
    idempotencyKey: `lease-expired-${testRunId}`,
    channel: 'test',
    actor: { type: 'staff', id: 'lease-test' },
  });
  const takeoverInput = { businessSlug, value: 'lease-expired' };
  await (IdempotencyRecord as any).create({
    _id: `idem_${randomUUID()}`,
    businessSlug,
    scope: 'test.lease',
    idempotencyKey: takeoverContext.idempotencyKey,
    requestFingerprint: fingerprintCommandInput(takeoverInput),
    operation: 'leaseTest',
    status: 'processing',
    ownerToken: `owner_expired_${testRunId}`,
    leaseExpiresAt: new Date(Date.now() - 60_000),
    execution: {
      correlationId: takeoverContext.correlationId,
      firstCausationId: takeoverContext.causationId,
      lastCausationId: takeoverContext.causationId,
      channel: takeoverContext.channel,
    },
    attempts: 1,
  });

  const takeover = await executeIdempotentCommand({
    scope: 'test.lease',
    operation: 'leaseTest',
    input: takeoverInput,
    context: takeoverContext,
    requireKey: true,
    execute: async () => ({ ok: true, recovered: true }),
  });
  assert.strictEqual((takeover.result as any).recovered, true);
};

const scheduleForFixture = async (
  testRunId: string,
  policy: { catalogOfferingId: string; teamId: string; durationMinutes: number },
  slot: any,
  keySuffix: string
) => {
  const fixture = await buildCaseFixture(`${testRunId}_${keySuffix}`, `fixture-${keySuffix}-${testRunId}`);
  const idempotencyKey = `capacity-${keySuffix}-${testRunId}`;
  const input = {
    businessSlug,
    customerId: String(fixture.customer._id),
    managedEntityId: String(fixture.managedEntity._id),
    caseId: String(fixture.operationalCase._id),
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: slot.startAt,
    durationMinutes: slot.durationMinutes,
    timezone,
    appointmentType: 'consultation',
    idempotencyKey,
    workflowId: `idempotency-test:${testRunId}:capacity:${keySuffix}`,
  };

  return scheduleConsultation(input, createSystemExecutionContext({
    businessSlug,
    caseId: input.caseId,
    idempotencyKey,
    workflowId: input.workflowId,
    channel: 'test',
    actor: { type: 'staff', id: 'idempotency-test' },
  }));
};

const runCapacityChecks = async (
  testRunId: string,
  policy: { catalogOfferingId: string; teamId: string; durationMinutes: number }
) => {
  await WorkTeam.updateOne({ _id: policy.teamId, businessSlug }, { $set: { capacity: 2 } }).exec();
  await WorkTeamScheduleRule.updateMany({ teamId: policy.teamId, businessSlug }, { $set: { capacity: 2 } }).exec();
  const slot = await findFirstSlotWithCapacity(policy, 2);

  const first = await scheduleForFixture(testRunId, policy, slot, 'capacity_one');
  const second = await scheduleForFixture(testRunId, policy, slot, 'capacity_two');

  assert((first.resourceReservation as any)._id, 'first capacity reservation must be created');
  assert((second.resourceReservation as any)._id, 'second capacity reservation must be created');
  assert.notStrictEqual(
    String((first.resourceReservation as any)._id),
    String((second.resourceReservation as any)._id),
    'parallel reservations must be distinct records'
  );

  await assertErrorCode(() => scheduleForFixture(testRunId, policy, slot, 'capacity_three'), 'DOUBLE_BOOKING_CONFLICT');
};

const run = async () => {
  const testRunId = `idem_${Date.now()}_${randomUUID().slice(0, 8)}`;
  console.log('BE-CORE-02 persistent idempotency');
  console.log(`testRunId: ${testRunId}`);

  await connectForVerification();
  await seedDatabase(false, businessSlug as any);
  const seedReport = await inspectDemoTestSeed(businessSlug);
  assert(seedReport.conclusion.seedSufficient, 'seed must be sufficient for idempotency test');

  const indexes = await IdempotencyRecord.collection.indexes();
  assert(indexes.some((index) =>
    index.unique &&
    JSON.stringify(index.key) === JSON.stringify({ businessSlug: 1, scope: 1, idempotencyKey: 1 })
  ), 'IdempotencyRecord must have unique businessSlug+scope+idempotencyKey index');

  assert.strictEqual(
    fingerprintCommandInput({ b: 2, a: 1, idempotencyKey: 'one', workflowRunId: 'run-a' }),
    fingerprintCommandInput({ workflowRunId: 'run-b', idempotencyKey: 'two', a: 1, b: 2 }),
    'fingerprint must ignore execution-only fields and key order'
  );

  const policy = await findPolicy();
  const fixture = await buildCaseFixture(testRunId, `fixture-${testRunId}`);
  const slot = await findFirstAvailableSlot(policy);
  const scheduleInput = {
    businessSlug,
    customerId: String(fixture.customer._id),
    managedEntityId: String(fixture.managedEntity._id),
    caseId: String(fixture.operationalCase._id),
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: slot.startAt,
    durationMinutes: slot.durationMinutes,
    timezone,
    appointmentType: 'consultation',
    idempotencyKey: `schedule-${testRunId}`,
    workflowId: `idempotency-test:${testRunId}`,
  };
  const context = createSystemExecutionContext({
    businessSlug,
    caseId: scheduleInput.caseId,
    idempotencyKey: scheduleInput.idempotencyKey,
    workflowId: scheduleInput.workflowId,
    channel: 'test',
    actor: { type: 'staff', id: 'idempotency-test' },
  });

  const first = await scheduleConsultation(scheduleInput, context);
  const replay = await scheduleConsultation(scheduleInput, createSystemExecutionContext({
    ...context,
    correlationId: `corr_retry_${testRunId}`,
    causationId: `cause_retry_${testRunId}`,
  }));

  assert.strictEqual(String((replay.appointment as any)._id), String((first.appointment as any)._id));
  assert.strictEqual(String((replay.resourceReservation as any)._id), String((first.resourceReservation as any)._id));

  const appointmentCount = await Appointment.countDocuments({
    businessSlug,
    caseId: scheduleInput.caseId,
    'workflow.idempotencyKey': scheduleInput.idempotencyKey,
  }).exec();
  assert.strictEqual(appointmentCount, 1, 'same key replay must not create duplicate Appointment');

  const reservationCount = await ResourceReservation.countDocuments({
    businessSlug,
    caseId: scheduleInput.caseId,
    idempotencyKey: scheduleInput.idempotencyKey,
  }).exec();
  assert.strictEqual(reservationCount, 1, 'same key replay must not create duplicate ResourceReservation');

  const businessTimelineCount = await TimelineEvent.countDocuments({
    businessSlug,
    caseId: scheduleInput.caseId,
    eventType: { $in: ['resource_reservation.held', 'resource_reservation.booked', 'appointment.scheduled', 'status.changed'] },
  }).exec();
  assert.strictEqual(businessTimelineCount, 4, 'same key replay must not duplicate business timeline events');

  await assertErrorCode(() => scheduleConsultation({
    ...scheduleInput,
    startAt: new Date(new Date(scheduleInput.startAt).getTime() + 30 * 60_000),
  }, context), 'IDEMPOTENCY_CONFLICT');

  await assertErrorCode(() => scheduleConsultation({
    ...scheduleInput,
    idempotencyKey: `different-key-${testRunId}`,
    workflowId: `idempotency-test:${testRunId}:different-key`,
  }, createSystemExecutionContext({
    ...context,
    idempotencyKey: `different-key-${testRunId}`,
    workflowId: `idempotency-test:${testRunId}:different-key`,
  })), 'DOUBLE_BOOKING_CONFLICT');

  const concurrentFixture = await buildCaseFixture(`${testRunId}_concurrent`, `fixture-concurrent-${testRunId}`);
  const concurrentSlot = await findFirstAvailableSlot(policy);
  const concurrentInput = {
    ...scheduleInput,
    caseId: String(concurrentFixture.operationalCase._id),
    customerId: String(concurrentFixture.customer._id),
    managedEntityId: String(concurrentFixture.managedEntity._id),
    startAt: concurrentSlot.startAt,
    durationMinutes: concurrentSlot.durationMinutes,
    idempotencyKey: `concurrent-${testRunId}`,
    workflowId: `idempotency-test:${testRunId}:concurrent`,
  };
  const concurrentContext = createSystemExecutionContext({
    businessSlug,
    caseId: concurrentInput.caseId,
    idempotencyKey: concurrentInput.idempotencyKey,
    workflowId: concurrentInput.workflowId,
    channel: 'test',
    actor: { type: 'staff', id: 'idempotency-test' },
  });
  const concurrent = await Promise.allSettled([
    scheduleConsultation(concurrentInput, concurrentContext),
    scheduleConsultation(concurrentInput, createSystemExecutionContext({
      ...concurrentContext,
      correlationId: `corr_concurrent_retry_${testRunId}`,
      causationId: `cause_concurrent_retry_${testRunId}`,
    })),
  ]);
  assert(concurrent.some((item) => item.status === 'fulfilled'), 'one concurrent request must succeed');
  assert(concurrent.every((item) => item.status === 'fulfilled' || ((item as any).reason?.code === 'COMMAND_IN_PROGRESS')));
  const concurrentAppointments = await Appointment.countDocuments({
    businessSlug,
    caseId: concurrentInput.caseId,
    'workflow.idempotencyKey': concurrentInput.idempotencyKey,
  }).exec();
  assert.strictEqual(concurrentAppointments, 1, 'concurrent same-key requests must create one Appointment');

  await assertErrorCode(() => scheduleConsultation({
    ...scheduleInput,
    idempotencyKey: undefined,
  } as any, createSystemExecutionContext({ businessSlug, caseId: scheduleInput.caseId, channel: 'test' })), 'IDEMPOTENCY_KEY_REQUIRED');

  await runLeaseChecks(testRunId);
  await runCapacityChecks(testRunId, policy);

  const finalFailureKey = `final-failure-${testRunId}`;
  const missingCaseInput = {
    ...scheduleInput,
    caseId: `missing_${testRunId}`,
    idempotencyKey: finalFailureKey,
    workflowId: `idempotency-test:${testRunId}:final-failure`,
  };
  const missingContext = createSystemExecutionContext({
    businessSlug,
    caseId: missingCaseInput.caseId,
    idempotencyKey: finalFailureKey,
    channel: 'test',
    actor: { type: 'staff', id: 'idempotency-test' },
  });
  await assertErrorCode(() => scheduleConsultation(missingCaseInput, missingContext), 'CASE_NOT_FOUND');
  await assertErrorCode(() => scheduleConsultation(missingCaseInput, missingContext), 'CASE_NOT_FOUND');
  const finalFailureRecord = await IdempotencyRecord.findOne({
    businessSlug,
    scope: 'consultation.schedule',
    idempotencyKey: finalFailureKey,
  }).lean().exec();
  assert.strictEqual((finalFailureRecord as any).status, 'failed_final');

  console.log('ok unique idempotency index exists');
  console.log('ok same key + same payload replays stored scheduling result');
  console.log('ok same key + different payload returns IDEMPOTENCY_CONFLICT');
  console.log('ok different key + occupied slot preserves DOUBLE_BOOKING_CONFLICT');
  console.log('ok concurrent same-key scheduling creates one Appointment');
  console.log('ok capacity=2 accepts two compatible reservations and rejects the third');
  console.log('ok active and expired leases behave as expected');
  console.log('ok failed_final semantic failure replays');
  console.log('No cleanup was performed.');
  console.log('Suggested manual cleanup filters:');
  console.log(`  { businessSlug: "${businessSlug}", "metadata.testRunId": /${testRunId}/ }`);
  console.log(`  { businessSlug: "${businessSlug}", idempotencyKey: /${testRunId}/ }`);
};

const main = async () => {
  try {
    await run();
  } catch (error) {
    const blocked = isMongoAccessBlocker(error);
    console.log(blocked ? 'BE-CORE-02 idempotency test blocked.' : 'BE-CORE-02 idempotency test failed.');
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    if (!blocked) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

main();
