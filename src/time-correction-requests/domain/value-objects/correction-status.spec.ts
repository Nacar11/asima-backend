import { CorrectionStatus } from '@/time-correction-requests/domain/value-objects/correction-status';

describe('CorrectionStatus', () => {
  it('exposes the underlying status value', () => {
    expect(new CorrectionStatus('pending_l1').value).toBe('pending_l1');
  });

  it('rejects an unknown status at construction (invalid VO cannot exist)', () => {
    expect(() => new CorrectionStatus('bogus' as never)).toThrow();
  });

  it('classifies pending states — pending_l1 | pending_l2', () => {
    expect(new CorrectionStatus('pending_l1').isPending()).toBe(true);
    expect(new CorrectionStatus('pending_l2').isPending()).toBe(true);
    expect(new CorrectionStatus('approved').isPending()).toBe(false);
    expect(new CorrectionStatus('rejected').isPending()).toBe(false);
    expect(new CorrectionStatus('cancelled').isPending()).toBe(false);
  });

  it('compares by value', () => {
    expect(new CorrectionStatus('approved').equals(new CorrectionStatus('approved'))).toBe(true);
    expect(new CorrectionStatus('approved').equals(new CorrectionStatus('rejected'))).toBe(false);
  });
});
