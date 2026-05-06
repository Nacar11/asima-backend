import { User } from '@/users/domain/user';
import { Test, TestingModule } from '@nestjs/testing';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './domain/menu';
import { PaginatedResponseDto } from '@/utils/dto/paginated-response.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionEnum } from './menus.enum';

describe('MenusController', () => {
  let menusController: MenusController;
  let menusService: MenusService;

  const mockMenusService = {
    create: jest.fn((dto: CreateMenuDto) => {
      return { id: 1, ...dto }; // Mock menu return with an ID
    }),
    findAllWithPagination: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn((id: string) => {
      return { id }; // Mock menu return
    }),
    update: jest.fn((id: string, dto: UpdateMenuDto) => {
      return { id, ...dto }; // Mock updated menu return
    }),
    remove: jest.fn((id) => ({ id })), // Mock deleted menu return
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
      controllers: [MenusController],
      providers: [
        {
          provide: MenusService,
          useValue: mockMenusService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(authGuardMock)
      .compile();

    menusController = module.get<MenusController>(MenusController);
    menusService = module.get<MenusService>(MenusService);
  });

  describe('create', () => {
    it('should create a menu', async () => {
      const mockUser: User = { id: 1 } as User;
      const createMenuDto: CreateMenuDto = {
        menu_code: 'S001',
        menu_name: 'Sales Order List',
        permissions: [PermissionEnum.APPROVE],
      };
      const result = await menusController.create(createMenuDto, mockUser);
      expect(result).toEqual({ id: 1, ...createMenuDto });
      expect(menusService.create).toHaveBeenCalledWith(createMenuDto, mockUser);
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated menus', async () => {
      const query = { page: 1, limit: 10 };

      // Mocking the return value of the menusService.findAllWithPagination
      const mockMenus: Pick<
        Menu,
        'id' | 'menu_code' | 'menu_name' | 'permissions'
      >[] = [
        {
          id: 1,
          menu_code: 'S001',
          menu_name: 'Sales Order List',
          permissions: [PermissionEnum.APPROVE],
        },
        {
          id: 2,
          menu_code: 'S002',
          menu_name: 'Sales Force',
          permissions: [
            PermissionEnum.APPROVE,
            PermissionEnum.DELETE,
            PermissionEnum.ENDORSE,
          ],
        },
      ]; // Example menu data

      const totalResults = 2; // Total results mock

      mockMenusService.findAllWithPagination.mockReturnValueOnce(
        Promise.resolve({
          data: mockMenus,
          totalResults,
        }),
      );

      const result: PaginatedResponseDto<Menu> =
        await menusController.findAllWithPagination(query);

      // Asserting that the result is defined
      expect(result).toBeDefined();

      // Asserting that the result has the expected properties
      expect(result.data).toEqual(mockMenus);
      expect(result.totalResults).toBe(totalResults);
      expect(result.totalPages).toBe(1); // Since we have 2 menus and limit is 10
      expect(result.currentPage).toBe(1);

      // Asserting that menusService.findAllWithPagination was called with the correct parameters
      expect(menusService.findAllWithPagination).toHaveBeenCalledWith({
        paginationOptions: { page: 1, limit: 10 },
        status: 'all',
      });
    });
  });

  describe('findAll', () => {
    it('should return menus', async () => {
      const mockMenus: Pick<
        Menu,
        'id' | 'menu_code' | 'menu_name' | 'permissions'
      >[] = [
        {
          id: 1,
          menu_code: 'S001',
          menu_name: 'Sales Order List',
          permissions: [PermissionEnum.APPROVE],
        },
        {
          id: 2,
          menu_code: 'S002',
          menu_name: 'Sales Force',
          permissions: [
            PermissionEnum.APPROVE,
            PermissionEnum.DELETE,
            PermissionEnum.ENDORSE,
          ],
        },
      ];

      mockMenusService.findAll.mockResolvedValueOnce(mockMenus);

      const result = await menusController.findAll();

      expect(result).toEqual(mockMenus);
      expect(mockMenusService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a menu by ID', async () => {
      const id = 1;
      const result = await menusController.findById(id);
      expect(result).toEqual({ id });
      expect(menusService.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a menu', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      const updateMenuDto: UpdateMenuDto = {};
      const result = await menusController.update(id, updateMenuDto, mockUser);
      expect(result).toEqual({ id, ...updateMenuDto });
      expect(menusService.update).toHaveBeenCalledWith(
        id,
        updateMenuDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a menu', async () => {
      const mockUser: User = { id: 1 } as User;
      const id = 1;
      await menusController.remove(id, mockUser);
      expect(menusService.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
