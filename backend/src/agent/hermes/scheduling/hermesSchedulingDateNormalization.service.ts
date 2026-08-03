const DEFAULT_TIMEZONE = 'America/Lima';
const MAX_HORIZON_DAYS = 30;

type DayPart = 'morning' | 'afternoon' | 'evening';

export type HermesNormalizedDatePreference =
  | {
      status: 'accepted';
      timezone: string;
      preferredDate: string;
      notBeforeTime?: string;
      dayPart?: DayPart;
      rawText: string;
    }
  | {
      status: 'clarification_required';
      timezone: string;
      code: 'AMBIGUOUS_DATE' | 'DATE_REQUIRED';
      message: string;
      rawText: string;
      notBeforeTime?: string;
      dayPart?: DayPart;
    }
  | {
      status: 'rejected';
      timezone: string;
      code: 'PAST_DATE' | 'DATE_OUT_OF_HORIZON';
      message: string;
      rawText: string;
      preferredDate?: string;
      notBeforeTime?: string;
      dayPart?: DayPart;
    };

type NormalizeInput = {
  message: string;
  timezone?: string;
  now?: Date;
  maxHorizonDays?: number;
};

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isoDateInTimezone = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().slice(0, 10);
};

const diffDays = (fromIso: string, toIso: string) => {
  const from = new Date(`${fromIso}T12:00:00.000Z`);
  const to = new Date(`${toIso}T12:00:00.000Z`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
};

const weekdayOffsets: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const monthNumbers: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const pad = (value: number) => String(value).padStart(2, '0');

const parseDayPart = (message: string): DayPart | undefined => {
  const normalized = normalize(message);
  if (/\bmanana\b/.test(normalized)) return 'morning';
  if (/\btarde\b/.test(normalized)) return 'afternoon';
  if (/\bnoche\b/.test(normalized)) return 'evening';
  return undefined;
};

const parseNotBeforeTime = (message: string) => {
  const normalized = normalize(message);
  const explicit = normalized.match(/\b(?:despues de|desde|a partir de)\s+las?\s+(\d{1,2})(?::(\d{2}))?\b/);
  if (!explicit) return undefined;
  const hour = Number(explicit[1]);
  const minute = Number(explicit[2] || '0');
  if (!Number.isFinite(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;
  return `${pad(hour)}:${pad(minute)}`;
};

const nextWeekdayDate = (weekdayName: string, todayIso: string, allowSameDay: boolean) => {
  const targetDay = weekdayOffsets[weekdayName];
  if (targetDay === undefined) return undefined;
  const [year, month, day] = todayIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const currentDay = date.getUTCDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0 || (!allowSameDay && daysToAdd === 0)) {
    daysToAdd += 7;
  }
  return addDays(todayIso, daysToAdd);
};

const parseExplicitDate = (message: string, todayIso: string) => {
  const normalized = normalize(message);

  const isoMatch = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const slashMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3] || todayIso.slice(0, 4));
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const namedMonth = normalized.match(/\b(?:el\s+)?(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(20\d{2}))?\b/);
  if (namedMonth) {
    const day = Number(namedMonth[1]);
    const month = monthNumbers[namedMonth[2]];
    const year = Number(namedMonth[3] || todayIso.slice(0, 4));
    if (month) return `${year}-${pad(month)}-${pad(day)}`;
  }

  for (const weekdayName of Object.keys(weekdayOffsets)) {
    const hasWeekday = new RegExp(`\\b(?:(?:este|proximo|siguiente)\\s+)?${weekdayName}\\b|\\b${weekdayName}\\s+(?:proximo|siguiente|que\\s+viene)\\b`).test(normalized);
    if (!hasWeekday) continue;
    const allowSameDay = /\beste\s+/.test(normalized);
    return nextWeekdayDate(weekdayName, todayIso, allowSameDay);
  }

  if (/\bhoy\b/.test(normalized)) return todayIso;
  if (/\bmanana\b/.test(normalized) && !/\bpor la manana\b/.test(normalized)) return addDays(todayIso, 1);

  return undefined;
};

const isAmbiguousDateRequest = (message: string) => {
  const normalized = normalize(message);
  return /\balgun dia\b/.test(normalized)
    || /\bla proxima semana\b/.test(normalized)
    || /\bdespues\b/.test(normalized)
    || /\bcuando puedan\b/.test(normalized);
};

export const normalizeHermesDatePreference = (input: NormalizeInput): HermesNormalizedDatePreference => {
  const timezone = input.timezone || DEFAULT_TIMEZONE;
  const now = input.now || new Date();
  const maxHorizonDays = Number.isFinite(input.maxHorizonDays) ? Math.max(1, Math.trunc(input.maxHorizonDays!)) : MAX_HORIZON_DAYS;
  const message = String(input.message || '').trim();
  const todayIso = isoDateInTimezone(now, timezone);
  const dayPart = parseDayPart(message);
  const notBeforeTime = parseNotBeforeTime(message);

  if (isAmbiguousDateRequest(message)) {
    return {
      status: 'clarification_required',
      timezone,
      code: 'AMBIGUOUS_DATE',
      message: 'Puedo revisar horarios, pero necesito una fecha mas concreta.',
      rawText: message,
      ...(dayPart ? { dayPart } : {}),
      ...(notBeforeTime ? { notBeforeTime } : {}),
    };
  }

  const preferredDate = parseExplicitDate(message, todayIso);
  if (!preferredDate) {
    return {
      status: 'clarification_required',
      timezone,
      code: 'DATE_REQUIRED',
      message: 'Puedo revisar horarios, pero necesito que me indiques el dia.',
      rawText: message,
      ...(dayPart ? { dayPart } : {}),
      ...(notBeforeTime ? { notBeforeTime } : {}),
    };
  }

  const offset = diffDays(todayIso, preferredDate);
  if (offset < 0) {
    return {
      status: 'rejected',
      timezone,
      code: 'PAST_DATE',
      message: 'La fecha solicitada ya paso en la zona horaria del negocio.',
      rawText: message,
      preferredDate,
      ...(dayPart ? { dayPart } : {}),
      ...(notBeforeTime ? { notBeforeTime } : {}),
    };
  }

  if (offset > maxHorizonDays) {
    return {
      status: 'rejected',
      timezone,
      code: 'DATE_OUT_OF_HORIZON',
      message: 'La fecha solicitada esta fuera del horizonte permitido para consultar disponibilidad.',
      rawText: message,
      preferredDate,
      ...(dayPart ? { dayPart } : {}),
      ...(notBeforeTime ? { notBeforeTime } : {}),
    };
  }

  return {
    status: 'accepted',
    timezone,
    preferredDate,
    rawText: message,
    ...(dayPart ? { dayPart } : {}),
    ...(notBeforeTime ? { notBeforeTime } : {}),
  };
};
