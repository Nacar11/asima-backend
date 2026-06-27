import { WorkWindow } from '@/work-schedules/domain/value-objects/work-window';
import { InvalidWorkWindowError } from '@/work-schedules/domain/work-schedule-errors';

describe('WorkWindow', () => {
  it('accepts expected_out strictly after expected_in', () => {
    const w = new WorkWindow('09:00:00', '18:00:00');
    expect(w.expected_in).toBe('09:00:00');
    expect(w.expected_out).toBe('18:00:00');
  });

  it('throws when expected_out equals expected_in', () => {
    expect(() => new WorkWindow('09:00:00', '09:00:00')).toThrow(InvalidWorkWindowError);
  });

  it('throws when expected_out is before expected_in', () => {
    expect(() => new WorkWindow('18:00:00', '09:00:00')).toThrow(InvalidWorkWindowError);
  });

  it('the thrown error carries the expected_out field + verbatim legacy message', () => {
    try {
      new WorkWindow('18:00:00', '09:00:00');
      throw new Error('expected WorkWindow to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidWorkWindowError);
      expect((err as InvalidWorkWindowError).field).toBe('expected_out');
      expect((err as Error).message).toBe('expected_out must be strictly after expected_in');
    }
  });
});
