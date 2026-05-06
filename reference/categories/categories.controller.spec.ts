import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '@/categories/controllers/categories.controller';
import { CategoriesService } from '@/categories/categories.service';
import { CreateCategoryDto } from '@/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/categories/dto/update-category.dto';
import { Category } from '@/categories/domain/category';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategory: Category = {
    id: 1,
    category_name: 'Electronics',
    description: 'Electronic devices and gadgets',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
    deleted_by: null,
    deleted_at: null,
    slug: '',
    display_order: 0,
    status: ActiveInactiveStatusEnum.ACTIVE,
    product_count: 0,
  };

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createPersonalizedCategory: jest.fn(),
    updatePersonalizedCategory: jest.fn(),
    hardDeletePersonalizedCategory: jest.fn(),
    getStructuredCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        category_name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        display_order: 1,
        parent_category_id: null,
        seller_id: null,
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      mockCategoriesService.createPersonalizedCategory.mockResolvedValue(
        mockCategory,
      );

      const result = await controller.create(
        createCategoryDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockCategory);
      expect(service.createPersonalizedCategory).toHaveBeenCalledWith(
        createCategoryDto,
        mockCurrentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should get all categories with skip/take pagination', async () => {
      const mockResult = {
        data: [mockCategory],
        totalCount: 1,
        skip: 0,
        take: 20,
      };

      mockCategoriesService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ skip: 0, take: 20 } as any);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({ skip: 0, take: 20 });
    });
  });

  describe('findById', () => {
    it('should get a category by ID', async () => {
      mockCategoriesService.findById.mockResolvedValue(mockCategory);

      const result = await controller.findById(1);

      expect(result).toEqual(mockCategory);
      expect(service.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        category_name: 'Updated Electronics',
        slug: 'updated-electronics',
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const updatedCategory = {
        ...mockCategory,
        category_name: 'Updated Electronics',
        slug: 'updated-electronics',
      };
      mockCategoriesService.updatePersonalizedCategory.mockResolvedValue(
        updatedCategory,
      );

      const result = await controller.update(
        1,
        updateCategoryDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(updatedCategory);
      expect(service.updatePersonalizedCategory).toHaveBeenCalledWith(
        1,
        updateCategoryDto,
        mockCurrentUser,
      );
    });

    it('should update a category with parent category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        parent_category_id: 2,
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Seller',
        last_name: 'User',
        seller_id: 1,
      };

      const updatedCategory = {
        ...mockCategory,
        parent_category_id: 2,
      };
      mockCategoriesService.updatePersonalizedCategory.mockResolvedValue(
        updatedCategory,
      );

      const result = await controller.update(
        1,
        updateCategoryDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(updatedCategory);
      expect(service.updatePersonalizedCategory).toHaveBeenCalledWith(
        1,
        updateCategoryDto,
        mockCurrentUser,
      );
    });

    it('should update a category setting parent to null (root level)', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        parent_category_id: null,
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Seller',
        last_name: 'User',
        seller_id: 1,
      };

      const updatedCategory = {
        ...mockCategory,
        parent_category_id: null,
      };
      mockCategoriesService.updatePersonalizedCategory.mockResolvedValue(
        updatedCategory,
      );

      const result = await controller.update(
        1,
        updateCategoryDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(updatedCategory);
      expect(service.updatePersonalizedCategory).toHaveBeenCalledWith(
        1,
        updateCategoryDto,
        mockCurrentUser,
      );
    });
  });

  describe('delete', () => {
    it('should hard delete a personalized category', async () => {
      const mockCurrentUser = {
        id: 1,
        first_name: 'Seller',
        last_name: 'User',
        seller_id: 1,
      };

      mockCategoriesService.hardDeletePersonalizedCategory.mockResolvedValue(
        undefined,
      );

      await controller.delete(1, mockCurrentUser as any);

      expect(service.hardDeletePersonalizedCategory).toHaveBeenCalledWith(
        1,
        mockCurrentUser,
      );
    });
  });
});
