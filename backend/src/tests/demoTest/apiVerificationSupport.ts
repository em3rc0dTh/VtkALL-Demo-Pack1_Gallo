import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { Appointment } from '../../models/Appointment.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { TimelineEvent } from '../../models/TimelineEvent.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { seedDatabase } from '../../services/seed.service';
import { inspectDemoTestSeed } from '../../services/demoTest';

export const EXIT_PASS = 0;
export const EXIT_CONTRACT_FAILURE = 1;
export const EXIT_ENV_BLOCKED = 2;

export type ScenarioName =
  | 'happy-path'
  | 'replay'
  | 'idempotency-conflict'
  | 'double-booking'
  | 'no-availability'
  | 'missing-idempotency-key'
  | 'timeline'
  | 'full';

type HeadersMap = Record<string, string>;

type ApiResponse<T = any> = {
  status: number;
  headers: HeadersMap;
  body: T;
};

type Policy = {
  catalogOfferingId: string;
  teamId: string;
  durationMinutes: number;
};

type Fixture = {
  customerId: string;
  managedEntityId: string;
  caseId: string;
};

type SchedulePayload = {
  businessSlug: string;
  customerId: string;
  managedEntityId: string;
  caseId: string;
  teamId: string;
  catalogOfferingId: string;
  startAt: string;
  durationMinutes: number;
  timezone: string;
  appointmentType: string;
  idempotencyKey: string;
  workflowId: string;
};

type HappyPathScenario = {
  testRunId: string;
  policy: Policy;
  fixture: Fixture;
  schedulePayload: SchedulePayload;
  idempotencyKey: string;
  scheduleResponse: ApiResponse;
  timelineResponse: ApiResponse;
  appointmentId: string;
  resourceReservationId: string;
  timeline: any[];
};

export class ContractFailure extends Error {
  readonly exitCode = EXIT_CONTRACT_FAILURE;
}

export class EnvironmentBlocked extends Error {
  readonly exitCode = EXIT_ENV_BLOCKED;
}

export const config = {
  apiBaseUrl: (process.env.DEMO_TEST_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, ''),
  businessSlug: process.env.DEMO_TEST_BUSINESS_SLUG || 'demo_test',
  timezone: process.env.DEMO_TEST_TIMEZONE || 'America/Lima',
};

const isEnvironmentBlockerMessage = (message: string) =>
  /server selection|authentication failed|econnrefused|connection refused|getaddrinfo|enotfound|timed out|fetch failed|failed to fetch|ECONNREFUSED|ETIMEDOUT/i.test(message);

export const classifyError = (error: unknown) => {
  if (error instanceof EnvironmentBlocked) return EXIT_ENV_BLOCKED;
  if (error instanceof ContractFailure) return EXIT_CONTRACT_FAILURE;
  const message = error instanceof Error ? error.message : String(error);
  return isEnvironmentBlockerMessage(message) ? EXIT_ENV_BLOCKED : EXIT_CONTRACT_FAILURE;
};

function fail(message: string): never {
  throw new ContractFailure(message);
}

function block(message: string): never {
  throw new EnvironmentBlocked(message);
}

function assertContract(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

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
    return dateInTimezone(date, config.timezone);
  });

const nextDateForWeekday = (weekday: number) => {
  const date = new Date();
  while (date.getUTCDay() !== weekday) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dateInTimezone(date, config.timezone);
};

const headersToObject = (headers: Headers): HeadersMap => {
  const result: HeadersMap = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
};

const apiUrl = (path: string) => `${config.apiBaseUrl}${path}`;

