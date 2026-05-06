const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const padTimePart = (value: number): string =>
  value.toString().padStart(2, '0');

const parseTimeParts = (
  value: string,
): { hours: number; minutes: number; seconds: number } | null => {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  if (hours === 24) {
    if (minutes === 0 && seconds === 0) {
      return { hours: 0, minutes, seconds };
    }
    return null;
  }

  if (hours < 0 || hours > 23) {
    return null;
  }

  return { hours, minutes, seconds };
};

export function normalizeTimeForPresentation(time: string): string;
export function normalizeTimeForPresentation(
  time: string | null,
): string | null;
export function normalizeTimeForPresentation(
  time: string | undefined,
): string | undefined;
export function normalizeTimeForPresentation(
  time: string | null | undefined,
): string | null | undefined {
  if (time === null || time === undefined) {
    return time;
  }

  const trimmed = time.trim();
  if (!trimmed) {
    return trimmed;
  }

  const parsed = parseTimeParts(trimmed);
  if (!parsed) {
    return trimmed;
  }

  return `${padTimePart(parsed.hours)}:${padTimePart(parsed.minutes)}:${padTimePart(parsed.seconds)}`;
}

export function formatTimeTo12HourPresentation(
  time: string | null | undefined,
): string {
  if (time === null || time === undefined) {
    return '';
  }

  const normalized = normalizeTimeForPresentation(time);
  if (typeof normalized !== 'string' || !normalized) {
    return normalized ?? '';
  }

  const parsed = parseTimeParts(normalized);
  if (!parsed) {
    return normalized;
  }

  const suffix = parsed.hours >= 12 ? 'PM' : 'AM';
  const hours12 = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
  return `${hours12}:${padTimePart(parsed.minutes)} ${suffix}`;
}
