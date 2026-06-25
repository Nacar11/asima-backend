import { HalfDayWindow } from '@/leave-requests/domain/value-objects/half-day-window';

describe('HalfDayWindow', () => {
  it('represents a full day with no clock window', () => {
    const w = new HalfDayWindow('full', null, null);
    expect(w.isFull()).toBe(true);
    expect(w.isHalf()).toBe(false);
    expect(w.start_time).toBeNull();
    expect(w.end_time).toBeNull();
  });

  it('rejects a full day that carries a clock window', () => {
    expect(() => new HalfDayWindow('full', '09:00:00', '14:00:00')).toThrow();
  });

  it('represents a half day with a clock window', () => {
    const w = new HalfDayWindow('first_half', '09:00:00', '14:00:00');
    expect(w.isHalf()).toBe(true);
    expect(w.portion).toBe('first_half');
    expect(w.start_time).toBe('09:00:00');
    expect(w.end_time).toBe('14:00:00');
  });

  it('rejects a half day with no clock window', () => {
    expect(() => new HalfDayWindow('second_half', null, null)).toThrow();
  });

  it('rejects a half day whose window start is not before its end', () => {
    expect(() => new HalfDayWindow('first_half', '14:00:00', '09:00:00')).toThrow();
    expect(() => new HalfDayWindow('first_half', '09:00:00', '09:00:00')).toThrow();
  });
});
