import { randomUUID } from 'crypto';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext } from './core';
import { buildDemoTestSlotKeys, getAvailability } from './availability.service';
import { recordTimelineEvent } from './timeline.service';
import {
  ConfirmResourceReservationInput,
  HoldResourceReservationInput,
  ReleaseResourceReservationInput,
  ReservationCapacityCheckInput,
  ReservationStateTransitionResult,
} from './types';

const DEFAULT_HOLD_TTL_MINUTES = 10;
let capacityIndexCompatibilityPromise: Promise<void> | null = null;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

const dateInTimezone = (date: Date, timezone = 'America/Lima') =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const blockingReservationFilter = () => ({
  $or: [
    { status: 'booked' },
    {
      status: 'held',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    },
  ],
});

export const isBlockingReservationDuplicateKeyError = (error: any) => {
  if (error?.code !== 11000) {
    return false;
  }

  const keyPattern = error?.keyPattern || {};
  const indexName = String(error?.index || error?.errmsg || '');
  return (
    keyPattern.businessSlug === 1 &&
    keyPattern.teamId === 1 &&
    keyPattern.slotKeys === 1
  ) || indexName.includes('businessSlug_1_teamId_1_slotKeys_1');
};

const normalizeDuplicateKeyError = (error: any, details: Record<string, unknown>) => {
  if (isBlockingReservationDuplicateKeyError(error)) {
    throw new DemoTestDomainError(
      'DOUBLE_BOOKING_CONFLICT',
      'A legacy unique ResourceReservation index is still enforcing capacity=1. Drop the old unique slotKeys index to allow WorkTeam.capacity > 1.',
      details,
      409
    );
  }
  throw error;
};

const ensureCapacityIndexCompatibility = async () => {
  if (!capacityIndexCompatibilityPromise) {
    capacityIndexCompatibilityPromise = (async () => {
      const indexes = await ResourceReservation.collection.indexes();
      const legacyUniqueIndex = indexes.find((index: any) =>
        index.unique === true &&
        JSON.stringify(index.key) === JSON.stringify({ businessSlug: 1, teamId: 1, slotKeys: 1 })
      );

      if (legacyUniqueIndex?.name) {
        await ResourceReservation.collection.dropIndex(legacyUniqueIndex.name);
      }
    })();
  }

  return capacityIndexCompatibilityPromise;
};

// Policy: allow a requested reservation only when every required slotKey has consumedCapacity < effectiveCapacity.
export const assertNoDoubleBooking = async (input: ReservationCapacityCheckInput): Promise<void> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.teamId, 'teamId');
  assertRequired(input.effectiveCapacity, 'effectiveCapacity');

  if (!input.slotKeys?.length) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'slotKeys are required.', { field: 'slotKeys' });
  }

  for (const slotKey of input.slotKeys) {
    const filter: any = {
      businessSlug: input.businessSlug,
      teamId: input.teamId,
      slotKeys: slotKey,
      ...blockingReservationFilter(),
    };
    if (input.excludeReservationId) {
      filter._id = { $ne: input.excludeReservationId };
    }

    const consumedCapacity = await ResourceReservation.countDocuments(filter).exec();
    if (consumedCapacity >= input.effectiveCapacity) {
      throw new DemoTestDomainError('DOUBLE_BOOKING_CONFLICT', 'The selected slot is no longer available.', {
        teamId: input.teamId,
        slotKey,
        consumedCapacity,
        effectiveCapacity: input.effectiveCapacity,
      }, 409);
    }
  }
};

