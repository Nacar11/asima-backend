import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '@/products/products.controller';
import { ProductsService } from '@/products/products.service';
import { CreateProductDto } from '@/products/dto/create-product.dto';
import { UpdateProductDto } from '@/products/dto/update-product.dto';
import { Product } from '@/products/domain/product';
import { ProductPublishValidationException } from '@/products/exceptions/product-publish-validation.exception';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct: Product = {
    id: 1,
    product_name: 'Premium Coffee Beans',
    description: 'Single-origin Arabica coffee beans',
    status: 'Published',
    seller_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
    deleted_by: null,
    deleted_at: null,
  } as Product;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteBulk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        product_name: 'Premium Coffee Beans',
        description: 'Single-origin Arabica coffee beans',
        status: 'Published',
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      mockProductsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(
        createProductDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(
        createProductDto,
        mockCurrentUser,
      );
    });

    it('should throw ProductPublishValidationException when creating published product without required fields', async () => {
      const createProductDto: CreateProductDto = {
        product_name: 'Premium Coffee Beans',
        description: 'Single-origin Arabica coffee beans',
        status: 'Published',
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const validationError = new ProductPublishValidationException([
        'primary_image',
        'categories',
      ]);
      mockProductsService.create.mockRejectedValue(validationError);

      await expect(
        controller.create(createProductDto, mockCurrentUser as any),
      ).rejects.toThrow(ProductPublishValidationException);

      expect(service.create).toHaveBeenCalledWith(
        createProductDto,
        mockCurrentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should get all products with skip/take pagination', async () => {
      const mockResult = {
        data: [mockProduct],
        totalCount: 1,
        skip: 0,
        take: 40,
      };

      mockProductsService.findAll.mockResolvedValue(mockResult);

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const result = await controller.findAll(
        {
          skip: 0,
          take: 40,
        } as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {
          skip: 0,
          take: 40,
        },
        mockCurrentUser,
      );
    });
  });

  describe('findById', () => {
    it('should get a product by ID', async () => {
      mockProductsService.findById.mockResolvedValue(mockProduct);

      const result = await controller.findById(1);

      expect(result).toEqual(mockProduct);
      expect(service.findById).toHaveBeenCalledWith(1, {
        excludeVariants: false,
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        product_name: 'Updated Coffee Beans',
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const updatedProduct = {
        ...mockProduct,
        product_name: 'Updated Coffee Beans',
      };
      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(
        1,
        updateProductDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(updatedProduct);
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateProductDto,
        mockCurrentUser,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const mockResult = {
        is_deleted: true,
      };
      mockProductsService.delete.mockResolvedValue(mockResult);

      const result = await controller.delete(1, mockCurrentUser as any);

      expect(result).toEqual(mockResult);
      expect(service.delete).toHaveBeenCalledWith(1, mockCurrentUser);
    });
  });

  describe('deleteBulk', () => {
    it('should bulk delete products', async () => {
      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };
      const mockResult = {
        deleted_ids: [1],
        blocked_products: [
          {
            id: 2,
            product_name: 'Blocked Product',
            reason: 'Product has pending orders',
          },
        ],
      };
      mockProductsService.deleteBulk.mockResolvedValue(mockResult);

      const result = await controller.deleteBulk(
        { ids: [1, 2] } as any,
        mockCurrentUser as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.deleteBulk).toHaveBeenCalledWith([1, 2], mockCurrentUser);
    });
  });
});
