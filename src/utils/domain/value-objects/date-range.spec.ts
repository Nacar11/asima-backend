import { DateRange } from '@/utils/domain/value-objects/date-range';

describe('DateRange', () => {
  it('exposes start and end', () => {
    const range = new DateRange('2026-07-01', '2026-07-05');
    expect(range.start).toBe('2026-07-01');
    expect(range.end).toBe('2026-07-05');
  });

  it('allows a single-day range (start === end)', () => {
    const range = new DateRange('2026-07-01', '2026-07-01');
    expect(range.isSingleDay()).toBe(true);
  });

  it('treats a multi-day range as not single-day', () => {
    expect(new DateRange('2026-07-01', '2026-07-03').isSingleDay()).toBe(false);
  });

  it('rejects end before start at construction (invalid range cannot exist)', () => {
    expect(() => new DateRange('2026-07-05', '2026-07-01')).toThrow();
  });

  it('rejects a malformed date', () => {
    expect(() => new DateRange('2026-7-1', '2026-07-05')).toThrow();
  });

  it('endsBefore is true when end is strictly before the given date', () => {
    const range = new DateRange('2026-06-01', '2026-06-10');
    expect(range.endsBefore('2026-06-25')).toBe(true);
    expect(range.endsBefore('2026-06-10')).toBe(false); // ends ON that day, not before
    expect(range.endsBefore('2026-06-05')).toBe(false);
  });

  it('compares by value', () => {
    expect(
      new DateRange('2026-07-01', '2026-07-05').equals(new DateRange('2026-07-01', '2026-07-05')),
    ).toBe(true);
    expect(
      new DateRange('2026-07-01', '2026-07-05').equals(new DateRange('2026-07-01', '2026-07-06')),
    ).toBe(false);
  });
});
