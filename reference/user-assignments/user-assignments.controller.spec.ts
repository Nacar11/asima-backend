import { User } from '@/users/domain/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAssignmentsController } from './user-assignments.controller';
import { UserAssignmentsService } from './user-assignments.service';
import { CreateUserAssignmentDto } from './dto/create-user-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { UserAssignment } from './domain/user-assignment';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Original types for User and Group
type UserType = {
  id: number;
  first_name: string;
  last_name: string;
};

type GroupType = {
  id: number;
  group_name: string;
  description: string;
};

// Pick specific properties from User and Group
type UserAssignmentSubset = {
  user: Pick<UserType, 'id' | 'first_name' | 'last_name'>;
  group: Pick<GroupType, 'id' | 'group_name' | 'description'>;
};

describe('UserAssignmentsController', () => {
  let userAssignmentsController: UserAssignmentsController;
  let userAssignmentsService: UserAssignmentsService;

  const mockUserAssignmentsService = {
    create: jest.fn((dto: CreateUserAssignmentDto) => {
      return { id: 1, ...dto }; // Mock user-assignment return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock user-assignment return
    }),
    update: jest.fn((id: string, dto: UpdateUserAssignmentDto) => {
      return { id, ...dto }; // Mock updated user-assignment return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted user-assignment return
  };

  beforeEach(async () => {
    const authGuardMock = {
      canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { id: 1, username: 'mock-user' };
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAssignmentsController],
      providers: [
        {
          provide: UserAssignmentsService,
          useValue: mockUserAssignmentsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    userAssignmentsController = module.get<UserAssignmentsController>(
      UserAssignmentsController,
    );
    userAssignmentsService = module.get<UserAssignmentsService>(
      UserAssignmentsService,
    );
  });

  describe('create', () => {
    it('should create a user-assignment', async () => {
      const mockUser: User = { id: 1 } as User;
      const createUserAssignmentDto: CreateUserAssignmentDto = {
        group: 1,
        user: 1,
      };
      const result = await userAssignmentsController.create(
        createUserAssignmentDto,
        mockUser,
      );
      expect(result).toEqual({ id: 1, ...createUserAssignmentDto });
      expect(userAssignmentsService.create).toHaveBeenCalledWith(
        createUserAssignmentDto,
        mockUser,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated user-assignments', async () => {
      const query = { page: 1, limit: 10 };

      // Mocking the return value of the userAssignmentsService.findAllWithPagination
      const mockUserAssignments: UserAssignmentSubset[] = [
        {
          group: {
            id: 1,
            group_name: 'Group1',
            description: 'Group1 Description',
          },
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        {
          group: {
            id: 1,
            group_name: 'Group2',
            description: 'Group2 Description',
          },
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      ];

      const totalResults = 2; // Total results mock

      mockUserAssignmentsService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockUserAssignments,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<UserAssignment> =
        await userAssignmentsController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockUserAssignments);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 user-assignments and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that userAssignmentsService.findAllWithPagination was called with the correct parameters
      expect(userAssignmentsService.findAllWithPagination).toHaveBeenCalledWith(
        {
          paginationOptions: { page: 1, limit: 10 },
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated user-assignments', async () => {
      const mockUserAssignments: UserAssignmentSubset[] = [
        {
          group: {
            id: 1,
            group_name: 'Group1',
            description: 'Group1 Description',
          },
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        {
          group: {
            id: 1,
            group_name: 'Group2',
            description: 'Group2 Description',
          },
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      ];

      mockUserAssignmentsService.findAll.mockResolvedValueOnce(
        mockUserAssignments,
      );

      const result = await userAssignmentsController.findAll();

      expect(result).toEqual(mockUserAssignments);
      expect(mockUserAssignmentsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user-assignment by ID', async () => {
      const id = 1;
      const result = await userAssignmentsController.findById(id);
      expect(result).toEqual({ id });
      expect(userAssignmentsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a user-assignment', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      const updateUserAssignmentDto: UpdateUserAssignmentDto = {
        group: 1,
        user: 1,
      };
      const result = await userAssignmentsController.update(
        id,
        updateUserAssignmentDto,
        mockUser,
      );
      expect(result).toEqual({ id, ...updateUserAssignmentDto });
      expect(userAssignmentsService.update).toHaveBeenCalledWith(
        id,
        updateUserAssignmentDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    const mockUser: User = { id: 1 } as User;
    it('should delete a user-assignment', async () => {
      const id = 1;
      await userAssignmentsController.remove(id, mockUser);
      expect(userAssignmentsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
