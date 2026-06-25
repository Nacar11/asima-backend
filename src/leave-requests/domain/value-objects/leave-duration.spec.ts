import { LeaveDuration } from '@/leave-requests/domain/value-objects/leave-duration';

describe('LeaveDuration', () => {
  it('exposes the day count', () => {
    expect(new LeaveDuration(3).days).toBe(3);
    expect(new LeaveDuration(0.5).days).toBe(0.5);
  });

  it('recognises a half day', () => {
    expect(new LeaveDuration(0.5).isHalfDay()).toBe(true);
    expect(new LeaveDuration(1).isHalfDay()).toBe(false);
  });

  it('rejects a negative duration', () => {
    expect(() => new LeaveDuration(-1)).toThrow();
  });

  it('rejects a value that is not a multiple of 0.5', () => {
    expect(() => new LeaveDuration(0.3)).toThrow();
    expect(() => new LeaveDuration(1.25)).toThrow();
  });

  it('compares by value', () => {
    expect(new LeaveDuration(2).equals(new LeaveDuration(2))).toBe(true);
    expect(new LeaveDuration(2).equals(new LeaveDuration(2.5))).toBe(false);
  });
});
