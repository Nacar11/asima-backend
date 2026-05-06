import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekOfYear from 'dayjs/plugin/weekOfYear';

// Constants
const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Manila';
// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(timezone);
dayjs.tz.setDefault(DEFAULT_TIMEZONE);

export const toTimezoneDate = (utcDate: Date | string) => {
  return dayjs.utc(utcDate).tz(DEFAULT_TIMEZONE);
};

export const getCurrentTimezone = (date?: Date | string, tz?: string) => {
  return date
    ? dayjs(date).tz(tz || DEFAULT_TIMEZONE)
    : dayjs().tz(tz || DEFAULT_TIMEZONE);
};

export const getUTCDate = (date?: Date | string) => {
  return date ? dayjs(date).utc() : dayjs().utc();
};
