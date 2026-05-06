import { Test, TestingModule } from '@nestjs/testing';
import { MembershipBillingPeriodsController } from './controllers/membership-billing-periods.controller';
import { MembershipBillingPeriodsService } from './membership-billing-periods.service';
import { MembershipBillingPeriod } from './domain/membership-billing-period';
import { CreateMembershipBillingPeriodDto } from './dto/create-membership-billing-period.dto';
import { UpdateMembershipBillingPeriodDto } from './dto/update-membership-billing-period.dto';
import { QueryMembershipBillingPeriodDto } from './dto/query-membership-billing-period.dto';
import { FindAllMembershipBillingPeriod } from './domain/find-all-membership-billing-period';
import { User } from '@/users/domain/user';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('MembershipBillingPeriodsController', () => {
  let controller: MembershipBillingPeriodsController;
  let service: MembershipBillingPeriodsService;

  const mockAdminUser: User = {
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

  const mockBillingPeriod: MembershipBillingPeriod = {
    id: 1,
    period_code: 'monthly',
    period_name: 'Monthly',
    duration_in_months: 1,
    duration_in_days: 30,
    sort_order: 0,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockFindAllResult: FindAllMembershipBillingPeriod = {
    data: [mockBillingPeriod],
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
      controllers: [MembershipBillingPeriodsController],
      providers: [
        {
          provide: MembershipBillingPeriodsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MembershipBillingPeriodsController>(
      MembershipBillingPeriodsController,
    );
    service = module.get<MembershipBillingPeriodsService>(
      MembershipBillingPeriodsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a membership billing period', async () => {
      const createDto: CreateMembershipBillingPeriodDto = {
        period_code: 'monthly',
        period_name: 'Monthly',
        duration_in_months: 1,
        duration_in_days: 30,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockBillingPeriod);

      const result = await controller.create(createDto, mockAdminUser);

      expect(service.create).toHaveBeenCalledWith(createDto, mockAdminUser);
      expect(result).toEqual(mockBillingPeriod);
    });
  });

  describe('findAll', () => {
    it('should return paginated membership billing periods for admin', async () => {
      const query: QueryMembershipBillingPeriodDto = {
        skip: 0,
        take: 40,
        sortBy: 'DESC',
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockAdminUser);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });

    it('should filter by period code for admin', async () => {
      const query: QueryMembershipBillingPeriodDto = {
        period_code: 'monthly',
        skip: 0,
        take: 40,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockAdminUser);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });

    it('should return only active billing periods for customer', async () => {
      const query: QueryMembershipBillingPeriodDto = {
        skip: 0,
        take: 40,
        sortBy: 'DESC',
      };

      const expectedCustomerQuery = {
        ...query,
        is_active: true,
        period_code: undefined,
        period_name: undefined,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query, mockCustomerUser);

      expect(service.findAll).toHaveBeenCalledWith(expectedCustomerQuery);
      expect(result).toEqual(mockFindAllResult);
    });
  });

  describe('findById', () => {
    it('should return a membership billing period by ID for admin', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBillingPeriod);

      const result = await controller.findById(1, mockAdminUser);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBillingPeriod);
    });

    it('should return active membership billing period by ID for customer', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBillingPeriod);

      const result = await controller.findById(1, mockCustomerUser);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBillingPeriod);
    });

    it('should throw NotFoundException for customer accessing inactive billing period', async () => {
      const inactivePeriod = { ...mockBillingPeriod, is_active: false };
      jest.spyOn(service, 'findById').mockResolvedValue(inactivePeriod);

      await expect(controller.findById(1, mockCustomerUser)).rejects.toThrow(
        'Membership billing period not found',
      );
    });
  });

  describe('update', () => {
    it('should update a membership billing period', async () => {
      const updateDto: UpdateMembershipBillingPeriodDto = {
        period_name: 'Updated Monthly',
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockBillingPeriod);

      const result = await controller.update(1, updateDto, mockAdminUser);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockAdminUser);
      expect(result).toEqual(mockBillingPeriod);
    });
  });

  describe('delete', () => {
    it('should delete a membership billing period', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.delete(1, mockAdminUser);

      expect(service.delete).toHaveBeenCalledWith(1, mockAdminUser);
    });
  });
});
