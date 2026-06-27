import { ProposedPunch } from '@/time-correction-requests/domain/value-objects/proposed-punch';
import { InvalidProposedWindowError } from '@/time-correction-requests/domain/time-correction-request-errors';

describe('ProposedPunch', () => {
  const inAt = new Date('2026-06-10T09:00:00.000Z');

  it('accepts a time_out strictly after time_in', () => {
    const out = new Date('2026-06-10T17:00:00.000Z');
    const punch = new ProposedPunch(inAt, out);
    expect(punch.time_in).toBe(inAt);
    expect(punch.time_out).toBe(out);
  });

  it('accepts a null time_out (open segment)', () => {
    const punch = new ProposedPunch(inAt, null);
    expect(punch.time_in).toBe(inAt);
    expect(punch.time_out).toBeNull();
  });

  it('throws when time_out equals time_in', () => {
    expect(() => new ProposedPunch(inAt, new Date(inAt))).toThrow(InvalidProposedWindowError);
  });

  it('throws when time_out is before time_in', () => {
    const before = new Date('2026-06-10T08:00:00.000Z');
    expect(() => new ProposedPunch(inAt, before)).toThrow(InvalidProposedWindowError);
  });

  it('throws the verbatim legacy message (422 wire parity)', () => {
    expect(() => new ProposedPunch(inAt, new Date(inAt))).toThrow(
      'proposed_time_out must be strictly after proposed_time_in.',
    );
  });
});
