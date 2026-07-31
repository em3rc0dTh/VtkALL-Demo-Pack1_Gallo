import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import { HermesNormalizedDatePreference } from './hermesSchedulingDateNormalization.service';
import { buildHermesSlotToken } from './hermesSchedulingSlotSelection.service';

type DayPart = 'morning' | 'afternoon' | 'evening';

export type HermesPublicAvailabilitySlot = {
  token: string;
  start: string;
  end: string;
};

export type HermesAvailabilityPresentation = {
  date: string;
  timezone: string;
  slots: HermesPublicAvailabilitySlot[];
  source: {
    totalAuthoritativeSlots: number;
    filter: 'none' | 'day_part' | 'not_before_time' | 'combined';
  };
};

type BuildPresentationInput = {
  businessSlug: string;
  conversationId: string;
  processContext?: AgentProcessContext;
  datePreference: Extract<HermesNormalizedDatePreference, { status: 'accepted' }>;
  maxSlots: number;
};

const formatTime = (value: Date | string, timezone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(typeof value === 'string' ? new Date(value) : value);

const isoDateInTimezone = (value: Date | string, timezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);

const slotHour = (slot: any, timezone: string) => {
  const formatted = formatTime(slot?.startAt, timezone);
  const [hour] = formatted.split(':').map(Number);
  return hour;
};

const matchesDayPart = (slot: any, dayPart: DayPart | undefined, timezone: string) => {
  if (!dayPart) return true;
  const hour = slotHour(slot, timezone);
  if (!Number.isFinite(hour)) return true;
  if (dayPart === 'morning') return hour < 12;
  if (dayPart === 'afternoon') return hour >= 12 && hour < 18;
  return hour >= 18;
};

const matchesNotBeforeTime = (slot: any, notBeforeTime: string | undefined, timezone: string) => {
  if (!notBeforeTime) return true;
  return formatTime(slot?.startAt, timezone) >= notBeforeTime;
};

export const buildHermesAvailabilityPresentation = (
  input: BuildPresentationInput
): HermesAvailabilityPresentation => {
  const rawState: any = input.processContext?.rawState || {};
  const authoritativeSlots = Array.isArray(rawState.availableSlots) ? rawState.availableSlots : [];
  const timezone = input.datePreference.timezone;
  const sameDateSlots = authoritativeSlots.filter((slot: any) => isoDateInTimezone(slot?.startAt, timezone) === input.datePreference.preferredDate);
  const filtered = sameDateSlots
    .filter((slot: any) => matchesDayPart(slot, input.datePreference.dayPart, timezone))
    .filter((slot: any) => matchesNotBeforeTime(slot, input.datePreference.notBeforeTime, timezone));
  const capped = filtered.slice(0, Math.max(1, input.maxSlots));

  const filter =
    input.datePreference.dayPart && input.datePreference.notBeforeTime
      ? 'combined'
      : input.datePreference.dayPart
        ? 'day_part'
        : input.datePreference.notBeforeTime
          ? 'not_before_time'
          : 'none';

  return {
    date: input.datePreference.preferredDate,
    timezone,
    slots: capped.map((slot: any) => ({
      token: buildHermesSlotToken({
        businessSlug: input.businessSlug,
        conversationId: input.conversationId,
        processContext: input.processContext,
        slot,
        timezone,
      }),
      start: formatTime(slot?.startAt, timezone),
      end: formatTime(slot?.endAt, timezone),
    })),
    source: {
      totalAuthoritativeSlots: sameDateSlots.length,
      filter,
    },
  };
};

const formatDateForReply = (date: string, timezone: string) => {
  const raw = new Date(`${date}T12:00:00.000Z`);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(raw);
};

export const naturalizeAvailabilityReply = (presentation: HermesAvailabilityPresentation) => {
  const friendlyDate = formatDateForReply(presentation.date, presentation.timezone);
  if (!presentation.slots.length) {
    return `No encontre horarios disponibles para ${friendlyDate}. Quieres consultar otra fecha?`;
  }
  const windows = presentation.slots.map((slot) => `${slot.start} a ${slot.end}`);
  return `Para ${friendlyDate} tengo disponibilidad de ${windows.join(' y de ')}. Estos horarios todavia no quedan reservados hasta que elijas uno. Cual te conviene mas?`;
};
