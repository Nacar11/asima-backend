import { LeaveStatus } from '@/leave-requests/domain/value-objects/leave-status';

describe('LeaveStatus', () => {
  it('exposes the underlying status value', () => {
    expect(new LeaveStatus('pending_l1').value).toBe('pending_l1');
  });

  it('rejects an unknown status at construction (invalid VO cannot exist)', () => {
    expect(() => new LeaveStatus('bogus' as never)).toThrow();
  });

  it('classifies pending states', () => {
    expect(new LeaveStatus('pending_l1').isPending()).toBe(true);
    expect(new LeaveStatus('pending_l2').isPending()).toBe(true);
    expect(new LeaveStatus('approved').isPending()).toBe(false);
    expect(new LeaveStatus('cancelled').isPending()).toBe(false);
  });

  it('classifies active (non-terminal) states — pending or approved', () => {
    expect(new LeaveStatus('pending_l1').isActive()).toBe(true);
    expect(new LeaveStatus('approved').isActive()).toBe(true);
    expect(new LeaveStatus('rejected').isActive()).toBe(false);
    expect(new LeaveStatus('cancelled').isActive()).toBe(false);
  });

  it('compares by value', () => {
    expect(new LeaveStatus('approved').equals(new LeaveStatus('approved'))).toBe(true);
    expect(new LeaveStatus('approved').equals(new LeaveStatus('rejected'))).toBe(false);
  });
});
