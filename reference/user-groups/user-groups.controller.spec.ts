import { User } from '@/users/domain/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupsController } from './user-groups.controller';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { UserGroup } from './domain/user-group';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

function randomString(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

describe('UserGroupsController', () => {
  let userGroupsController: UserGroupsController;
  let userGroupsService: UserGroupsService;

  const mockUserGroupsService = {
    create: jest.fn((dto: CreateUserGroupDto) => {
      return { id: 1, ...dto }; // Mock menu-group return with an ID
    }),
    // findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock menu-group return
    }),
    update: jest.fn((id: string, dto: UpdateUserGroupDto) => {
      return { id, ...dto }; // Mock updated menu-group return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted menu-group return
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
      controllers: [UserGroupsController],
      providers: [
        {
          provide: UserGroupsService,
          useValue: mockUserGroupsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(AuthGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    userGroupsController =
      module.get<UserGroupsController>(UserGroupsController);
    userGroupsService = module.get<UserGroupsService>(UserGroupsService);
  });

  describe('create', () => {
    it('should create a menu-group', async () => {
      const mockUser: User = { id: 1 } as User;
      const CreateUserGroupDto: CreateUserGroupDto = {
        group_name: randomString(5),
        description: randomString(10),
      };
      const result = await userGroupsController.create(
        CreateUserGroupDto,
        mockUser,
      );
      expect(result).toEqual({ id: 1, ...CreateUserGroupDto });
      expect(userGroupsService.create).toHaveBeenCalledWith(
        CreateUserGroupDto,
        mockUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated user-groups', async () => {
      const mockMenuGroups: Pick<UserGroup, 'group_name' | 'description'>[] = [
        { group_name: 'Group1', description: 'Group1 Description' },
        { group_name: 'Group2', description: 'Group2 Description' },
      ];

      mockUserGroupsService.findAll.mockResolvedValueOnce(mockMenuGroups);

      const result = await userGroupsController.findAll();

      expect(result).toEqual(mockMenuGroups);
      expect(mockUserGroupsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a menu-group by ID', async () => {
      const id = 1;
      const result = await userGroupsController.findById(id);
      expect(result).toEqual({ id });
      expect(userGroupsService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a menu-group', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;
      const UpdateUserGroupDto: UpdateUserGroupDto = {
        group_name: 'Group1',
        description: 'Group1 Description',
      };
      const result = await userGroupsController.update(
        id,
        UpdateUserGroupDto,
        mockUser,
      );
      expect(result).toEqual({ id, ...UpdateUserGroupDto });
      expect(userGroupsService.update).toHaveBeenCalledWith(
        id,
        UpdateUserGroupDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a menu-group', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      await userGroupsController.remove(id, mockUser);
      expect(userGroupsService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
