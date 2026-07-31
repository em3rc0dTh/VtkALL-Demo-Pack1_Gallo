import { randomUUID } from 'crypto';
import { CatalogOffering } from '../models/CatalogOffering.model';
import { ResourceReservation } from '../models/ResourceReservation.model';
import { WorkTeam } from '../models/WorkTeam.model';
import { WorkTeamScheduleOverride } from '../models/WorkTeamScheduleOverride.model';
import { WorkTeamScheduleRule } from '../models/WorkTeamScheduleRule.model';

type AvailabilityWindow = {
  startTime: string;
  endTime: string;
  capacity: number;
};

export type TeamAvailabilitySlot = {
  _id: string;
  businessSlug: string;
  catalogOfferingId: string;
  teamId: string;
  teamName: string;
  startAt: Date;
  endAt: Date;
  status: 'available';
  durationMinutes: number;
  slotGranularityMinutes: number;
  requiredUnits: number;
  availableCapacity: number;
};

export type ResourceReservationInput = {
  businessSlug: string;
  catalogOfferingId: string;
  slotId: string;
  appointmentId?: string;
  customerId?: string;
  caseId?: string;
  workflowId?: string;
};

const DEFAULT_DEMO_DATES = ['2026-07-03', '2026-07-04'];
const ACTIVE_RESERVATION_STATUSES: Array<'held' | 'booked'> = ['held', 'booked'];

const pad = (value: number) => String(value).padStart(2, '0');

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

const localDateTime = (date: string, time: string) => new Date(`${date}T${time}:00.000-05:00`);

const localWeekday = (date: string) => localDateTime(date, '12:00').getUTCDay();

const formatSlotTime = (date: Date) => {
  const lima = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return lima.replace(':', '');
};

const slotKey = (teamId: string, startAt: Date) => `${teamId}:${startAt.toISOString()}`;

const slotKeysForRange = (teamId: string, startAt: Date, units: number, granularity: number) =>
  Array.from({ length: units }, (_, index) => slotKey(teamId, addMinutes(startAt, index * granularity)));

const buildSlotId = (teamId: string, catalogOfferingId: string, date: string, startAt: Date) =>
  `cap_${teamId}_${catalogOfferingId}_${date.replace(/-/g, '')}_${formatSlotTime(startAt)}`;

const parseDateFromSlotId = (slotId: string) => {
  const match = slotId.match(/_(\d{8})_\d{4}$/);
  if (!match) {
    return null;
  }
  return `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}`;
};

const getOfferingOperationalPolicy = async (businessSlug: string, catalogOfferingId: string) => {
  const offering = await CatalogOffering.findOne({ _id: catalogOfferingId, businessSlug, active: true, publicVisible: true }).lean().exec();
  if (!offering) {
    throw new Error('CATALOG_OFFERING_NOT_FOUND');
  }

  const fulfillmentPolicy = (offering as any).fulfillmentPolicy || {};
  const teamId = fulfillmentPolicy.suggestedTeamId;
  if (!teamId) {
    throw new Error('CATALOG_OFFERING_WITHOUT_TEAM');
  }

  const durationMinutes = Number(fulfillmentPolicy.estimatedDurationMinutes || 60);
  const slotGranularityMinutes = Number(fulfillmentPolicy.slotGranularityMinutes || 15);

  return {
    offering,
    teamId,
    durationMinutes,
    slotGranularityMinutes,
  };
};

