import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EdistrictService } from '@/discovery/edistrict.service';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { EdistrictMembershipPlanPermissionEntity } from '@/discovery/persistence/entities/edistrict-membership-plan-permission.entity';
import { MembershipPlanEntity } from '@/membership-plans/persistence/entities/membership-plan.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';

const mockEdistrictRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockPermissionRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockMembershipPlanRepository = () => ({
  findOne: jest.fn(),
});

const mockMembershipRepository = () => ({
  findOne: jest.fn(),
});

// Helper: build a minimal EdistrictEntity
function makeEdistrict(
  overrides: Partial<EdistrictEntity> = {},
): EdistrictEntity {
  return {
    id: 1,
    key: 'anjo-world',
    name: 'Anjo World',
    subtitle: null,
    store_name: null,
    seller_id: null,
    image_url: null,
    status: 'active',
    display_order: 0,
    deleted_at: null,
    ...overrides,
  } as EdistrictEntity;
}

// Helper: build a minimal permission entity
function makePermission(
  overrides: Partial<EdistrictMembershipPlanPermissionEntity> = {},
): EdistrictMembershipPlanPermissionEntity {
  return {
    id: 1,
    edistrict_id: 1,
    membership_plan_id: 10,
    created_by: null,
    deleted_at: null,
    membership_plan: {
      id: 10,
      plan_code: 'MEMBER_PLAN',
      plan_name: 'Member Plan',
    } as MembershipPlanEntity,
    ...overrides,
  } as EdistrictMembershipPlanPermissionEntity;
}

