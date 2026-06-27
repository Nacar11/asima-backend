import { TimeWindow } from '@/time-entries/domain/value-objects/time-window';
import { InvalidTimeWindowError } from '@/time-entries/domain/time-entry-errors';

describe('TimeWindow', () => {
  const inAt = new Date('2026-05-07T09:00:00.000Z');

  it('accepts a time_out strictly after time_in (confirmed segment)', () => {
    const out = new Date('2026-05-07T17:00:00.000Z');
    const w = new TimeWindow(inAt, out);
    expect(w.time_in).toBe(inAt);
    expect(w.time_out).toBe(out);
    expect(w.isOpen()).toBe(false);
  });

  it('accepts a null time_out (open segment) and reports isOpen()', () => {
    const w = new TimeWindow(inAt, null);
    expect(w.time_in).toBe(inAt);
    expect(w.time_out).toBeNull();
    expect(w.isOpen()).toBe(true);
  });

  it('throws when time_out equals time_in', () => {
    expect(() => new TimeWindow(inAt, new Date(inAt))).toThrow(InvalidTimeWindowError);
  });

  it('throws when time_out is before time_in', () => {
    const before = new Date('2026-05-07T08:00:00.000Z');
    expect(() => new TimeWindow(inAt, before)).toThrow(InvalidTimeWindowError);
  });

  it('the thrown error defaults to the time_out field + verbatim legacy message', () => {
    try {
      new TimeWindow(inAt, new Date(inAt));
      throw new Error('expected TimeWindow to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTimeWindowError);
      expect((err as InvalidTimeWindowError).field).toBe('time_out');
      expect((err as Error).message).toBe('time_out must be strictly after time_in');
    }
  });
});

describe('InvalidTimeWindowError', () => {
  it('derives the create/update message from the default field', () => {
    const err = new InvalidTimeWindowError();
    expect(err.field).toBe('time_out');
    expect(err.message).toBe('time_out must be strictly after time_in');
  });

  it('derives the applyCorrection message from the proposed_time_out field', () => {
    const err = new InvalidTimeWindowError('proposed_time_out');
    expect(err.field).toBe('proposed_time_out');
    expect(err.message).toBe('proposed_time_out must be strictly after proposed_time_in');
  });
});
