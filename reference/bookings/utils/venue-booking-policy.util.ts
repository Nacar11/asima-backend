import { ServiceTypeEnum } from '@/services/enums/service-type.enum';

const DEFAULT_MINIMUM_VENUE_BOOKING_MINUTES = 180;

const parsePositiveInt = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : null;
};

const formatDurationLabel = (minutes: number): string => {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minutes`;
};

const getConfiguredVenueMinimumMinutes = (): number => {
  // Local/test override only. Production always enforces 3 hours.
  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_MINIMUM_VENUE_BOOKING_MINUTES;
  }

  const override = parsePositiveInt(process.env.VENUE_MINIMUM_BOOKING_MINUTES);
  // Development fallback is 30 minutes to simplify local testing.
  return override ?? 30;
};

export const MINIMUM_VENUE_BOOKING_MINUTES = getConfiguredVenueMinimumMinutes();

export const VENUE_MINIMUM_DURATION_ERROR_MESSAGE = `Venue bookings require at least ${formatDurationLabel(MINIMUM_VENUE_BOOKING_MINUTES)}.`;
export const VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE =
  'Venue bookings cannot be cancelled.';
export const VENUE_DISPUTE_NOT_ALLOWED_ERROR_MESSAGE =
  'Venue bookings are not eligible for dispute.';
export const VENUE_REFUND_NOT_ALLOWED_ERROR_MESSAGE =
  'Venue bookings are not eligible for refund.';

/**
 * Supports HH:mm and HH:mm:ss inputs.
 */
export function parseTimeToMinutes(time: string | null | undefined): number {
  if (!time || typeof time !== 'string') {
    return NaN;
  }

  const match = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return NaN;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;

  // Allow end-of-day boundary when provided as 24:00[:00].
  if (hours === 24) {
    if (minutes === 0 && seconds === 0) {
      return 24 * 60;
    }
    return NaN;
  }

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes + seconds / 60;
}

export function getDurationMinutes(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    return NaN;
  }

  return endMinutes - startMinutes;
}

export function meetsVenueMinimumDuration(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): boolean {
  const durationMinutes = getDurationMinutes(startTime, endTime);
  return (
    Number.isFinite(durationMinutes) &&
    durationMinutes >= MINIMUM_VENUE_BOOKING_MINUTES
  );
}

export function isVenueServiceType(
  serviceType: string | ServiceTypeEnum | null | undefined,
): boolean {
  return serviceType === ServiceTypeEnum.VENUE;
}
