import { CatalogOffering } from '../../models/CatalogOffering.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { WorkTeam } from '../../models/WorkTeam.model';
import { WorkTeamScheduleOverride } from '../../models/WorkTeamScheduleOverride.model';
import { WorkTeamScheduleRule } from '../../models/WorkTeamScheduleRule.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext } from './core';
import { AvailabilityResult, AvailabilitySlotCandidate, GetAvailabilityInput } from './types';
import { recordTimelineEvent } from './timeline.service';

type AvailabilityWindow = {
  startTime: string;
  endTime: string;
  capacity: number;
};

type ResolvedAvailabilityPolicy = {
  businessSlug: string;
  teamId: string;
  catalogOfferingId?: string;
  date: string;
  durationMinutes: number;
  slotGranularityMinutes: number;
  timezone: string;
  team: any;
};

const BLOCKING_RESERVATION_QUERY = (now: Date) => ({
  $or: [
    { status: 'booked' },
    {
      status: 'held',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    },
  ],
});

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

const localDateTime = (date: string, time: string, timezone: string) => {
  const offset = timezone === 'America/Lima' ? '-05:00' : 'Z';
  return new Date(`${date}T${time}:00.000${offset}`);
};

const localWeekday = (date: string, timezone: string) => localDateTime(date, '12:00', timezone).getUTCDay();

const formatSlotTime = (date: Date, timezone: string) => {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return formatted.replace(':', '');
};

export const buildDemoTestSlotKey = (teamId: string, startAt: Date) => `${teamId}:${startAt.toISOString()}`;

export const buildDemoTestSlotKeys = (teamId: string, startAt: Date, requiredUnits: number, granularityMinutes: number) =>
  Array.from({ length: requiredUnits }, (_, index) => buildDemoTestSlotKey(teamId, addMinutes(startAt, index * granularityMinutes)));

const buildSlotId = (teamId: string, catalogOfferingId: string | undefined, date: string, startAt: Date, timezone: string) =>
  `cap_${teamId}_${catalogOfferingId || 'manual'}_${date.replace(/-/g, '')}_${formatSlotTime(startAt, timezone)}`;

const resolvePolicy = async (input: GetAvailabilityInput): Promise<ResolvedAvailabilityPolicy> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.date, 'date');
  assertRequired(input.timezone, 'timezone');

  let offering: any = null;
  if (input.catalogOfferingId) {
    offering = await CatalogOffering.findOne({ _id: input.catalogOfferingId, businessSlug: input.businessSlug }).lean().exec();
    if (!offering) {
      throw new DemoTestDomainError('VALIDATION_ERROR', 'CatalogOffering was not found.', {
        catalogOfferingId: input.catalogOfferingId,
        businessSlug: input.businessSlug,
      }, 404);
    }
  }

  const fulfillmentPolicy = offering?.fulfillmentPolicy || {};
  const teamId = input.teamId || fulfillmentPolicy.suggestedTeamId;
  assertRequired(teamId, 'teamId');

  const team = await WorkTeam.findOne({ _id: teamId, businessSlug: input.businessSlug, active: true }).lean().exec();
  if (!team) {
    throw new DemoTestDomainError('WORK_TEAM_NOT_FOUND', 'WorkTeam was not found.', {
      teamId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  const durationMinutes = Number(input.durationMinutes || fulfillmentPolicy.estimatedDurationMinutes || 60);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'durationMinutes must be a positive number.', { durationMinutes: input.durationMinutes });
  }

  const slotGranularityMinutes = Number(
    fulfillmentPolicy.slotGranularityMinutes || (team as any).slotGranularityMinutes || 15
  );
  if (!Number.isFinite(slotGranularityMinutes) || slotGranularityMinutes <= 0) {
    throw new DemoTestDomainError('VALIDATION_ERROR', 'slotGranularityMinutes must be a positive number.', {
      slotGranularityMinutes,
    });
  }

  return {
    businessSlug: input.businessSlug,
    teamId,
    catalogOfferingId: input.catalogOfferingId,
    date: input.date,
    durationMinutes,
    slotGranularityMinutes,
    timezone: input.timezone,
    team,
  };
};

