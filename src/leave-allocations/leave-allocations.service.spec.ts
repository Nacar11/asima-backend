import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { LeaveAllocationsService } from '@/leave-allocations/leave-allocations.service';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveAllocationGranted } from '@/leave-allocations/domain/events/leave-allocation-events';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { User } from '@/users/domain/user';

describe('LeaveAllocationsService.grant', () => {
  let service: LeaveAllocationsService;
  let allocations: { create: jest.Mock };
  let users: { findById: jest.Mock };
  let balances: { forEmployee: jest.Mock };
  let publisher: { publish: jest.Mock };

  const actor = { id: 5 } as User;

  beforeEach(() => {
    allocations = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        employee_id: 12,
        leave_type: 'emergency',
        amount: 3,
        source: 'admin_grant',
        granted_by: 5,
      }),
    };
    users = { findById: jest.fn().mockResolvedValue({ id: 12 } as User) };
    balances = { forEmployee: jest.fn() };
    publisher = { publish: jest.fn() };
    service = new LeaveAllocationsService(
      allocations as unknown as BaseLeaveAllocationRepository,
      users as unknown as BaseUserRepository,
      balances as unknown as LeaveBalanceService,
      publisher as unknown as DomainEventPublisher,
    );
  });

  it('appends an admin_grant allocation stamped with granted_by and created_by', async () => {
    await service.grant(12, { leave_type: 'emergency', amount: 3, reason: 'storm' }, actor);
    expect(allocations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employee_id: 12,
        leave_type: 'emergency',
        amount: 3,
        source: 'admin_grant',
        granted_by: 5,
        created_by: 5,
        reason: 'storm',
      }),
    );
  });

  it('publishes LeaveAllocationGranted with the persisted id after the grant commits', async () => {
    await service.grant(12, { leave_type: 'emergency', amount: 3 }, actor);

    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [events] = publisher.publish.mock.calls[0] as [unknown[]];
    expect(events).toHaveLength(1);
    const event = events[0] as LeaveAllocationGranted;
    expect(event).toBeInstanceOf(LeaveAllocationGranted);
    expect(event).toMatchObject({
      name: 'allocation.granted',
      allocation_id: 1, // the insert-generated id, unknowable before persist
      employee_id: 12,
      leave_type: 'emergency',
      amount: 3,
      source: 'admin_grant',
      granted_by: 5,
    });
  });

  it('rejects a grant to a non-existent employee (no write, no event)', async () => {
    users.findById.mockResolvedValue(null);
    await expect(
      service.grant(999, { leave_type: 'sick', amount: 1 }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(allocations.create).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('maps an invalid amount to a 422 via the aggregate guard (reachable only in a unit test; the DTO @Min(1) rejects first over HTTP — also 422; S5)', async () => {
    await expect(
      service.grant(12, { leave_type: 'vacation', amount: 0 }, actor),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(allocations.create).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
