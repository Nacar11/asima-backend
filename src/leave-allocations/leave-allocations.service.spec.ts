import { NotFoundException } from '@nestjs/common';
import { LeaveAllocationsService } from '@/leave-allocations/leave-allocations.service';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { User } from '@/users/domain/user';

describe('LeaveAllocationsService.grant', () => {
  let service: LeaveAllocationsService;
  let allocations: { create: jest.Mock };
  let users: { findById: jest.Mock };
  let balances: { forEmployee: jest.Mock };

  const actor = { id: 5 } as User;

  beforeEach(() => {
    allocations = { create: jest.fn().mockResolvedValue({ id: 1 }) };
    users = { findById: jest.fn().mockResolvedValue({ id: 12 } as User) };
    balances = { forEmployee: jest.fn() };
    service = new LeaveAllocationsService(
      allocations as unknown as BaseLeaveAllocationRepository,
      users as unknown as BaseUserRepository,
      balances as unknown as LeaveBalanceService,
    );
  });

  it('appends an admin_grant allocation stamped with granted_by', async () => {
    await service.grant(12, { leave_type: 'emergency', amount: 3, reason: 'storm' }, actor);
    expect(allocations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employee_id: 12,
        leave_type: 'emergency',
        amount: 3,
        source: 'admin_grant',
        granted_by: 5,
        reason: 'storm',
      }),
    );
  });

  it('rejects a grant to a non-existent employee', async () => {
    users.findById.mockResolvedValue(null);
    await expect(
      service.grant(999, { leave_type: 'sick', amount: 1 }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(allocations.create).not.toHaveBeenCalled();
  });
});
