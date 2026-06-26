import { AllocationAmount } from '@/leave-allocations/domain/value-objects/allocation-amount';
import { InvalidAllocationAmountError } from '@/leave-allocations/domain/leave-allocation-errors';

describe('AllocationAmount', () => {
  it('accepts a positive whole number and exposes it via value', () => {
    expect(new AllocationAmount(10).value).toBe(10);
    expect(new AllocationAmount(1).value).toBe(1);
  });

  it('rejects zero (a grant must add days)', () => {
    expect(() => new AllocationAmount(0)).toThrow(InvalidAllocationAmountError);
  });

  it('rejects a negative amount (revocation is a soft-delete, never a negative grant)', () => {
    expect(() => new AllocationAmount(-3)).toThrow(InvalidAllocationAmountError);
  });

  it('rejects a fractional amount (allocations are whole days; the column is integer)', () => {
    expect(() => new AllocationAmount(2.5)).toThrow(InvalidAllocationAmountError);
  });
});
