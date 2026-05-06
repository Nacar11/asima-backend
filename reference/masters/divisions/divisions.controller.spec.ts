import { Test, TestingModule } from '@nestjs/testing';
import { DivisionsController } from './divisions.controller';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { Division } from './domain/division';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/utils/enums/status-enum';

describe('DivisionsController', () => {
  let divisionsController: DivisionsController;
  let divisionsService: DivisionsService;

  const mockDivisionsService = {
    create: jest.fn((dto: CreateDivisionDto) => {
      return { id: 1, ...dto }; // Mock division return with an ID
    }),
    findByMany: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock division return
    }),
    update: jest.fn((id: string, dto: UpdateDivisionDto) => {
      return { id, ...dto }; // Mock updated division return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted division return
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
      controllers: [DivisionsController],
      providers: [
        {
          provide: DivisionsService,
          useValue: mockDivisionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .compile();

    divisionsController = module.get<DivisionsController>(DivisionsController);
    divisionsService = module.get<DivisionsService>(DivisionsService);
  });

  describe('create', () => {
    it('should create a division', async () => {
      const mockUser: User = { id: 1 } as User;
      const createDivisionDto: CreateDivisionDto = {
        division_code: '01',
        division_name: 'CODY',
        division_head: 1,
      };

      const result = await divisionsController.create(
        createDivisionDto,
        mockUser,
      );

      expect(result).toEqual({
        id: 1,
        ...createDivisionDto,
      });

      expect(divisionsService.create).toHaveBeenCalledWith(
        createDivisionDto,
        mockUser,
      );
    });
  });

  describe('findByMany', () => {
    it('should return paginated divisions', async () => {
      const query = { skip: 0, take: 10, sort: {}, filter: [] };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the divisionsService.findByMany
      const mockDivisions: Division[] = [
        {
          id: 1,
          division_code: '00',
          division_name: 'LIG JP',
          division_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          division_code: '01',
          division_name: 'CODY',
          division_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example division data

      const totalCount = 2; // Total count mock

      mockDivisionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockDivisions,
          totalCount,
        }),
      );

      const result = await divisionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockDivisions);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that divisionsService.findByMany was called with the correct parameters
      expect(divisionsService.findByMany).toHaveBeenCalledWith(query);
    });

    it('should return filtered paginated divisions', async () => {
      const query = {
        filter: ['division_name', 'contains', 'CODY'],
        skip: 0,
        take: 10,
        sort: {},
      };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the divisionsService.findByMany
      const mockDivisions: Division[] = [
        {
          id: 1,
          division_code: '00',
          division_name: 'LIG JP',
          division_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          division_code: '01',
          division_name: 'CODY',
          division_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example division data

      const totalCount = 2; // Total count mock

      mockDivisionsService.findByMany.mockReturnValueOnce(
        Promise.resolve({
          data: mockDivisions,
          totalCount,
        }),
      );

      const result = await divisionsController.findByMany(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockDivisions);
      expect(result.totalCount).toBe(totalCount);

      // Asserting that divisionsService.findByMany was called with the correct parameters
      expect(divisionsService.findByMany).toHaveBeenCalledWith(query);
    });
  });

  describe('findAll', () => {
    it('should return all active or new divisions', async () => {
      // Arrange: Mock the service's return value
      const mockDivisions: Pick<Division, 'division_code' | 'division_name'>[] =
        [
          { division_code: '00', division_name: 'LIG JP' },
          { division_code: '01', division_name: 'CODY' },
        ];

      mockDivisionsService.findAll.mockResolvedValue(mockDivisions);

      // Act: Call the controller method
      const result = await divisionsController.findAll();

      // Assert: Verify the result matches the mock data
      expect(result).toEqual(mockDivisions);
      expect(mockDivisionsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a division by ID', async () => {
      const id = 1;
      const result = await divisionsController.findById(id);
      expect(result).toEqual({ id });
      expect(divisionsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a division', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const updateDivisionDto: UpdateDivisionDto = {
        status: StatusEnum.ACTIVE,
      };

      const result = await divisionsController.update(
        id,
        updateDivisionDto,
        mockUser,
      );

      expect(result).toEqual({ id, ...updateDivisionDto });
      expect(divisionsService.update).toHaveBeenCalledWith(
        id,
        updateDivisionDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a division', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await divisionsController.remove(id, mockUser);
      expect(divisionsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
