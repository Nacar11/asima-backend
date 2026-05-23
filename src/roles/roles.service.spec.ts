import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { BaseRoleRepository } from './persistence/base-role.repository';
import { BasePermissionRepository } from '@/permissions/persistence/base-permission.repository';
import { Role } from './domain/role';
import { ROLE_NAMES } from './roles.constants';

describe('RolesService', () => {
  let service: RolesService;
  let repo: jest.Mocked<BaseRoleRepository>;
  let permissionRepo: jest.Mocked<BasePermissionRepository>;

  const fakeRole: Role = {
    id: 99,
    name: 'SUPERVISOR',
    description: 'Field supervisor',
    permissions: [],
    created_by: 1,
    updated_by: 1,
    deleted_by: null,
    created_at: new Date('2026-05-23'),
    updated_at: new Date('2026-05-23'),
    deleted_at: null,
  };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setPermissions: jest.fn(),
      softDelete: jest.fn(),
    };
    permissionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCodes: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<BasePermissionRepository>;
    service = new RolesService(repo, permissionRepo);
  });

  describe('create', () => {
    it('rejects duplicate names with ConflictException', async () => {
      repo.findByName.mockResolvedValue(fakeRole);
      await expect(
        service.create({ name: 'SUPERVISOR', permission_ids: [], created_by: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects unknown permission_ids with UnprocessableEntityException', async () => {
      repo.findByName.mockResolvedValue(null);
      permissionRepo.findById.mockImplementation(async (id: number) =>
        id === 1 ? ({ id: 1 } as never) : null,
      );
      await expect(
        service.create({ name: 'SUPERVISOR', permission_ids: [1, 999], created_by: 1 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('creates with valid permissions', async () => {
      repo.findByName.mockResolvedValue(null);
      permissionRepo.findById.mockResolvedValue({ id: 1 } as never);
      repo.create.mockResolvedValue(fakeRole);
      const result = await service.create({
        name: 'SUPERVISOR',
        permission_ids: [1],
        created_by: 1,
      });
      expect(result).toBe(fakeRole);
      expect(repo.create).toHaveBeenCalledWith({
        name: 'SUPERVISOR',
        permission_ids: [1],
        created_by: 1,
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException for missing role', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update(404, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects rename to existing role name', async () => {
      repo.findById.mockResolvedValue(fakeRole);
      repo.findByName.mockResolvedValue({ ...fakeRole, id: 7, name: 'ADMIN' });
      await expect(service.update(99, { name: 'ADMIN' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('updates description without conflict check', async () => {
      repo.findById.mockResolvedValue(fakeRole);
      repo.update.mockResolvedValue({ ...fakeRole, description: 'New' });
      const result = await service.update(99, { description: 'New', updated_by: 2 });
      expect(result.description).toBe('New');
      expect(repo.findByName).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissions', () => {
    it('throws when role not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.assignPermissions(404, [1])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException for unknown ids', async () => {
      repo.findById.mockResolvedValue(fakeRole);
      permissionRepo.findById.mockResolvedValue(null);
      await expect(service.assignPermissions(99, [42])).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('delegates to repo.setPermissions when valid', async () => {
      repo.findById.mockResolvedValue(fakeRole);
      permissionRepo.findById.mockResolvedValue({ id: 1 } as never);
      repo.setPermissions.mockResolvedValue(fakeRole);
      const result = await service.assignPermissions(99, [1]);
      expect(result).toBe(fakeRole);
      expect(repo.setPermissions).toHaveBeenCalledWith(99, [1]);
    });
  });

  describe('softDelete', () => {
    it('blocks deletion of protected roles', async () => {
      repo.findById.mockResolvedValue({ ...fakeRole, name: ROLE_NAMES.SUPER_ADMIN });
      await expect(service.softDelete(1, 1)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes non-protected roles', async () => {
      repo.findById.mockResolvedValue(fakeRole);
      repo.softDelete.mockResolvedValue(undefined);
      await service.softDelete(99, 1);
      expect(repo.softDelete).toHaveBeenCalledWith(99, 1);
    });
  });
});
