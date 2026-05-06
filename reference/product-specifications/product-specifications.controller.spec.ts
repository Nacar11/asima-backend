import { Test, TestingModule } from '@nestjs/testing';
import { ProductSpecificationsController } from './product-specifications.controller';
import { ProductSpecificationsService } from './product-specifications.service';
import { ProductSpecification } from './domain/product-specification';
import { FindAllProductSpecification } from './domain/find-all-product-specification';
import { CreateProductSpecificationDto } from './dto/create-product-specification.dto';
import { UpdateProductSpecificationDto } from './dto/update-product-specification.dto';
import { User } from '@/users/domain/user';

describe('ProductSpecificationsController', () => {
  let controller: ProductSpecificationsController;
  let service: ProductSpecificationsService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  } as User;

  const mockProductSpecification: ProductSpecification = {
    id: 1,
    product_id: 1,
    specification_name: 'Display Size',
    unit: 'inches',
    specification_value: '6.7',
    sort_order: 1,
    created_by: mockUser as any,
    updated_by: mockUser as any,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllProductSpecification: FindAllProductSpecification = {
    data: [mockProductSpecification],
    totalCount: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSpecificationsController],
      providers: [
        {
          provide: ProductSpecificationsService,
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

    controller = module.get<ProductSpecificationsController>(
      ProductSpecificationsController,
    );
    service = module.get<ProductSpecificationsService>(
      ProductSpecificationsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product specification', async () => {
      const createProductSpecificationDto: CreateProductSpecificationDto = {
        product_id: 1,
        specification_name: 'Display Size',
        unit: 'inches',
        specification_value: '6.7',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockProductSpecification);

      const result = await controller.create(
        createProductSpecificationDto,
        mockUser,
      );

      expect(service.create).toHaveBeenCalledWith(
        createProductSpecificationDto,
        mockUser,
      );
      expect(result).toEqual(mockProductSpecification);
    });
  });

  describe('findAll', () => {
    it('should return paginated product specifications', async () => {
      const query = { page: 1, limit: 10 };

      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(mockFindAllProductSpecification);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockFindAllProductSpecification);
    });
  });

  describe('findById', () => {
    it('should return a product specification by ID', async () => {
      jest
        .spyOn(service, 'findById')
        .mockResolvedValue(mockProductSpecification);

      const result = await controller.findById('1', mockUser);

      expect(service.findById).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockProductSpecification);
    });
  });

  describe('update', () => {
    it('should update a product specification', async () => {
      const updateProductSpecificationDto: UpdateProductSpecificationDto = {
        specification_name: 'Updated Display Size',
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockProductSpecification);

      const result = await controller.update(
        '1',
        updateProductSpecificationDto,
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateProductSpecificationDto,
        mockUser,
      );
      expect(result).toEqual(mockProductSpecification);
    });
  });

  describe('delete', () => {
    it('should delete a product specification', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue();

      await controller.delete('1', mockUser);

      expect(service.delete).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