// Policy: held and booked block capacity; released, cancelled, and expired do not.
export const holdResourceReservation = async (input: HoldResourceReservationInput, context?: ExecutionContext): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.teamId, 'teamId');
  assertRequired(input.catalogOfferingId, 'catalogOfferingId');
  assertRequired(input.startAt, 'startAt');
  assertRequired(input.endAt, 'endAt');
  assertRequired(input.durationMinutes, 'durationMinutes');
  assertRequired(input.slotGranularityMinutes, 'slotGranularityMinutes');

  const team = await WorkTeam.findOne({ _id: input.teamId, businessSlug: input.businessSlug, active: true }).lean().exec();
  if (!team) {
    throw new DemoTestDomainError('WORK_TEAM_NOT_FOUND', 'WorkTeam was not found.', {
      teamId: input.teamId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  const startAt = toDate(input.startAt);
  const endAt = toDate(input.endAt);
  const requiredUnits = input.requiredUnits || Math.ceil(input.durationMinutes / input.slotGranularityMinutes);
  const slotKeys = input.slotKeys?.length
    ? input.slotKeys
    : buildDemoTestSlotKeys(input.teamId, startAt, requiredUnits, input.slotGranularityMinutes);
  const effectiveCapacity = input.effectiveCapacity || Number((team as any).capacity || 1);

  const availability = await getAvailability({
    businessSlug: input.businessSlug,
    teamId: input.teamId,
    catalogOfferingId: input.catalogOfferingId,
    date: dateInTimezone(startAt),
    durationMinutes: input.durationMinutes,
    timezone: input.timezone || 'America/Lima',
    caseId: input.caseId,
  }, context);
  const matchingSlot = availability.slots.find(
    (slot) => slot.startAt.getTime() === startAt.getTime() && slot.endAt.getTime() === endAt.getTime()
  );
  if (!matchingSlot) {
    throw new DemoTestDomainError('NO_AVAILABILITY', 'The selected slot is not available.', {
      teamId: input.teamId,
      startAt,
      endAt,
    }, 409);
  }

  await assertNoDoubleBooking({
    businessSlug: input.businessSlug,
    teamId: input.teamId,
    slotKeys,
    effectiveCapacity: matchingSlot.effectiveCapacity || effectiveCapacity,
  });
  await ensureCapacityIndexCompatibility();

  try {
    const reservation = await (ResourceReservation as any).create({
      _id: `res_${randomUUID()}`,
      businessSlug: input.businessSlug,
      teamId: input.teamId,
      catalogOfferingId: input.catalogOfferingId,
      customerId: input.customerId,
      caseId: input.caseId,
      workflowId: input.workflowId,
      idempotencyKey: input.idempotencyKey || context?.idempotencyKey,
      execution: {
        correlationId: context?.correlationId,
        causationId: context?.causationId,
        workflowRunId: context?.workflowRunId,
        activityId: context?.activityId,
        channel: context?.channel,
      },
      startAt,
      endAt,
      durationMinutes: input.durationMinutes,
      slotGranularityMinutes: input.slotGranularityMinutes,
      requiredUnits,
      slotKeys,
      expiresAt: input.expiresAt || addMinutes(new Date(), DEFAULT_HOLD_TTL_MINUTES),
      status: 'held',
    });

    if (input.caseId) {
      try {
        await recordTimelineEvent({
          businessSlug: input.businessSlug,
          caseId: input.caseId,
          eventType: 'resource_reservation.held',
          title: 'Resource reservation held',
          description: `Capacity was held for ${input.teamId}.`,
          visibility: 'internal',
          actor: { type: 'system', name: 'demo_test' },
          metadata: {
            reservationId: reservation._id,
            teamId: input.teamId,
            startAt,
            endAt,
          },
        }, context);
      } catch {
        // Timeline writes are optional for PR-004/005 reservation lifecycle operations.
      }
    }

    return reservation;
  } catch (error: any) {
    normalizeDuplicateKeyError(error, {
      businessSlug: input.businessSlug,
      teamId: input.teamId,
      startAt,
      endAt,
      catalogOfferingId: input.catalogOfferingId,
      slotKeys,
    });
  }
};

// Policy: confirmResourceReservation means held -> booked. ResourceReservation never uses status "confirmed".
export const confirmResourceReservation = async (
  input: ConfirmResourceReservationInput,
  context?: ExecutionContext
): Promise<ReservationStateTransitionResult> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.resourceReservationId, 'resourceReservationId');

  const reservation = await ResourceReservation.findOne({
    _id: input.resourceReservationId,
    businessSlug: input.businessSlug,
  }).exec();
  if (!reservation) {
    throw new DemoTestDomainError('RESERVATION_FAILED', 'ResourceReservation was not found.', {
      resourceReservationId: input.resourceReservationId,
    }, 404);
  }

  const previousStatus = (reservation as any).status;
  if (previousStatus !== 'held') {
    throw new DemoTestDomainError('RESERVATION_FAILED', 'Only held ResourceReservations can be booked.', {
      resourceReservationId: input.resourceReservationId,
      status: previousStatus,
    }, 409);
  }

  (reservation as any).status = 'booked';
  await reservation.save();

  if ((reservation as any).caseId) {
    try {
      await recordTimelineEvent({
        businessSlug: input.businessSlug,
        caseId: (reservation as any).caseId,
        eventType: 'resource_reservation.booked',
        title: 'Resource reservation booked',
        visibility: 'internal',
        actor: { type: 'system', name: 'demo_test' },
        metadata: {
          reservationId: input.resourceReservationId,
          reason: input.reason,
        },
      }, context);
    } catch {
      // Timeline writes are optional for PR-004/005 reservation lifecycle operations.
    }
  }

  return { reservation, previousStatus, nextStatus: 'booked' };
};

export const releaseResourceReservation = async (
  input: ReleaseResourceReservationInput,
  context?: ExecutionContext
): Promise<ReservationStateTransitionResult> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.resourceReservationId, 'resourceReservationId');

  const reservation = await ResourceReservation.findOne({
    _id: input.resourceReservationId,
    businessSlug: input.businessSlug,
  }).exec();
  if (!reservation) {
    throw new DemoTestDomainError('RESERVATION_FAILED', 'ResourceReservation was not found.', {
      resourceReservationId: input.resourceReservationId,
    }, 404);
  }

  const previousStatus = (reservation as any).status;
  if (previousStatus !== 'held' && previousStatus !== 'booked') {
    throw new DemoTestDomainError('RESERVATION_FAILED', 'Only held or booked ResourceReservations can be released.', {
      resourceReservationId: input.resourceReservationId,
      status: previousStatus,
    }, 409);
  }

  (reservation as any).status = 'released';
  await reservation.save();

  if ((reservation as any).caseId) {
    try {
      await recordTimelineEvent({
        businessSlug: input.businessSlug,
        caseId: (reservation as any).caseId,
        eventType: 'resource_reservation.released',
        title: 'Resource reservation released',
        visibility: 'internal',
        actor: { type: 'system', name: 'demo_test' },
        metadata: {
          reservationId: input.resourceReservationId,
          previousStatus,
          reason: input.reason,
        },
      }, context);
    } catch {
      // Timeline writes are optional for PR-004/005 reservation lifecycle operations.
    }
  }

  return { reservation, previousStatus, nextStatus: 'released' };
};
