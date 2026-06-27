import { Break } from '@/work-schedules/domain/value-objects/break';
import { InvalidBreakError } from '@/work-schedules/domain/work-schedule-errors';

describe('Break', () => {
  it('accepts a zero-minute break with a null start (no break)', () => {
    const b = new Break(0, null);
    expect(b.break_minutes).toBe(0);
    expect(b.break_start).toBeNull();
    expect(b.hasBreak()).toBe(false);
  });

  it('accepts a positive break with a start time', () => {
    const b = new Break(60, '12:00:00');
    expect(b.break_minutes).toBe(60);
    expect(b.break_start).toBe('12:00:00');
    expect(b.hasBreak()).toBe(true);
  });

  it('throws InvalidBreakError keyed on break_minutes when minutes are negative', () => {
    try {
      new Break(-1, null);
      throw new Error('expected Break to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidBreakError);
      expect((err as InvalidBreakError).field).toBe('break_minutes');
      expect((err as Error).message).toBe('break_minutes must be >= 0');
    }
  });

  it('throws InvalidBreakError keyed on break_start when minutes > 0 but start is null', () => {
    try {
      new Break(30, null);
      throw new Error('expected Break to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidBreakError);
      expect((err as InvalidBreakError).field).toBe('break_start');
      expect((err as Error).message).toBe('break_start is required when break_minutes > 0');
    }
  });
});
