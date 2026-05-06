import { Test, TestingModule } from '@nestjs/testing';
import { ProductAttributeValuesController } from './product-attribute-values.controller';
import { ProductAttributeValuesService } from './product-attribute-values.service';
import { ProductAttributeValue } from './domain/product-attribute-value';
import { FindAllProductAttributeValue } from './domain/find-all-product-attribute-value';
import { NotFoundException } from '@nestjs/common';

describe('ProductAttributeValuesController', () => {
  let controller: ProductAttributeValuesController;
  let service: jest.Mocked<ProductAttributeValuesService>;

  const mockProductAttributeValue: ProductAttributeValue = {
    id: 1,
    product_variant_id: 1,
    product_attribute_id: 1,
    attribute_value_id: 1,
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllResult: FindAllProductAttributeValue = {
    data: [mockProductAttributeValue],
    totalCount: 1,
    skip: 0,
    take: 20,
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      setDefault: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductAttributeValuesController],
      providers: [
        {
          provide: ProductAttributeValuesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductAttributeValuesController>(
      ProductAttributeValuesController,
    );
    service = module.get(ProductAttributeValuesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated product attribute values', async () => {
      service.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(result).toEqual(mockFindAllResult);
      expect(service.findAll).toHaveBeenCalledWith({ skip: 0, take: 20 });
    });

    it('should filter by product_attribute_id', async () => {
      service.findAll.mockResolvedValue(mockFindAllResult);

      const result = await controller.findAll({
        product_attribute_id: 1,
        skip: 0,
        take: 20,
      });

      expect(result).toEqual(mockFindAllResult);
      expect(service.findAll).toHaveBeenCalledWith({
        product_attribute_id: 1,
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findById', () => {
    it('should return a product attribute value by ID', async () => {
      service.findById.mockResolvedValue(mockProductAttributeValue);

      const result = await controller.findById(1);

      expect(result).toEqual(mockProductAttributeValue);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(
        new NotFoundException('ProductAttributeValue with ID 999 not found'),
      );

      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefault', () => {
    it('should set a product attribute value as default', async () => {
      const updatedValue: ProductAttributeValue = {
        ...mockProductAttributeValue,
        is_default: true,
      };
      service.setDefault.mockResolvedValue(updatedValue);

      const result = await controller.setDefault({ id: 1 });

      expect(result).toEqual(updatedValue);
      expect(result.is_default).toBe(true);
      expect(service.setDefault).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if ID not found', async () => {
      service.setDefault.mockRejectedValue(
        new NotFoundException('ProductAttributeValue with ID 999 not found'),
      );

      await expect(controller.setDefault({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
