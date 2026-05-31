import { UsersService } from '@/users/users.service';
import { BaseUserRepository } from '@/users/persistence/base-user.repository';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { User } from '@/users/domain/user';

describe('UsersService.create — default leave allocations', () => {
  let service: UsersService;
  let users: jest.Mocked<BaseUserRepository>;
  let roles: jest.Mocked<BaseRoleRepository>;
  let allocations: jest.Mocked<BaseLeaveAllocationRepository>;

  beforeEach(() => {
    users = {
      existsByEmail: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockResolvedValue({ id: 99 } as User),
    } as unknown as jest.Mocked<BaseUserRepository>;
    roles = {
      findById: jest.fn().mockResolvedValue({ id: 3, name: 'EMPLOYEE' }),
    } as unknown as jest.Mocked<BaseRoleRepository>;
    allocations = {
      create: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<BaseLeaveAllocationRepository>;
    service = new UsersService(users, roles, allocations);
  });

  const input = {
    email: 'New@Example.com',
    password: 'Asima@1234',
    first_name: 'new',
    last_name: 'hire',
    role_id: 3,
  };

  it('grants the new user 10 vacation + 10 sick default allocations', async () => {
    await service.create(input);

    expect(allocations.create).toHaveBeenCalledTimes(2);
    expect(allocations.create).toHaveBeenCalledWith(
      expect.objectContaining({ employee_id: 99, leave_type: 'vacation', amount: 10, source: 'default' }),
    );
    expect(allocations.create).toHaveBeenCalledWith(
      expect.objectContaining({ employee_id: 99, leave_type: 'sick', amount: 10, source: 'default' }),
    );
  });

  it('does not grant allocations when user creation is rejected (duplicate email)', async () => {
    users.existsByEmail.mockResolvedValue(true);
    await expect(service.create(input)).rejects.toThrow();
    expect(allocations.create).not.toHaveBeenCalled();
  });
});