const getWindowsForDate = async (businessSlug: string, teamId: string, date: string, defaultCapacity: number) => {
  const weekday = localWeekday(date);
  const rules = await WorkTeamScheduleRule.find({ businessSlug, teamId, weekday, active: true }).sort({ startTime: 1 }).lean().exec();
  const overrides = await WorkTeamScheduleOverride.find({ businessSlug, teamId, date, active: true }).sort({ createdAt: 1 }).lean().exec();

  let windows: AvailabilityWindow[] = rules.map((rule: any) => ({
    startTime: rule.startTime,
    endTime: rule.endTime,
    capacity: Number(rule.capacity || defaultCapacity),
  }));

  for (const override of overrides as any[]) {
    if (override.mode === 'block') {
      windows = [];
      continue;
    }

    const overrideWindows = (override.windows || []).map((window: any) => ({
      startTime: window.startTime,
      endTime: window.endTime,
      capacity: Number(window.capacity || defaultCapacity),
    }));

    if (override.mode === 'replace') {
      windows = overrideWindows;
    }
    if (override.mode === 'extend') {
      windows = [...windows, ...overrideWindows];
    }
  }

  return windows.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const listTeamAvailability = async (businessSlug: string, catalogOfferingId: string, preferredDate?: string) => {
  const { teamId, durationMinutes, slotGranularityMinutes } = await getOfferingOperationalPolicy(businessSlug, catalogOfferingId);
  const team = await WorkTeam.findOne({ _id: teamId, businessSlug, active: true }).lean().exec();
  if (!team) {
    throw new Error('WORK_TEAM_NOT_FOUND');
  }

  const requiredUnits = Math.ceil(durationMinutes / slotGranularityMinutes);
  const dates = preferredDate ? [preferredDate] : DEFAULT_DEMO_DATES;
  const slots: TeamAvailabilitySlot[] = [];

  for (const date of dates) {
    const dayStart = localDateTime(date, '00:00');
    const dayEnd = localDateTime(date, '23:59');
    const reservations = await ResourceReservation.find({
      businessSlug,
      teamId,
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      startAt: { $lt: dayEnd },
      endAt: { $gt: dayStart },
    }).lean().exec();

    const usageBySlotKey = new Map<string, number>();
    for (const reservation of reservations as any[]) {
      for (const key of reservation.slotKeys || []) {
        usageBySlotKey.set(key, (usageBySlotKey.get(key) || 0) + 1);
      }
    }

    const windows = await getWindowsForDate(businessSlug, teamId, date, Number((team as any).capacity || 1));
    for (const window of windows) {
      let cursor = localDateTime(date, window.startTime);
      const windowEnd = localDateTime(date, window.endTime);
      while (addMinutes(cursor, durationMinutes).getTime() <= windowEnd.getTime()) {
        const keys = slotKeysForRange(teamId, cursor, requiredUnits, slotGranularityMinutes);
        const minAvailableCapacity = keys.reduce((min, key) => {
          const available = window.capacity - (usageBySlotKey.get(key) || 0);
          return Math.min(min, available);
        }, window.capacity);

        if (minAvailableCapacity > 0) {
          slots.push({
            _id: buildSlotId(teamId, catalogOfferingId, date, cursor),
            businessSlug,
            catalogOfferingId,
            teamId,
            teamName: (team as any).name,
            startAt: cursor,
            endAt: addMinutes(cursor, durationMinutes),
            status: 'available',
            durationMinutes,
            slotGranularityMinutes,
            requiredUnits,
            availableCapacity: minAvailableCapacity,
          });
        }

        cursor = addMinutes(cursor, slotGranularityMinutes);
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
};

export const reserveTeamCapacity = async (input: ResourceReservationInput) => {
  const preferredDate = parseDateFromSlotId(input.slotId);
  if (!preferredDate) {
    throw new Error('RESOURCE_UNAVAILABLE');
  }

  const slots = await listTeamAvailability(input.businessSlug, input.catalogOfferingId, preferredDate);
  const selectedSlot = slots.find((slot) => slot._id === input.slotId);
  if (!selectedSlot) {
    throw new Error('RESOURCE_UNAVAILABLE');
  }

  const reservationId = `res_${randomUUID()}`;
  const slotKeys = slotKeysForRange(
    selectedSlot.teamId,
    selectedSlot.startAt,
    selectedSlot.requiredUnits,
    selectedSlot.slotGranularityMinutes
  );

  try {
    return await ResourceReservation.create({
      _id: reservationId,
      businessSlug: input.businessSlug,
      teamId: selectedSlot.teamId,
      catalogOfferingId: input.catalogOfferingId,
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      caseId: input.caseId,
      workflowId: input.workflowId,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      durationMinutes: selectedSlot.durationMinutes,
      slotGranularityMinutes: selectedSlot.slotGranularityMinutes,
      requiredUnits: selectedSlot.requiredUnits,
      slotKeys,
      status: 'booked',
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new Error('RESOURCE_UNAVAILABLE');
    }
    throw error;
  }
};
