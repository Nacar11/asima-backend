import {
  formatTimeTo12HourPresentation,
  normalizeTimeForPresentation,
} from './booking-time-presentation.util';

describe('booking-time-presentation util', () => {
  it('normalizes end-of-day 24:00:00 values to 00:00:00 for outbound responses', () => {
    expect(normalizeTimeForPresentation('24:00:00')).toBe('00:00:00');
    expect(normalizeTimeForPresentation('24:00')).toBe('00:00:00');
  });

  it('formats end-of-day midnight as 12:00 AM', () => {
    expect(formatTimeTo12HourPresentation('24:00:00')).toBe('12:00 AM');
    expect(formatTimeTo12HourPresentation('00:00:00')).toBe('12:00 AM');
  });

  it('keeps daytime times stable while padding seconds for display responses', () => {
    expect(normalizeTimeForPresentation('11:00')).toBe('11:00:00');
    expect(formatTimeTo12HourPresentation('23:00:00')).toBe('11:00 PM');
  });
});
