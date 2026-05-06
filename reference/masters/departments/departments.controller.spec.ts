import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './domain/department';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/users/domain/user';
import { StatusEnum } from '@/users/users.enum';

describe('DepartmentsController', () => {
  let departmentsController: DepartmentsController;
  let departmentsService: DepartmentsService;

  const mockDepartmentsService = {
    create: jest.fn((dto: CreateDepartmentDto) => {
      return { id: 1, ...dto }; // Mock department return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock department return
    }),
    update: jest.fn((id: string, dto: UpdateDepartmentDto) => {
      return { id, ...dto }; // Mock updated department return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted department return
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
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .compile();

    departmentsController = module.get<DepartmentsController>(
      DepartmentsController,
    );
    departmentsService = module.get<DepartmentsService>(DepartmentsService);
  });

  describe('create', () => {
    it('should create a department', async () => {
      const mockUser: User = { id: 1 } as User;
      const createDepartmentDto: CreateDepartmentDto = {
        department_code: '01',
        department_name: 'CODY',
        department_head: 1,
      };

      const result = await departmentsController.create(
        createDepartmentDto,
        mockUser,
      );

      expect(result).toEqual({
        id: 1,
        ...createDepartmentDto,
      });

      expect(departmentsService.create).toHaveBeenCalledWith(
        createDepartmentDto,
        mockUser,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated departments', async () => {
      const query = { page: 1, limit: 10 };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the departmentsService.findAllWithPagination
      const mockDepartments: Department[] = [
        {
          id: 1,
          department_code: '00',
          department_name: 'Back Office',
          department_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          department_code: '01',
          department_name: 'Operation',
          department_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example department data

      const totalResults = 2; // Total results mock

      mockDepartmentsService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockDepartments,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<Department> =
        await departmentsController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockDepartments);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 departments and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that departmentsService.findAllWithPagination was called with the correct parameters
      expect(departmentsService.findAllWithPagination).toHaveBeenCalledWith({
        paginationOptions: { page: 1, limit: 10 },
      });
    });

    it('should return filtered paginated departments', async () => {
      const query = { search: 'Office', page: 1, limit: 10 };
      const mockUser: User = { id: 1 } as User;

      // Mocking the return value of the departmentsService.findAllWithPagination
      const mockDepartments: Department[] = [
        {
          id: 1,
          department_code: '00',
          department_name: 'Back Office',
          department_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
        {
          id: 2,
          department_code: '01',
          department_name: 'Operation',
          department_head: mockUser,
          status: StatusEnum.ACTIVE,
          created_by: mockUser,
          created_at: new Date(),
          updated_by: mockUser,
          updated_at: new Date(),
        },
      ]; // Example department data

      const totalResults = 1; // Total results mock

      mockDepartmentsService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockDepartments,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<Department> =
        await departmentsController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockDepartments);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 departments and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that departmentsService.findAllWithPagination was called with the correct parameters
      expect(departmentsService.findAllWithPagination).toHaveBeenCalledWith({
        filterQuery: 'Office',
        paginationOptions: { page: 1, limit: 10 },
      });
    });
  });

  describe('findAll', () => {
    it('should return all active or new departments', async () => {
      // Arrange: Mock the service's return value
      const mockDepartments: Pick<
        Department,
        'department_code' | 'department_name'
      >[] = [
        { department_code: '00', department_name: 'Back Office' },
        { department_code: '01', department_name: 'Operations' },
      ];

      mockDepartmentsService.findAll.mockResolvedValue(mockDepartments);

      // Act: Call the controller method
      const result = await departmentsController.findAll();

      // Assert: Verify the result matches the mock data
      expect(result).toEqual(mockDepartments);
      expect(mockDepartmentsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a department by ID', async () => {
      const id = 1;
      const result = await departmentsController.findById(id);
      expect(result).toEqual({ id });
      expect(departmentsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const updateDepartmentDto: UpdateDepartmentDto = {
        status: StatusEnum.ACTIVE,
      };

      const result = await departmentsController.update(
        id,
        updateDepartmentDto,
        mockUser,
      );

      expect(result).toEqual({ id, ...updateDepartmentDto });
      expect(departmentsService.update).toHaveBeenCalledWith(
        id,
        updateDepartmentDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a department', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await departmentsController.remove(id, mockUser);
      expect(departmentsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
