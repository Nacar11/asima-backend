import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';

describe('LeaveBalanceService.forEmployee', () => {
  let service: LeaveBalanceService;
  let allocations: { sumsByEmployee: jest.Mock };
  let requests: { workingDaySumsByEmployee: jest.Mock };

  beforeEach(() => {
    allocations = { sumsByEmployee: jest.fn() };
    requests = { workingDaySumsByEmployee: jest.fn() };
    service = new LeaveBalanceService(
      allocations as unknown as BaseLeaveAllocationRepository,
      requests as unknown as BaseLeaveRequestRepository,
    );
  });

  it('returns exactly one row per leave type, including zero-grant types (C2)', async () => {
    allocations.sumsByEmployee.mockResolvedValue({ vacation: 10, sick: 10 });
    requests.workingDaySumsByEmployee.mockResolvedValue({ vacation: { used: 3, reserved: 2 } });

    const balances = await service.forEmployee(12);

    expect(balances.map((b) => b.leave_type).sort()).toEqual(
      ['bereavement', 'birthday', 'emergency', 'sick', 'vacation'].sort(),
    );
  });

  it('computes available = allowance − used − reserved', async () => {
    allocations.sumsByEmployee.mockResolvedValue({ vacation: 10, sick: 10 });
    requests.workingDaySumsByEmployee.mockResolvedValue({ vacation: { used: 3, reserved: 2 } });

    const balances = await service.forEmployee(12);
    const vacation = balances.find((b) => b.leave_type === 'vacation')!;
    expect(vacation).toMatchObject({ allowance: 10, used: 3, reserved: 2, available: 5 });
  });

  it('defaults a type with no grants and no requests to all zeros', async () => {
    allocations.sumsByEmployee.mockResolvedValue({ vacation: 10, sick: 10 });
    requests.workingDaySumsByEmployee.mockResolvedValue({});

    const balances = await service.forEmployee(12);
    const birthday = balances.find((b) => b.leave_type === 'birthday')!;
    expect(birthday).toMatchObject({ allowance: 0, used: 0, reserved: 0, available: 0 });
    const sick = balances.find((b) => b.leave_type === 'sick')!;
    expect(sick).toMatchObject({ allowance: 10, used: 0, reserved: 0, available: 10 });
  });

  it('floors available at 0 (never negative)', async () => {
    allocations.sumsByEmployee.mockResolvedValue({ vacation: 2 });
    requests.workingDaySumsByEmployee.mockResolvedValue({ vacation: { used: 3, reserved: 0 } });

    const balances = await service.forEmployee(12);
    const vacation = balances.find((b) => b.leave_type === 'vacation')!;
    expect(vacation.available).toBe(0);
  });
});
