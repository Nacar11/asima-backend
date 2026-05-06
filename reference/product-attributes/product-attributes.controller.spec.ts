import { Test, TestingModule } from '@nestjs/testing';
import { ProductAttributesController } from './product-attributes.controller';
import { ProductAttributesService } from './product-attributes.service';
import { ProductAttribute } from './domain/product-attribute';
import { FindAllProductAttribute } from './domain/find-all-product-attribute';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { User } from '@/users/domain/user';

describe('ProductAttributesController', () => {
  let controller: ProductAttributesController;
  let service: ProductAttributesService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  } as User;

  const mockProductAttribute: ProductAttribute = {
    id: 1,
    product_id: 1,
    attribute_id: 1,
    attribute_value_ids: [1, 2, 4],
    terms: ['Whole Bean', 'Fine Grind'],
    product: {} as any,
    attribute: {} as any,
    created_by: mockUser as any,
    updated_by: mockUser as any,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllProductAttribute: FindAllProductAttribute = {
    data: [mockProductAttribute],
    totalCount: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductAttributesController],
      providers: [
        {
          provide: ProductAttributesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductAttributesController>(
      ProductAttributesController,
    );
    service = module.get<ProductAttributesService>(ProductAttributesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product attribute', async () => {
      const createProductAttributeDto: CreateProductAttributeDto = {
        product_id: 1,
        attribute_id: 1,
        attribute_value_ids: [1, 2, 4],
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockProductAttribute);

      const result = await controller.create(
        createProductAttributeDto,
        mockUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        createProductAttributeDto,
        mockUser,
      );
      expect(result).toEqual(mockProductAttribute);
    });
  });

  describe('findAll', () => {
    it('should return paginated product attributes', async () => {
      const query = { page: 1, limit: 10 };

      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(mockFindAllProductAttribute);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllProductAttribute);
    });
  });

  describe('findById', () => {
    it('should return a product attribute by ID', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockProductAttribute);

      const result = await controller.findById('1');

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProductAttribute);
    });
  });

  describe('update', () => {
    it('should update a product attribute', async () => {
      const updateProductAttributeDto: UpdateProductAttributeDto = {
        attribute_value_ids: [1, 2, 3],
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockProductAttribute);

      const result = await controller.update(
        '1',
        updateProductAttributeDto,
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateProductAttributeDto,
        mockUser,
      );
      expect(result).toEqual(mockProductAttribute);
    });
  });

  describe('delete', () => {
    it('should delete a product attribute', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue();

      await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith(1);
    });
  });
});
