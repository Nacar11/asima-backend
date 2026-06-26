import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation.aggregate';
import { InvalidAllocationAmountError } from '@/leave-allocations/domain/leave-allocation-errors';

describe('LeaveAllocation.assertGrantable', () => {
  it('passes for a positive whole-day amount and returns the validated value', () => {
    expect(() => LeaveAllocation.assertGrantable(5)).not.toThrow();
    expect(LeaveAllocation.assertGrantable(5).value).toBe(5);
    expect(LeaveAllocation.assertGrantable(10).value).toBe(10);
  });

  it('rejects a non-positive amount', () => {
    expect(() => LeaveAllocation.assertGrantable(0)).toThrow(InvalidAllocationAmountError);
  });

  it('rejects a fractional amount', () => {
    expect(() => LeaveAllocation.assertGrantable(1.5)).toThrow(InvalidAllocationAmountError);
  });
});
