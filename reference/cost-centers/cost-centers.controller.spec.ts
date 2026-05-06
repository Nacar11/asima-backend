import { Test, TestingModule } from '@nestjs/testing';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';
import { CostCenter } from './domain/cost-center';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/users/domain/user';
import { StatusEnum } from '../users/users.enum';

describe('CostCentersController', () => {
  let costCentersController: CostCentersController;
  let costCentersService: CostCentersService;

  const mockCostCentersService = {
    create: jest.fn((dto: CreateCostCenterDto) => {
      return { id: 1, ...dto }; // Mock cost-center return with an ID
    }),
    findByMany: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock cost-center return
    }),
    update: jest.fn((id: string, dto: UpdateCostCenterDto) => {
      return { id, ...dto }; // Mock updated cost-center return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted cost-center return
  };

  beforeEach(async () => {
    // Mocked AuthGuard to simulate a logged-in user
    const AuthGuardMock = {
      canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        // Attach a mock user to the request object to simulate a logged-in user
        request.user = { id: 1, username: 'mock-user' };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CostCentersController],
      providers: [
        {
          provide: CostCentersService,
          useValue: mockCostCentersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .compile();

    costCentersController = module.get<CostCentersController>(
      CostCentersController,
    );
    costCentersService = module.get<CostCentersService>(CostCentersService);
  });

  describe('create', () => {
    it('should create a cost-center', async () => {
      const mockUser: User = { id: 1 } as User;
      const createCostCenterDto: CreateCostCenterDto = {
        division: '00',
        department: '01',
        section: '02',
        sub_section: '03',
      };

      const result = await costCentersController.create(
        createCostCenterDto,
        mockUser,
      );

      expect(result).toEqual({ id: 1, ...createCostCenterDto });
      expect(costCentersService.create).toHaveBeenCalledWith(
        createCostCenterDto,
        mockUser,
      );
    });
  });

  describe('findByMany', () => {
    it('should return paginated cost-centers', async () => {
      const query = { skip: 0, take: 10, sort: {}, filter: [] };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the costCentersService.findByMany
      const mockCostCenters: CostCenter[] = [
        {
          id: 1,
          cost_center_code: '01',
          division: { id: 1, division_code: '01', division_name: 'CODY' },
          department: null,
          section: null,
          sub_section: null,
          remarks: 'To be used by CODY',
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          cost_center_code: '0101',
          division: { id: 1, division_code: '01', division_name: 'CODY' },
          department: {
            id: 1,
            department_code: '01',
            department_name: 'Operations',
          },
          section: null,
          sub_section: null,
          remarks: 'To be used by Operations',
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example cost-center data

      const totalCount = 2; // Total count mock

      mockCostCentersService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockCostCenters,
          totalCount,
        }),
      );

      const result = await costCentersController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockCostCenters);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that costCentersService.findByMany was called with the correct parameters
      expect(costCentersService.findByMany).toHaveBeenCalledWith(query);
    });

    it('should return filtered paginated cost-centers', async () => {
      const query = {
        filter: ['status', '=', 'Active'],
        skip: 0,
        take: 10,
        sort: {},
      };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the costCentersService.findByMany
      const mockCostCenters: CostCenter[] = [
        {
          id: 1,
          cost_center_code: '01',
          division: { id: 1, division_code: '01', division_name: 'CODY' },
          department: null,
          section: null,
          sub_section: null,
          remarks: 'To be used by CODY',
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          cost_center_code: '0101',
          division: { id: 1, division_code: '01', division_name: 'CODY' },
          department: {
            id: 1,
            department_code: '01',
            department_name: 'Operations',
          },
          section: null,
          sub_section: null,
          remarks: 'To be used by Operations',
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example cost-center data

      const totalCount = 2; // Total count mock

      mockCostCentersService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockCostCenters,
          totalCount,
        }),
      );

      const result = await costCentersController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockCostCenters);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that costCentersService.findByMany was called with the correct parameters
      expect(costCentersService.findByMany).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return all active or new cost-centers', async () => {
      // Arrange: Mock the service's return value
      const mockCostCenters: Pick<
        CostCenter,
        'cost_center_code' | 'cost_center_name'
      >[] = [
        { cost_center_code: '00', cost_center_name: '00 / LIG JP' },
        { cost_center_code: '01', cost_center_name: '01 / CODY' },
      ];

      mockCostCentersService.findAll.mockResolvedValue(mockCostCenters);

      // Act: Call the controller method
      const result = await costCentersController.findAll();

      // Assert: Verify the result matches the mock data
      expect(result).toEqual(mockCostCenters);
      expect(mockCostCentersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a cost-center by ID', async () => {
      const id = 1;
      const result = await costCentersController.findById(id);
      expect(result).toEqual({ id });
      expect(costCentersService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a cost-center', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const updateCostCenterDto: UpdateCostCenterDto = {
        status: StatusEnum.ACTIVE,
      };

      const result = await costCentersController.update(
        id,
        updateCostCenterDto,
        mockUser,
      );

      expect(result).toEqual({ id, ...updateCostCenterDto });
      expect(costCentersService.update).toHaveBeenCalledWith(
        id,
        updateCostCenterDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a cost-center', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await costCentersController.remove(id, mockUser);
      expect(costCentersService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
