import { Test, TestingModule } from '@nestjs/testing';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariant } from './domain/product-variant';
import { FindAllProductVariant } from './domain/find-all-product-variant';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('ProductVariantsController', () => {
  let controller: ProductVariantsController;
  let service: ProductVariantsService;

  const mockProductVariant: ProductVariant = {
    id: 1,
    product_id: 1,
    sku: 'TEST-SKU-001',
    variant_name: 'Test Variant',
    selling_price: 29.99,
    cost_price: 15.0,
    minimum_order: 1,
    status: 'Active',
    created_at: new Date(),
    updated_at: new Date(),
  } as ProductVariant;

  const mockFindAllResult: FindAllProductVariant = {
    data: [mockProductVariant],
    totalCount: 1,
    skip: 0,
    take: 40,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductVariantsController],
      providers: [
        {
          provide: ProductVariantsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductVariantsController>(
      ProductVariantsController,
    );
    service = module.get<ProductVariantsService>(ProductVariantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated product variants', async () => {
      const query: QueryProductVariantDto = {
        skip: 0,
        take: 40,
        sortBy: 'DESC',
      };

      mockService.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });

    it('should return filtered product variants', async () => {
      const query: QueryProductVariantDto = {
        sku: 'TEST',
        status: 'Active',
        product_id: 1,
        skip: 0,
        take: 20,
      };

      mockService.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllResult);
    });
  });

  describe('findById', () => {
    it('should return a product variant by ID', async () => {
      mockService.findById.mockResolvedValue(mockProductVariant);

      const result = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProductVariant);
    });
  });

  describe('delete', () => {
    it('should delete a product variant', async () => {
      const mockUser = { id: 1, first_name: 'Test', last_name: 'User' } as any;
      mockService.delete.mockResolvedValue(undefined);

      await controller.delete(1, mockUser);

      expect(service.delete).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