const getWindowsForDate = async (policy: ResolvedAvailabilityPolicy) => {
  const defaultCapacity = Number(policy.team.capacity || 1);
  const weekday = localWeekday(policy.date, policy.timezone);
  const rules = await WorkTeamScheduleRule.find({
    businessSlug: policy.businessSlug,
    teamId: policy.teamId,
    weekday,
    active: true,
  }).sort({ startTime: 1 }).lean().exec();

  const overrides = await WorkTeamScheduleOverride.find({
    businessSlug: policy.businessSlug,
    teamId: policy.teamId,
    date: policy.date,
    active: true,
  }).sort({ createdAt: 1 }).lean().exec();

  if ((overrides as any[]).some((override) => override.mode === 'block')) {
    return [];
  }

  const replacement = [...(overrides as any[])].reverse().find((override) => override.mode === 'replace');
  const baseWindows = replacement
    ? replacement.windows || []
    : (rules as any[]).map((rule) => ({
        startTime: rule.startTime,
        endTime: rule.endTime,
        capacity: rule.capacity,
      }));

  const extendWindows = (overrides as any[])
    .filter((override) => override.mode === 'extend')
    .flatMap((override) => override.windows || []);

  return [...baseWindows, ...extendWindows]
    .map((window: any): AvailabilityWindow => ({
      startTime: window.startTime,
      endTime: window.endTime,
      capacity: Number(window.capacity || defaultCapacity),
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const loadBlockingUsage = async (policy: ResolvedAvailabilityPolicy) => {
  const dayStart = localDateTime(policy.date, '00:00', policy.timezone);
  const dayEnd = localDateTime(policy.date, '23:59', policy.timezone);
  const reservationFilter: any = {
    businessSlug: policy.businessSlug,
    teamId: policy.teamId,
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
    ...BLOCKING_RESERVATION_QUERY(new Date()),
  };
  const reservations = await ResourceReservation.find(reservationFilter).lean().exec();

  const usageBySlotKey = new Map<string, number>();
  for (const reservation of reservations as any[]) {
    for (const key of reservation.slotKeys || []) {
      usageBySlotKey.set(key, (usageBySlotKey.get(key) || 0) + 1);
    }
  }

  return usageBySlotKey;
};

// Policy: AvailabilitySlot is legacy only. Availability is computed from WorkTeam + rules + overrides - held/booked reservations.
export const getAvailability = async (input: GetAvailabilityInput, context?: ExecutionContext): Promise<AvailabilityResult> => {
  const policy = await resolvePolicy(input);
  const requiredUnits = Math.ceil(policy.durationMinutes / policy.slotGranularityMinutes);
  const usageBySlotKey = await loadBlockingUsage(policy);
  const windows = await getWindowsForDate(policy);
  const slots: AvailabilitySlotCandidate[] = [];

  for (const window of windows) {
    let cursor = localDateTime(policy.date, window.startTime, policy.timezone);
    const windowEnd = localDateTime(policy.date, window.endTime, policy.timezone);

    while (addMinutes(cursor, policy.durationMinutes).getTime() <= windowEnd.getTime()) {
      const slotKeys = buildDemoTestSlotKeys(policy.teamId, cursor, requiredUnits, policy.slotGranularityMinutes);
      const availableCapacity = slotKeys.reduce((minimum, slotKey) => {
        const remaining = window.capacity - (usageBySlotKey.get(slotKey) || 0);
        return Math.min(minimum, remaining);
      }, window.capacity);

      if (availableCapacity > 0) {
        slots.push({
          _id: buildSlotId(policy.teamId, policy.catalogOfferingId, policy.date, cursor, policy.timezone),
          businessSlug: policy.businessSlug,
          catalogOfferingId: policy.catalogOfferingId,
          teamId: policy.teamId,
          teamName: policy.team.name,
          startAt: cursor,
          endAt: addMinutes(cursor, policy.durationMinutes),
          durationMinutes: policy.durationMinutes,
          slotGranularityMinutes: policy.slotGranularityMinutes,
          requiredUnits,
          effectiveCapacity: window.capacity,
          availableCapacity,
          slotKeys,
        });
      }

      cursor = addMinutes(cursor, policy.slotGranularityMinutes);
    }
  }

  if (input.caseId) {
    await recordTimelineEvent({
      businessSlug: input.businessSlug,
      caseId: input.caseId,
      eventType: 'availability.checked',
      title: 'Availability checked',
      description: `Availability checked for ${policy.teamId} on ${policy.date}.`,
      visibility: 'internal',
      actor: { type: 'system', name: 'demo_test' },
      metadata: {
        teamId: policy.teamId,
        catalogOfferingId: policy.catalogOfferingId,
        date: policy.date,
        slots: slots.length,
      },
    }, context);
  }

  return {
    businessSlug: policy.businessSlug,
    teamId: policy.teamId,
    catalogOfferingId: policy.catalogOfferingId,
    date: policy.date,
    durationMinutes: policy.durationMinutes,
    slotGranularityMinutes: policy.slotGranularityMinutes,
    timezone: policy.timezone,
    slots,
  };
};