describe('EdistrictService', () => {
  let service: EdistrictService;
  let edistrictRepo: ReturnType<typeof mockEdistrictRepository>;
  let permissionRepo: ReturnType<typeof mockPermissionRepository>;
  let membershipPlanRepo: ReturnType<typeof mockMembershipPlanRepository>;
  let membershipRepo: ReturnType<typeof mockMembershipRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EdistrictService,
        {
          provide: getRepositoryToken(EdistrictEntity),
          useFactory: mockEdistrictRepository,
        },
        {
          provide: getRepositoryToken(EdistrictMembershipPlanPermissionEntity),
          useFactory: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(MembershipPlanEntity),
          useFactory: mockMembershipPlanRepository,
        },
        {
          provide: getRepositoryToken(MembershipEntity),
          useFactory: mockMembershipRepository,
        },
      ],
    }).compile();

    service = module.get(EdistrictService);
    edistrictRepo = module.get(getRepositoryToken(EdistrictEntity));
    permissionRepo = module.get(
      getRepositoryToken(EdistrictMembershipPlanPermissionEntity),
    );
    membershipPlanRepo = module.get(getRepositoryToken(MembershipPlanEntity));
    membershipRepo = module.get(getRepositoryToken(MembershipEntity));
  });

  // ─── findVisibleEdistricts ───────────────────────────────────────────────────

  describe('findVisibleEdistricts', () => {
    it('should return empty array when no active edistricts exist', async () => {
      edistrictRepo.find.mockResolvedValue([]);

      const result = await service.findVisibleEdistricts(null);

      expect(result).toEqual([]);
      expect(permissionRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return all active edistricts when none have permissions (public)', async () => {
      const edistricts = [
        makeEdistrict({ id: 1 }),
        makeEdistrict({ id: 2, key: 'tambayan-district' }),
      ];
      edistrictRepo.find.mockResolvedValue(edistricts);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findVisibleEdistricts(null);

      expect(result).toHaveLength(2);
    });

    it('should hide member-only edistrict from unauthenticated user', async () => {
      const publicEdistrict = makeEdistrict({ id: 1, key: 'anjo-world' });
      const memberEdistrict = makeEdistrict({
        id: 2,
        key: 'tambayan-district',
      });
      edistrictRepo.find.mockResolvedValue([publicEdistrict, memberEdistrict]);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ edistrict_id: 2, membership_plan_id: 10 }]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findVisibleEdistricts(null);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('anjo-world');
    });

    it('should hide member-only edistrict from authenticated user without matching membership', async () => {
      const publicEdistrict = makeEdistrict({ id: 1, key: 'anjo-world' });
      const memberEdistrict = makeEdistrict({
        id: 2,
        key: 'tambayan-district',
      });
      edistrictRepo.find.mockResolvedValue([publicEdistrict, memberEdistrict]);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ edistrict_id: 2, membership_plan_id: 10 }]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);

      // User has membership plan 99, but edistrict requires plan 10
      membershipRepo.findOne.mockResolvedValue({
        membership_plan_id: 99,
        status: MembershipStatusEnum.ACTIVE,
      });

      const result = await service.findVisibleEdistricts(42);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('anjo-world');
    });

    it('should show member-only edistrict to user with matching active membership', async () => {
      const publicEdistrict = makeEdistrict({ id: 1, key: 'anjo-world' });
      const memberEdistrict = makeEdistrict({
        id: 2,
        key: 'tambayan-district',
      });
      edistrictRepo.find.mockResolvedValue([publicEdistrict, memberEdistrict]);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ edistrict_id: 2, membership_plan_id: 10 }]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);

      membershipRepo.findOne.mockResolvedValue({
        membership_plan_id: 10,
        status: MembershipStatusEnum.ACTIVE,
      });

      const result = await service.findVisibleEdistricts(42);

      expect(result).toHaveLength(2);
    });

    it('should not query membership when user is null', async () => {
      edistrictRepo.find.mockResolvedValue([makeEdistrict()]);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findVisibleEdistricts(null);

      expect(membershipRepo.findOne).not.toHaveBeenCalled();
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateEdistrictDto = {
      key: 'anjo-world',
      name: 'Anjo World',
      display_order: 1,
    };

    it('should create and return a new edistrict with empty permissions', async () => {
      edistrictRepo.findOne.mockResolvedValue(null);
      const created = makeEdistrict({
        id: 5,
        key: dto.key,
        name: dto.name,
        display_order: 1,
      });
      edistrictRepo.create.mockReturnValue(created);
      edistrictRepo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(edistrictRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'anjo-world',
          name: 'Anjo World',
          status: 'active',
        }),
      );
      expect(result.id).toBe(5);
      expect(result.permissions).toEqual([]);
    });

    it('should default display_order to 0 when not provided', async () => {
      const dtoNoOrder = {
        key: 'test-key',
        name: 'Test',
      } as CreateEdistrictDto;
      edistrictRepo.findOne.mockResolvedValue(null);
      const created = makeEdistrict({ display_order: 0 });
      edistrictRepo.create.mockReturnValue(created);
      edistrictRepo.save.mockResolvedValue(created);

      await service.create(dtoNoOrder);

      expect(edistrictRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ display_order: 0 }),
      );
    });

    it('should set optional fields to null when not provided', async () => {
      edistrictRepo.findOne.mockResolvedValue(null);
      const created = makeEdistrict();
      edistrictRepo.create.mockReturnValue(created);
      edistrictRepo.save.mockResolvedValue(created);

      await service.create({
        key: 'anjo-world',
        name: 'Anjo World',
      } as CreateEdistrictDto);

      expect(edistrictRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtitle: null,
          store_name: null,
          seller_id: null,
          image_url: null,
        }),
      );
    });

    it('should throw ConflictException when key already exists', async () => {
      edistrictRepo.findOne.mockResolvedValue(makeEdistrict());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update provided fields and return updated edistrict with permissions', async () => {
      edistrictRepo.findOne
        .mockResolvedValueOnce(makeEdistrict({ id: 1, key: 'old-key' })) // existence check
        .mockResolvedValueOnce(null) // duplicate key check
        .mockResolvedValueOnce(
          makeEdistrict({ id: 1, key: 'new-key', name: 'Updated' }),
        ); // re-fetch
      edistrictRepo.update.mockResolvedValue(undefined);
      permissionRepo.find.mockResolvedValue([makePermission()]);

      const result = await service.update(1, {
        key: 'new-key',
        name: 'Updated',
      });

      expect(edistrictRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ key: 'new-key', name: 'Updated' }),
      );
      expect(result.key).toBe('new-key');
      expect(result.permissions).toHaveLength(1);
    });

    it('should skip duplicate key check when key is unchanged', async () => {
      edistrictRepo.findOne
        .mockResolvedValueOnce(makeEdistrict({ id: 1, key: 'same-key' }))
        .mockResolvedValueOnce(makeEdistrict({ id: 1, key: 'same-key' }));
      edistrictRepo.update.mockResolvedValue(undefined);
      permissionRepo.find.mockResolvedValue([]);

      await service.update(1, { key: 'same-key' });

      // findOne called twice: existence check + re-fetch (no duplicate check since key unchanged)
      expect(edistrictRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when edistrict does not exist', async () => {
      edistrictRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new key is already taken', async () => {
      edistrictRepo.findOne
        .mockResolvedValueOnce(makeEdistrict({ id: 1, key: 'old-key' }))
        .mockResolvedValueOnce(makeEdistrict({ id: 2, key: 'taken-key' })); // duplicate found

      await expect(service.update(1, { key: 'taken-key' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should only update fields that are explicitly provided', async () => {
      edistrictRepo.findOne
        .mockResolvedValueOnce(makeEdistrict({ id: 1 }))
        .mockResolvedValueOnce(makeEdistrict({ id: 1 }));
      edistrictRepo.update.mockResolvedValue(undefined);
      permissionRepo.find.mockResolvedValue([]);

      await service.update(1, { name: 'Only Name Changed' });

      expect(edistrictRepo.update).toHaveBeenCalledWith(1, {
        name: 'Only Name Changed',
      });
    });
  });

  // ─── findAllForAdmin ─────────────────────────────────────────────────────────

  describe('findAllForAdmin', () => {
    it('should return all edistricts with embedded permissions', async () => {
      edistrictRepo.find.mockResolvedValue([makeEdistrict({ id: 1 })]);
      permissionRepo.find.mockResolvedValue([makePermission()]);

      const result = await service.findAllForAdmin();

      expect(result).toHaveLength(1);
      expect(result[0].permissions).toHaveLength(1);
      expect(result[0].permissions[0].plan_code).toBe('MEMBER_PLAN');
    });

    it('should return empty permissions array when edistrict has none', async () => {
      edistrictRepo.find.mockResolvedValue([makeEdistrict({ id: 1 })]);
      permissionRepo.find.mockResolvedValue([]);

      const result = await service.findAllForAdmin();

      expect(result[0].permissions).toEqual([]);
    });

    it('should return empty array when no edistricts exist', async () => {
      edistrictRepo.find.mockResolvedValue([]);

      const result = await service.findAllForAdmin();

      expect(result).toEqual([]);
      expect(permissionRepo.find).not.toHaveBeenCalled();
    });

    it('should use empty string fallbacks when membership_plan relation is null', async () => {
      edistrictRepo.find.mockResolvedValue([makeEdistrict({ id: 1 })]);
      const permWithNoPlan = makePermission({ membership_plan: null as never });
      permissionRepo.find.mockResolvedValue([permWithNoPlan]);

      const result = await service.findAllForAdmin();

      expect(result[0].permissions[0].plan_code).toBe('');
      expect(result[0].permissions[0].plan_name).toBe('');
    });
  });

  // ─── updateStatus ────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update edistrict status to inactive', async () => {
      edistrictRepo.findOne.mockResolvedValue(
        makeEdistrict({ id: 1, status: 'active' }),
      );
      edistrictRepo.update.mockResolvedValue(undefined);

      await service.updateStatus(1, 'inactive');

      expect(edistrictRepo.update).toHaveBeenCalledWith(1, {
        status: 'inactive',
      });
    });

    it('should throw NotFoundException when edistrict does not exist', async () => {
      edistrictRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'inactive')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── addPermission ───────────────────────────────────────────────────────────

  describe('addPermission', () => {
    it('should create a new permission when none exists', async () => {
      edistrictRepo.findOne.mockResolvedValue(makeEdistrict());
      membershipPlanRepo.findOne.mockResolvedValue({ id: 10 });
      permissionRepo.findOne.mockResolvedValue(null);
      permissionRepo.create.mockReturnValue({
        edistrict_id: 1,
        membership_plan_id: 10,
        created_by: 5,
      });
      permissionRepo.save.mockResolvedValue(undefined);

      await service.addPermission(1, 10, 5);

      expect(permissionRepo.create).toHaveBeenCalledWith({
        edistrict_id: 1,
        membership_plan_id: 10,
        created_by: 5,
      });
      expect(permissionRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when edistrict does not exist', async () => {
      edistrictRepo.findOne.mockResolvedValue(null);

      await expect(service.addPermission(999, 10, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when membership plan does not exist', async () => {
      edistrictRepo.findOne.mockResolvedValue(makeEdistrict());
      membershipPlanRepo.findOne.mockResolvedValue(null);

      await expect(service.addPermission(1, 999, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when permission already exists', async () => {
      edistrictRepo.findOne.mockResolvedValue(makeEdistrict());
      membershipPlanRepo.findOne.mockResolvedValue({ id: 10 });
      permissionRepo.findOne.mockResolvedValue(makePermission());

      await expect(service.addPermission(1, 10, 5)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removePermission ────────────────────────────────────────────────────────

  describe('removePermission', () => {
    it('should soft-delete the permission', async () => {
      permissionRepo.findOne.mockResolvedValue(makePermission({ id: 7 }));
      permissionRepo.softDelete.mockResolvedValue(undefined);

      await service.removePermission(1, 10);

      expect(permissionRepo.softDelete).toHaveBeenCalledWith(7);
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.removePermission(1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
