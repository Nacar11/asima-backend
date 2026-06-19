/**
 * Wall-clock conversions for the zero-padded `HH:MM[:SS]` time-of-day
 * strings used by work schedules and the half-day leave window. Pure,
 * timezone-free seconds-of-day arithmetic.
 */

/** Seconds-of-day for a zero-padded `HH:MM` or `HH:MM:SS` string. */
export function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}

/** Seconds-of-day back to `HH:MM:SS`. */
export function toClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}
