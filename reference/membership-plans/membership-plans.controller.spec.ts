import { Test, TestingModule } from '@nestjs/testing';
import { MembershipPlansController } from './controllers/membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { MembershipPlan } from './domain/membership-plan';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { QueryMembershipPlanDto } from './dto/query-membership-plan.dto';
import { FindAllMembershipPlan } from './domain/find-all-membership-plan';
import { User } from '@/users/domain/user';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('MembershipPlansController', () => {
  let controller: MembershipPlansController;
  let service: MembershipPlansService;

  const mockUser: User = {
    id: 1,
    email: 'admin@example.com',
    created_at: new Date(),
    updated_at: new Date(),
    system_admin: false,
    assignments: [
      {
        id: 1,
        status: 'Active',
        group: {
          id: 1,
          group_name: 'Admin',
        },
      },
    ],
  } as User;

  const mockCustomerUser: User = {
    id: 2,
    email: 'customer@example.com',
    created_at: new Date(),
    updated_at: new Date(),
    system_admin: false,
    assignments: [
      {
        id: 2,
        status: 'Active',
        group: {
          id: 2,
          group_name: 'Customer',
        },
      },
    ],
  } as User;

  const mockMembershipPlan: MembershipPlan = {
    id: 1,
    plan_code: 'starter',
    plan_name: 'Starter Plan',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockFindAllResult: FindAllMembershipPlan = {
    data: [mockMembershipPlan],
    totalCount: 1,
    skip: 0,
    take: 40,
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipPlansController],
      providers: [
        {
          provide: MembershipPlansService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MembershipPlansController>(
      MembershipPlansController,
    );
    service = module.get<MembershipPlansService>(MembershipPlansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a membership plan', async () => {
      const createDto: CreateMembershipPlanDto = {
        plan_code: 'starter',
        plan_name: 'Starter Plan',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockMembershipPlan);

      const result = await controller.create(createDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mockMembershipPlan);
    });
  });

  describe('findAll', () => {
    it('should return paginated membership plans for admin', async () => {
      const query: QueryMembershipPlanDto = {
        skip: 0,
        take: 40,
        sortBy: 'DESC',
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });

    it('should filter by plan code for admin', async () => {
      const query: QueryMembershipPlanDto = {
        plan_code: 'starter',
        skip: 0,
        take: 40,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });

    it('should return only active plans for customer', async () => {
      const query: QueryMembershipPlanDto = {
        skip: 0,
        take: 40,
        sortBy: 'DESC',
      };

      const expectedCustomerQuery = {
        ...query,
        is_active: true,
        plan_code: undefined,
        plan_name: undefined,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockCustomerUser);

      expect(service.findAll).toHaveBeenCalledWith(expectedCustomerQuery);
      expect(result).toEqual(mockFindAllResult);
    });
  });

  describe('findById', () => {
    it('should return a membership plan by ID for admin', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockMembershipPlan);

      const result = await controller.findById(1, mockUser);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMembershipPlan);
    });

    it('should return active membership plan by ID for customer', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockMembershipPlan);

      const result = await controller.findById(1, mockCustomerUser);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMembershipPlan);
    });

    it('should throw NotFoundException for customer accessing inactive plan', async () => {
      const inactivePlan = { ...mockMembershipPlan, is_active: false };
      jest.spyOn(service, 'findById').mockResolvedValue(inactivePlan);

      await expect(controller.findById(1, mockCustomerUser)).rejects.toThrow(
        'Membership plan not found',
      );
    });
  });

  describe('update', () => {
    it('should update a membership plan', async () => {
      const updateDto: UpdateMembershipPlanDto = {
        plan_name: 'Updated Starter Plan',
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockMembershipPlan);

      const result = await controller.update(1, updateDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockUser);
      expect(result).toEqual(mockMembershipPlan);
    });
  });

  describe('delete', () => {
    it('should delete a membership plan', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.delete(1, mockUser);

      expect(service.delete).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
