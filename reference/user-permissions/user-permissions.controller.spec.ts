import { User } from '@/users/domain/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserPermissionsController } from './user-permissions.controller';
import { UserPermissionsService } from './user-permissions.service';
import { CreateUserPermissionDto } from './dto/create-user-permission.dto';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { UserPermission } from './domain/user-permission';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionEnum } from './user-permissions.enum';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('UserPermissionsController', () => {
  let userPermissionsController: UserPermissionsController;
  let userPermissionsService: UserPermissionsService;

  const mockUserPermissionsService = {
    create: jest.fn((dto: CreateUserPermissionDto) => {
      return { id: 1, ...dto }; // Mock user-permission return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock user-permission return
    }),
    update: jest.fn((id: string, dto: UpdateUserPermissionDto) => {
      return { id, ...dto }; // Mock updated user-permission return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted user-permission return
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
      controllers: [UserPermissionsController],
      providers: [
        {
          provide: UserPermissionsService,
          useValue: mockUserPermissionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    userPermissionsController = module.get<UserPermissionsController>(
      UserPermissionsController,
    );
    userPermissionsService = module.get<UserPermissionsService>(
      UserPermissionsService,
    );
  });

  describe('create', () => {
    it('should create a user-permission', async () => {
      const mockUser: User = { id: 1 } as User;
      const createUserPermissionDto: CreateUserPermissionDto = {
        group: 1,
        menu: 1,
        permissions: [PermissionEnum.APPROVE, PermissionEnum.DELETE],
      };
      const result = await userPermissionsController.create(
        createUserPermissionDto,
        mockUser,
      );
      expect(result).toEqual({ id: 1, ...createUserPermissionDto });
      expect(userPermissionsService.create).toHaveBeenCalledWith(
        createUserPermissionDto,
        mockUser,
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated user-permissions', async () => {
      const query = { page: 1, limit: 10 };

      // Mocking the return value of the userPermissionsService.findAllWithPagination
      const mockUserPermissions: Pick<
        UserPermission,
        'id' | 'created_at' | 'updated_at'
      >[] = [
        {
          id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]; // Example user-permission data

      const totalResults = 2; // Total results mock

      mockUserPermissionsService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockUserPermissions,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<UserPermission> =
        await userPermissionsController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockUserPermissions);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 user-permissions and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that userPermissionsService.findAllWithPagination was called with the correct parameters
      expect(userPermissionsService.findAllWithPagination).toHaveBeenCalledWith(
        {
          paginationOptions: { page: 1, limit: 10 },
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return user-permissions', async () => {
      const mockUserPermissions: Pick<UserPermission, 'id'>[] = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      mockUserPermissionsService.findAll.mockResolvedValueOnce(
        mockUserPermissions,
      );

      const result = await userPermissionsController.findAll();

      expect(result).toEqual(mockUserPermissions);
      expect(mockUserPermissionsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user-permission by ID', async () => {
      const id = 1;
      const result = await userPermissionsController.findById(id);
      expect(result).toEqual({ id });
      expect(userPermissionsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a user-permission', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      const updateUserPermissionDto: UpdateUserPermissionDto = {
        group: 1,
        menu: 1,
        permissions: [PermissionEnum.APPROVE, PermissionEnum.DELETE],
      };
      const result = await userPermissionsController.update(
        id,
        updateUserPermissionDto,
        mockUser,
      );
      expect(result).toEqual({ id, ...updateUserPermissionDto });
      expect(userPermissionsService.update).toHaveBeenCalledWith(
        id,
        updateUserPermissionDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user-permission', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      await userPermissionsController.remove(id, mockUser);
      expect(userPermissionsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
