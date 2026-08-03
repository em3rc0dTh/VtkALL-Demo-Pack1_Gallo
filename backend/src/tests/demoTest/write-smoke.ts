import assert from 'assert';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { env } from '../../config/env';
import {
  createManagedEntity,
  createOperationalCase,
  createOrReuseCustomer,
  DemoTestDomainError,
  getAvailability,
  inspectDemoTestSeed,
  listTimelineByCase,
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

const nextDateForWeekday = (weekday: number) => {
  const date = new Date();
  while (date.getUTCDay() !== weekday) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dateInTimezone(date, timezone);
};

const findSmokePolicy = async () => {
  const offering = await CatalogOffering.findOne({ businessSlug }).sort({ _id: 1 }).lean().exec();
  assert(offering, 'demo_test smoke requires at least one CatalogOffering');

  const suggestedTeamId = (offering as any).fulfillmentPolicy?.suggestedTeamId;
  const team = suggestedTeamId
    ? await WorkTeam.findOne({ _id: suggestedTeamId, businessSlug, active: true }).lean().exec()
    : await WorkTeam.findOne({ businessSlug, active: true }).sort({ _id: 1 }).lean().exec();
  assert(team, 'demo_test smoke requires at least one active WorkTeam');

  const durationMinutes = Number((offering as any).fulfillmentPolicy?.estimatedDurationMinutes || 60);
  return {
    catalogOfferingId: String((offering as any)._id),
    teamId: String((team as any)._id),
    durationMinutes,
  };
};

const findFirstAvailableSlot = async (policy: { catalogOfferingId: string; teamId: string; durationMinutes: number }) => {
  for (const date of nextDates(14)) {
    const availability = await getAvailability({
      businessSlug,
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      date,
      durationMinutes: policy.durationMinutes,
      timezone,
    });

    const slot = availability.slots[0];
    if (slot) {
      return { availability, slot };
    }
  }

  throw new Error('demo_test smoke did not find an available slot in the next 14 days');
};

const assertTimelineEvents = async (caseId: string) => {
  const timeline = await listTimelineByCase({ businessSlug, caseId });
  const eventTypes = (timeline as any[]).map((event) => event.eventType);
  const required = [
    'case.created',
    'resource_reservation.held',
    'resource_reservation.booked',
    'appointment.scheduled',
    'status.changed',
  ];

  for (const eventType of required) {
    assert(eventTypes.includes(eventType), `timeline must include ${eventType}`);
  }

  return eventTypes;
};

const runSmoke = async () => {
  const testRunId = `pr007_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const source = { origin: 'pr007_smoke', channel: 'test' };
  const metadata = { testRunId };
  const phone = `999${String(Date.now()).slice(-6)}`;
  const isNeutralLab = businessSlug === 'demo_test';

  console.log('PR-007 write smoke');
  console.log(`testRunId: ${testRunId}`);

  await connectForVerification();

  const seedReport = await inspectDemoTestSeed(businessSlug);
  assert(seedReport.conclusion.seedSufficient, 'demo_test seed is not sufficient for smoke');

  const policy = await findSmokePolicy();
  await WorkTeamScheduleRule.findOne({ businessSlug, teamId: policy.teamId, active: true }).lean().exec().then((rule) => {
    assert(rule, `demo_test smoke requires an active WorkTeamScheduleRule for ${policy.teamId}`);
  });

  const { customer, reused } = await createOrReuseCustomer({
    businessSlug,
    name: `PR007 Smoke ${testRunId}`,
    phone,
    contact: {
      phone,
      source,
    },
    metadata,
  });
  assert.strictEqual(reused, false, 'first customer creation should not be reused');

  const secondCustomerResult = await createOrReuseCustomer({
    businessSlug,
    name: `PR007 Smoke Duplicate ${testRunId}`,
    phone,
    metadata,
  });
  assert.strictEqual(secondCustomerResult.reused, true, 'same normalized phone should reuse customer');
  assert.strictEqual(String((secondCustomerResult.customer as any)._id), String((customer as any)._id));

  const managedEntity = await createManagedEntity({
    businessSlug,
    customerId: String((customer as any)._id),
    type: isNeutralLab ? 'other' : 'vehicle',
    displayName: isNeutralLab ? `PR007 Smoke Managed Entity ${testRunId}` : `PR007 Smoke Vehicle ${testRunId}`,
    summary: isNeutralLab ? 'Neutral smoke managed entity' : undefined,
    data: {
      ...(isNeutralLab ? { reference: `neutral-${testRunId}` } : { plate: `PR007${String(Date.now()).slice(-3)}` }),
      source,
    },
    metadata,
  });

  const operationalCase = await createOperationalCase({
    businessSlug,
    customerId: String((customer as any)._id),
    managedEntityId: String((managedEntity as any)._id),
    verticalType: isNeutralLab ? 'generic_service' : 'vehicle_service',
    source,
    intent: {
      type: isNeutralLab ? 'consultation_request' : 'assessment_request',
      summary: isNeutralLab ? 'Neutral laboratory consultation request.' : 'Smoke vehicle assessment request.',
      selectedOfferingId: policy.catalogOfferingId,
    },
    metadata,
  });

  const { availability, slot } = await findFirstAvailableSlot(policy);
  assert(availability.slots.length > 0, 'availability must return at least one slot');

  const scheduleResult = await scheduleConsultation({
    businessSlug,
    customerId: String((customer as any)._id),
    managedEntityId: String((managedEntity as any)._id),
    caseId: String((operationalCase as any)._id),
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: slot.startAt,
    durationMinutes: slot.durationMinutes,
    timezone,
    appointmentType: 'consultation',
    idempotencyKey: testRunId,
    workflowId: `pr007_smoke:${testRunId}`,
  });

  const appointment = scheduleResult.appointment as any;
  const reservation = scheduleResult.resourceReservation as any;

  assert(appointment.resourceReservationId, 'Appointment must reference ResourceReservation');
  assert.strictEqual(String(appointment.resourceReservationId), String(reservation._id));
  assert.strictEqual(reservation.status, 'booked', 'ResourceReservation must be booked');
  assert.notStrictEqual(scheduleResult.case.status, 'lead', 'Case status must be updated after scheduling');

  const persistedReservation = await ResourceReservation.findOne({
    _id: reservation._id,
    businessSlug,
  }).lean().exec();
  assert(persistedReservation, 'ResourceReservation must be persisted');
  assert.strictEqual((persistedReservation as any).status, 'booked');

  const timelineEventTypes = await assertTimelineEvents(String((operationalCase as any)._id));

  try {
    await scheduleConsultation({
      businessSlug,
      customerId: String((customer as any)._id),
      managedEntityId: String((managedEntity as any)._id),
      caseId: String((operationalCase as any)._id),
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      startAt: slot.startAt,
      durationMinutes: slot.durationMinutes,
      timezone,
      appointmentType: 'consultation',
      idempotencyKey: `${testRunId}_retry`,
      workflowId: `pr007_smoke:${testRunId}:retry`,
    });
    assert.fail('retrying same exact slot must fail with DOUBLE_BOOKING_CONFLICT');
  } catch (error) {
    assert(error instanceof DemoTestDomainError, 'double booking error must be a DemoTestDomainError');
    assert.strictEqual(error.code, 'DOUBLE_BOOKING_CONFLICT');
  }

  const unavailableDate = nextDateForWeekday(0);
  try {
    await scheduleConsultation({
      businessSlug,
      customerId: String((customer as any)._id),
      managedEntityId: String((managedEntity as any)._id),
      caseId: String((operationalCase as any)._id),
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      startAt: new Date(`${unavailableDate}T09:00:00.000-05:00`),
      durationMinutes: policy.durationMinutes,
      timezone,
      appointmentType: 'consultation',
      idempotencyKey: `${testRunId}_no_availability`,
      workflowId: `pr007_smoke:${testRunId}:no_availability`,
    });
    assert.fail('requesting a slot outside schedule rules must fail with NO_AVAILABILITY');
  } catch (error) {
    assert(error instanceof DemoTestDomainError, 'no availability error must be a DemoTestDomainError');
    assert.strictEqual(error.code, 'NO_AVAILABILITY');
  }

  const rawTimelineTypes = await TimelineEvent.find({
    businessSlug,
    caseId: String((operationalCase as any)._id),
  }).distinct('eventType').exec();

  console.log('Smoke IDs:');
  console.log(`  customerId: ${(customer as any)._id}`);
  console.log(`  managedEntityId: ${(managedEntity as any)._id}`);
  console.log(`  caseId: ${(operationalCase as any)._id}`);
  console.log(`  appointmentId: ${appointment._id}`);
  console.log(`  resourceReservationId: ${reservation._id}`);
  console.log(`  caseStatus: ${scheduleResult.case.status}`);
  console.log(`  reservationStatus: ${reservation.status}`);
  console.log(`  timelineEventTypes: ${timelineEventTypes.join(', ')}`);
  console.log(`  rawTimelineEventTypes: ${rawTimelineTypes.join(', ')}`);
  console.log('No cleanup was performed.');
  console.log('Suggested manual cleanup filter:');
  console.log(`  { businessSlug: "${businessSlug}", "metadata.testRunId": "${testRunId}" }`);
  console.log('Related reservation/appointment workflow filter:');
  console.log(`  { businessSlug: "${businessSlug}", $or: [{ workflowId: "pr007_smoke:${testRunId}" }, { "workflow.idempotencyKey": "${testRunId}" }] }`);
};

const run = async () => {
  if (process.env.DEMO_TEST_ALLOW_WRITES !== 'true') {
    console.log('PR-007 write smoke skipped.');
    console.log('Set DEMO_TEST_ALLOW_WRITES=true to run the additive Mongo smoke.');
    console.log('No .env or DB data was changed.');
    return;
  }

  try {
    await runSmoke();
  } catch (error) {
    const blocked = isMongoAccessBlocker(error);
    console.log(blocked ? 'PR-007 write smoke blocked.' : 'PR-007 write smoke failed.');
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
    console.log('No cleanup/reset was performed. No .env data was changed.');
    if (!blocked) {
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
};

run();
