import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserPermissionsService } from '../user-permissions/user-permissions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './domain/user';
import { StatusEnum } from '@/users/users.enum';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn((dto: CreateUserDto) => {
      return { id: 1, ...dto }; // Mock user return with an ID
    }),
    findById: jest.fn((id: string) => {
      return { id, first_name: 'Test', last_name: 'User' }; // Mock user return
    }),
    update: jest.fn((id: string, dto: UpdateUserDto) => {
      return { id, ...dto }; // Mock updated user return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted user return
    bulkRemove: jest.fn(),
  };

  const mockUserPermissionsService = {
    matchUserPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserPermissionsService,
          useValue: mockUserPermissionsService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: `user-created-${Date.now()}@cody.inc`,
        password: 'password',
        first_name: `First${Date.now()}`,
        last_name: `Last${Date.now()}`,
        status: StatusEnum.ACTIVE,
      };
      const mockUser: User = { id: 1 } as User;

      const result = await usersController.create(createUserDto, mockUser);
      expect(result).toEqual({ id: 1, ...createUserDto });
      expect(usersService.create).toHaveBeenCalledWith(createUserDto, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const id = 1;
      const result = await usersController.findOne(id);
      expect(result).toEqual({ id, first_name: 'Test', last_name: 'User' });
      expect(usersService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        first_name: 'Updated',
        last_name: 'User',
      };
      const mockUser: User = { id: 1 } as User;

      const result = await usersController.update(id, updateUserDto, mockUser);
      expect(result).toEqual({ id, ...updateUserDto });
      expect(usersService.update).toHaveBeenCalledWith(
        id,
        updateUserDto,
        mockUser,
        undefined,
        undefined,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const id = 1;
      const mockUser: User = { id: 1 } as User;

      await usersController.remove(id, mockUser);
      expect(usersService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
