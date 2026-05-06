import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesController } from '@/product-categories/product-categories.controller';
import { ProductCategoriesService } from '@/product-categories/product-categories.service';
import { ProductCategory } from '@/product-categories/domain/product-category';
import { SyncProductCategoriesDto } from '@/product-categories/dto/sync-product-categories.dto';
import { User } from '@/users/domain/user';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ProductCategoriesController', () => {
  let controller: ProductCategoriesController;
  let service: ProductCategoriesService;

  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
  } as User;

  const mockProductCategory: ProductCategory = {
    id: 1,
    product_id: 1,
    category_id: 1,
    is_primary: true,
    display_order: 0,
    category: {
      id: 1,
      category_name: 'Electronics',
      description: 'Electronic products',
      slug: 'electronics',
      display_order: 0,
    },
    created_at: new Date(),
    updated_at: new Date(),
  } as ProductCategory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCategoriesController],
      providers: [
        {
          provide: ProductCategoriesService,
          useValue: {
            syncCategories: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductCategoriesController>(
      ProductCategoriesController,
    );
    service = module.get<ProductCategoriesService>(ProductCategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncCategories', () => {
    it('should sync categories successfully', async () => {
      const inputDto: SyncProductCategoriesDto = {
        category_ids: [1, 2, 3],
      };
      const expectedResult = [mockProductCategory];

      jest.spyOn(service, 'syncCategories').mockResolvedValue(expectedResult);

      const result = await controller.syncCategories(1, inputDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(service.syncCategories).toHaveBeenCalledWith(
        1,
        inputDto,
        mockUser,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      const inputDto: SyncProductCategoriesDto = {
        category_ids: [1, 2, 3],
      };

      jest
        .spyOn(service, 'syncCategories')
        .mockRejectedValue(
          new NotFoundException('Product with id 999 not found'),
        );

      await expect(
        controller.syncCategories(999, inputDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the seller', async () => {
      const inputDto: SyncProductCategoriesDto = {
        category_ids: [1, 2, 3],
      };

      jest
        .spyOn(service, 'syncCategories')
        .mockRejectedValue(
          new ForbiddenException(
            'You can only update categories for products that belong to you',
          ),
        );

      await expect(
        controller.syncCategories(1, inputDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle empty category list', async () => {
      const inputDto: SyncProductCategoriesDto = {
        category_ids: [],
      };
      const expectedResult: ProductCategory[] = [];

      jest.spyOn(service, 'syncCategories').mockResolvedValue(expectedResult);

      const result = await controller.syncCategories(1, inputDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(service.syncCategories).toHaveBeenCalledWith(
        1,
        inputDto,
        mockUser,
      );
    });
  });
});