const jsonRequest = async <T = any>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string | undefined>;
  } = {}
): Promise<ApiResponse<T>> => {
  let response!: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...Object.fromEntries(Object.entries(options.headers || {}).filter(([, value]) => value !== undefined)),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    block(`Backend API is unavailable at ${config.apiBaseUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const text = await response.text();
  let body: any = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return {
    status: response.status,
    headers: headersToObject(response.headers),
    body,
  };
};

const queryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
};

const idOf = (value: any) => {
  const id = value?._id || value?.id;
  assertContract(typeof id === 'string' && id.length > 0, 'API response did not include an entity ID.');
  return id;
};

const requireSuccess = <T = any>(response: ApiResponse<T>, expectedStatus: number, label: string) => {
  assertContract(response.status === expectedStatus, `${label} expected HTTP ${expectedStatus}, got ${response.status}.`);
  assertContract((response.body as any)?.ok === true, `${label} expected ok=true.`);
  assertContract(Boolean(response.headers['x-correlation-id']), `${label} missing X-Correlation-Id header.`);
  assertContract(Boolean(response.headers['x-causation-id']), `${label} missing X-Causation-Id header.`);
  return response;
};

const requireSemanticError = (response: ApiResponse, expectedCode: string, label: string) => {
  assertContract(response.status >= 400, `${label} expected an HTTP error status.`);
  assertContract(response.body?.ok === false, `${label} expected ok=false.`);
  assertContract(response.body?.error?.code === expectedCode, `${label} expected ${expectedCode}, got ${response.body?.error?.code || '(missing)'}.`);
  assertContract(Boolean(response.body?.context?.correlationId), `${label} missing error context.correlationId.`);
  assertContract(Boolean(response.body?.context?.causationId), `${label} missing error context.causationId.`);
  assertContract(Boolean(response.headers['x-correlation-id']), `${label} missing X-Correlation-Id header.`);
  assertContract(Boolean(response.headers['x-causation-id']), `${label} missing X-Causation-Id header.`);
};

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    block(`Mongo is unavailable for BE-TOOL-01 setup: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const disconnectMongo = async () => {
  await mongoose.disconnect();
};

export const prepareEnvironment = async () => {
  await connectMongo();
  try {
    await seedDatabase(false, config.businessSlug as any);
    const seedReport = await inspectDemoTestSeed(config.businessSlug);
    assertContract(seedReport.conclusion.seedSufficient, `Seed is not sufficient for businessSlug=${config.businessSlug}.`);
  } catch (error) {
    if (error instanceof ContractFailure) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (isEnvironmentBlockerMessage(message)) block(`Seed preparation was blocked: ${message}`);
    fail(`Seed preparation failed: ${message}`);
  }
};

const findPolicy = async (): Promise<Policy> => {
  await prepareEnvironment();

  const offering = await CatalogOffering.findOne({ businessSlug: config.businessSlug }).sort({ _id: 1 }).lean().exec();
  assertContract(offering, 'BE-TOOL-01 requires at least one CatalogOffering.');

  const suggestedTeamId = (offering as any).fulfillmentPolicy?.suggestedTeamId;
  const team = suggestedTeamId
    ? await WorkTeam.findOne({ _id: suggestedTeamId, businessSlug: config.businessSlug, active: true }).lean().exec()
    : await WorkTeam.findOne({ businessSlug: config.businessSlug, active: true }).sort({ _id: 1 }).lean().exec();
  assertContract(team, 'BE-TOOL-01 requires at least one active WorkTeam.');

  const rule = await WorkTeamScheduleRule.findOne({
    businessSlug: config.businessSlug,
    teamId: String((team as any)._id),
    active: true,
  }).lean().exec();
  assertContract(rule, `BE-TOOL-01 requires an active schedule rule for team ${String((team as any)._id)}.`);

  return {
    catalogOfferingId: String((offering as any)._id),
    teamId: String((team as any)._id),
    durationMinutes: Number((offering as any).fulfillmentPolicy?.estimatedDurationMinutes || 60),
  };
};

const getAvailabilityByApi = async (params: {
  businessSlug: string;
  teamId: string;
  catalogOfferingId: string;
  date: string;
  durationMinutes: number;
  timezone: string;
  caseId?: string;
}) => {
  const response = await jsonRequest(`/api/demo-test/availability?${queryString(params)}`);
  requireSuccess(response, 200, 'availability');
  assertContract(Array.isArray(response.body?.data?.slots), 'availability response missing data.slots.');
  return response;
};

const findFirstAvailableSlot = async (policy: Policy) => {
  for (const date of nextDates(21)) {
    const availability = await getAvailabilityByApi({
      businessSlug: config.businessSlug,
      teamId: policy.teamId,
      catalogOfferingId: policy.catalogOfferingId,
      date,
      durationMinutes: policy.durationMinutes,
      timezone: config.timezone,
    });
    const slot = availability.body.data.slots[0];
    if (slot) return slot;
  }
  fail('API did not return an available slot in the next 21 days.');
};

const createFixtureByApi = async (testRunId: string): Promise<Fixture> => {
  const phone = `977${String(Date.now()).slice(-6)}${randomUUID().slice(0, 2)}`;
  const customerResponse = requireSuccess(await jsonRequest('/api/demo-test/customers', {
    method: 'POST',
    body: {
      businessSlug: config.businessSlug,
      name: `BE TOOL Customer ${testRunId}`,
      phone,
      metadata: { testRunId },
    },
  }), 201, 'create customer');
  const customerId = idOf(customerResponse.body.customer);

  const managedEntityResponse = requireSuccess(await jsonRequest('/api/demo-test/managed-entities', {
    method: 'POST',
    body: {
      businessSlug: config.businessSlug,
      customerId,
      type: 'other',
      displayName: `BE TOOL Managed Entity ${testRunId}`,
      data: { reference: testRunId },
      metadata: { testRunId },
    },
  }), 201, 'create managed entity');
  const managedEntityId = idOf(managedEntityResponse.body.data);

  const caseResponse = requireSuccess(await jsonRequest('/api/demo-test/cases', {
    method: 'POST',
    body: {
      businessSlug: config.businessSlug,
      customerId,
      managedEntityId,
      verticalType: 'generic_service',
      intent: {
        type: 'consultation_request',
        summary: 'BE-TOOL-01 API verification case.',
      },
      metadata: { testRunId },
    },
  }), 201, 'create case');
  const caseId = idOf(caseResponse.body.data);

  return { customerId, managedEntityId, caseId };
};

const timelineByApi = async (caseId: string) => {
  const response = await jsonRequest(`/api/demo-test/cases/${encodeURIComponent(caseId)}/timeline?${queryString({
    businessSlug: config.businessSlug,
  })}`);
  requireSuccess(response, 200, 'timeline');
  assertContract(Array.isArray(response.body?.timeline), 'timeline response missing timeline array.');
  return response;
};

const scheduleByApi = async (payload: SchedulePayload, idempotencyKey?: string) =>
  jsonRequest('/api/demo-test/schedule-consultation', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
      'X-Correlation-Id': `corr_${payload.workflowId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      'X-Causation-Id': `cause_${payload.workflowId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    },
    body: payload,
  });

const requiredTimelineEvents = [
  'case.created',
  'resource_reservation.held',
  'resource_reservation.booked',
  'appointment.scheduled',
  'status.changed',
];

const assertTimelineContract = (timeline: any[], label: string) => {
  const eventTypes = timeline.map((event) => event.eventType);
  for (const eventType of requiredTimelineEvents) {
    assertContract(eventTypes.includes(eventType), `${label} missing timeline event ${eventType}.`);
  }
};

const assertScheduleResponse = (response: ApiResponse, label: string, idempotencyKey: string) => {
  requireSuccess(response, 201, label);
  assertContract(response.headers['idempotency-key'] === idempotencyKey, `${label} missing echoed Idempotency-Key header.`);
  const appointmentId = idOf(response.body?.appointment);
  const resourceReservationId = idOf(response.body?.resourceReservation);
  assertContract(response.body?.appointment?.resourceReservationId === resourceReservationId, `${label} appointment does not reference returned ResourceReservation.`);
  assertContract(response.body?.resourceReservation?.status === 'booked', `${label} ResourceReservation is not booked.`);
  return { appointmentId, resourceReservationId };
};

export const createHappyPathScenario = async (label = 'happy-path'): Promise<HappyPathScenario> => {
  const testRunId = `be_tool_${label.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const policy = await findPolicy();
  const fixture = await createFixtureByApi(testRunId);
  const slot = await findFirstAvailableSlot(policy);
  const idempotencyKey = `schedule-${testRunId}`;
  const schedulePayload: SchedulePayload = {
    businessSlug: config.businessSlug,
    customerId: fixture.customerId,
    managedEntityId: fixture.managedEntityId,
    caseId: fixture.caseId,
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: slot.startAt,
    durationMinutes: Number(slot.durationMinutes || policy.durationMinutes),
    timezone: config.timezone,
    appointmentType: 'consultation',
    idempotencyKey,
    workflowId: `be-tool-01:${testRunId}`,
  };

  const scheduleResponse = await scheduleByApi(schedulePayload, idempotencyKey);
  const { appointmentId, resourceReservationId } = assertScheduleResponse(scheduleResponse, 'schedule consultation', idempotencyKey);
  const timelineResponse = await timelineByApi(fixture.caseId);
  const timeline = timelineResponse.body.timeline;
  assertTimelineContract(timeline, 'happy-path');

  return {
    testRunId,
    policy,
    fixture,
    schedulePayload,
    idempotencyKey,
    scheduleResponse,
    timelineResponse,
    appointmentId,
    resourceReservationId,
    timeline,
  };
};

const printHeader = (title: string) => {
  console.log(`BE-TOOL-01 ${title}`);
  console.log(`businessSlug: ${config.businessSlug}`);
  console.log(`apiBaseUrl: ${config.apiBaseUrl}`);
};

const printScenarioEvidence = (scenario: HappyPathScenario, extra: Record<string, unknown> = {}) => {
  console.log(`testRunId: ${scenario.testRunId}`);
  console.log(`correlationId: ${scenario.scheduleResponse.headers['x-correlation-id']}`);
  console.log(`causationId: ${scenario.scheduleResponse.headers['x-causation-id']}`);
  console.log(`idempotencyKey: ${scenario.idempotencyKey}`);
  console.log(`customerId: ${scenario.fixture.customerId}`);
  console.log(`managedEntityId: ${scenario.fixture.managedEntityId}`);
  console.log(`caseId: ${scenario.fixture.caseId}`);
  console.log(`teamId: ${scenario.policy.teamId}`);
  console.log(`catalogOfferingId: ${scenario.policy.catalogOfferingId}`);
  console.log(`appointmentId: ${scenario.appointmentId}`);
  console.log(`resourceReservationId: ${scenario.resourceReservationId}`);
  console.log(`timelineEventCount: ${scenario.timeline.length}`);
  for (const [key, value] of Object.entries(extra)) {
    console.log(`${key}: ${String(value)}`);
  }
};

const mongoReplayInspection = async (scenario: HappyPathScenario) => {
  await connectMongo();
  const appointmentCount = await Appointment.countDocuments({
    businessSlug: config.businessSlug,
    caseId: scenario.fixture.caseId,
    'workflow.idempotencyKey': scenario.idempotencyKey,
  }).exec();
  const reservationCount = await ResourceReservation.countDocuments({
    businessSlug: config.businessSlug,
    _id: scenario.resourceReservationId,
  }).exec();
  const idempotencyRecordCount = await IdempotencyRecord.countDocuments({
    businessSlug: config.businessSlug,
    scope: 'consultation.schedule',
    idempotencyKey: scenario.idempotencyKey,
    status: { $in: ['succeeded', 'failed_final'] },
  }).exec();

  assertContract(appointmentCount === 1, `Mongo complementary check expected one Appointment, got ${appointmentCount}.`);
  assertContract(reservationCount === 1, `Mongo complementary check expected one ResourceReservation, got ${reservationCount}.`);
  assertContract(idempotencyRecordCount === 1, `Mongo complementary check expected one terminal IdempotencyRecord, got ${idempotencyRecordCount}.`);

  return { appointmentCount, reservationCount, idempotencyRecordCount };
};

export const runHappyPath = async () => {
  printHeader('happy-path');
  const scenario = await createHappyPathScenario('happy-path');
  printScenarioEvidence(scenario, { semanticErrorCode: '(none)' });
};

export const runReplay = async () => {
  printHeader('replay');
  const scenario = await createHappyPathScenario('replay');
  const timelineBeforeReplay = scenario.timeline.length;
  const replayResponse = await scheduleByApi(scenario.schedulePayload, scenario.idempotencyKey);
  const replayIds = assertScheduleResponse(replayResponse, 'idempotent replay', scenario.idempotencyKey);
  const timelineAfter = await timelineByApi(scenario.fixture.caseId);
  const timelineAfterReplay = timelineAfter.body.timeline.length;

  assertContract(replayIds.appointmentId === scenario.appointmentId, 'Replay returned a different Appointment.');
  assertContract(replayIds.resourceReservationId === scenario.resourceReservationId, 'Replay returned a different ResourceReservation.');
  assertContract(timelineAfterReplay === timelineBeforeReplay, 'Replay changed public timeline event count.');

  const mongo = await mongoReplayInspection(scenario);
  printScenarioEvidence(scenario, {
    appointmentIdReplay: replayIds.appointmentId,
    resourceReservationIdReplay: replayIds.resourceReservationId,
    timelineBeforeReplay,
    timelineAfterReplay,
    mongoAppointmentCount: mongo.appointmentCount,
    mongoResourceReservationCount: mongo.reservationCount,
    mongoIdempotencyRecordCount: mongo.idempotencyRecordCount,
    semanticErrorCode: '(none)',
  });
};

export const runIdempotencyConflict = async () => {
  printHeader('idempotency-conflict');
  const scenario = await createHappyPathScenario('idempotency-conflict');
  const modifiedPayload = {
    ...scenario.schedulePayload,
    startAt: new Date(new Date(scenario.schedulePayload.startAt).getTime() + 30 * 60_000).toISOString(),
  };
  const response = await scheduleByApi(modifiedPayload, scenario.idempotencyKey);
  requireSemanticError(response, 'IDEMPOTENCY_CONFLICT', 'idempotency conflict');
  printScenarioEvidence(scenario, {
    semanticErrorCode: response.body.error.code,
    errorStatus: response.status,
  });
};

export const runDoubleBooking = async () => {
  printHeader('double-booking');
  const scenario = await createHappyPathScenario('double-booking');
  const differentKey = `double-booking-${scenario.testRunId}`;
  const response = await scheduleByApi({
    ...scenario.schedulePayload,
    idempotencyKey: differentKey,
    workflowId: `be-tool-01:${scenario.testRunId}:double-booking`,
  }, differentKey);
  requireSemanticError(response, 'DOUBLE_BOOKING_CONFLICT', 'double booking');
  printScenarioEvidence(scenario, {
    attemptedIdempotencyKey: differentKey,
    semanticErrorCode: response.body.error.code,
    errorStatus: response.status,
  });
};

export const runNoAvailability = async () => {
  printHeader('no-availability');
  const testRunId = `be_tool_no_availability_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const policy = await findPolicy();
  const fixture = await createFixtureByApi(testRunId);
  const unavailableDate = nextDateForWeekday(0);
  const idempotencyKey = `no-availability-${testRunId}`;
  const response = await scheduleByApi({
    businessSlug: config.businessSlug,
    customerId: fixture.customerId,
    managedEntityId: fixture.managedEntityId,
    caseId: fixture.caseId,
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: new Date(`${unavailableDate}T09:00:00.000-05:00`).toISOString(),
    durationMinutes: policy.durationMinutes,
    timezone: config.timezone,
    appointmentType: 'consultation',
    idempotencyKey,
    workflowId: `be-tool-01:${testRunId}:no-availability`,
  }, idempotencyKey);
  requireSemanticError(response, 'NO_AVAILABILITY', 'no availability');
  console.log(`testRunId: ${testRunId}`);
  console.log(`businessSlug: ${config.businessSlug}`);
  console.log(`caseId: ${fixture.caseId}`);
  console.log(`teamId: ${policy.teamId}`);
  console.log(`catalogOfferingId: ${policy.catalogOfferingId}`);
  console.log(`semanticErrorCode: ${response.body.error.code}`);
  console.log(`errorStatus: ${response.status}`);
};

export const runMissingIdempotencyKey = async () => {
  printHeader('missing-idempotency-key');
  const testRunId = `be_tool_missing_key_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const policy = await findPolicy();
  const fixture = await createFixtureByApi(testRunId);
  const slot = await findFirstAvailableSlot(policy);
  const response = await scheduleByApi({
    businessSlug: config.businessSlug,
    customerId: fixture.customerId,
    managedEntityId: fixture.managedEntityId,
    caseId: fixture.caseId,
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    startAt: slot.startAt,
    durationMinutes: Number(slot.durationMinutes || policy.durationMinutes),
    timezone: config.timezone,
    appointmentType: 'consultation',
    idempotencyKey: '',
    workflowId: `be-tool-01:${testRunId}:missing-key`,
  }, undefined);
  requireSemanticError(response, 'IDEMPOTENCY_KEY_REQUIRED', 'missing idempotency key');
  console.log(`testRunId: ${testRunId}`);
  console.log(`caseId: ${fixture.caseId}`);
  console.log(`semanticErrorCode: ${response.body.error.code}`);
  console.log(`errorStatus: ${response.status}`);
};

export const runTimeline = async (caseId?: string) => {
  printHeader('timeline');
  if (caseId) {
    const response = await timelineByApi(caseId);
    console.log(`caseId: ${caseId}`);
    console.log(`timelineEventCount: ${response.body.timeline.length}`);
    console.log(`semanticErrorCode: (none)`);
    return;
  }

  const scenario = await createHappyPathScenario('timeline');
  const executionEvents = scenario.timeline.filter((event) =>
    event?.execution?.idempotencyKey === scenario.idempotencyKey ||
    event?.execution?.correlationId === scenario.scheduleResponse.headers['x-correlation-id']
  );
  assertContract(executionEvents.length > 0, 'Timeline did not expose execution metadata traceable to schedule request.');
  printScenarioEvidence(scenario, {
    traceableExecutionEvents: executionEvents.length,
    semanticErrorCode: '(none)',
  });
};

export const runFull = async () => {
  printHeader('full');
  await runHappyPath();
  await runReplay();
  await runIdempotencyConflict();
  await runDoubleBooking();
  await runNoAvailability();
  await runMissingIdempotencyKey();
  await runTimeline();
};

export const runScenario = async (scenario: ScenarioName, caseId?: string) => {
  if (scenario === 'happy-path') return runHappyPath();
  if (scenario === 'replay') return runReplay();
  if (scenario === 'idempotency-conflict') return runIdempotencyConflict();
  if (scenario === 'double-booking') return runDoubleBooking();
  if (scenario === 'no-availability') return runNoAvailability();
  if (scenario === 'missing-idempotency-key') return runMissingIdempotencyKey();
  if (scenario === 'timeline') return runTimeline(caseId);
  return runFull();
};

export const printFinalStatus = (exitCode: number, error?: unknown) => {
  if (exitCode === EXIT_PASS) {
    console.log('BE-TOOL-01 result: PASS');
    return;
  }

  const label = exitCode === EXIT_ENV_BLOCKED ? 'BLOCKED BY ENVIRONMENT' : 'CONTRACT FAILURE';
  console.log(`BE-TOOL-01 result: ${label}`);
  if (error) {
    console.log(`Reason: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const scenarioNames: ScenarioName[] = [
  'happy-path',
  'replay',
  'idempotency-conflict',
  'double-booking',
  'no-availability',
  'missing-idempotency-key',
  'timeline',
  'full',
];

export const printUsage = () => {
  console.log('Usage: npm run demo-test:console -- <scenario> [caseId]');
  console.log(`Scenarios: ${scenarioNames.join(', ')}`);
  console.log('Exit codes: 0=PASS, 1=CONTRACT FAILURE, 2=BLOCKED BY ENVIRONMENT');
};

export const printDiagnosticCounts = async (testRunId: string) => {
  await connectMongo();
  const [appointments, reservations, timelineEvents, idempotencyRecords] = await Promise.all([
    Appointment.countDocuments({ businessSlug: config.businessSlug, 'workflow.idempotencyKey': new RegExp(testRunId) }).exec(),
    ResourceReservation.countDocuments({ businessSlug: config.businessSlug, idempotencyKey: new RegExp(testRunId) }).exec(),
    TimelineEvent.countDocuments({ businessSlug: config.businessSlug, 'metadata.testRunId': testRunId }).exec(),
    IdempotencyRecord.countDocuments({ businessSlug: config.businessSlug, idempotencyKey: new RegExp(testRunId) }).exec(),
  ]);
  console.log(`diagnosticAppointments: ${appointments}`);
  console.log(`diagnosticResourceReservations: ${reservations}`);
  console.log(`diagnosticTimelineEvents: ${timelineEvents}`);
  console.log(`diagnosticIdempotencyRecords: ${idempotencyRecords}`);
};
