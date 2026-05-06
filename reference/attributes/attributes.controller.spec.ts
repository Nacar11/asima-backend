import { Test, TestingModule } from '@nestjs/testing';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { Attribute } from './domain/attribute';
import { FindAllAttribute } from './domain/find-all-attribute';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('AttributesController', () => {
  let controller: AttributesController;
  let service: AttributesService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  } as User;

  const mockAttribute: Attribute = {
    id: 1,
    seller_id: 1,
    name: 'Size',
    status: 'Active',
    seller: {} as any,
    created_by: mockUser as any,
    updated_by: mockUser as any,
    deleted_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFindAllAttribute: FindAllAttribute = {
    data: [mockAttribute],
    totalCount: 1,
    skip: 0,
    take: 40,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributesController],
      providers: [
        {
          provide: AttributesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttributesController>(AttributesController);
    service = module.get<AttributesService>(AttributesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an attribute', async () => {
      const createAttributeDto: CreateAttributeDto = {
        name: 'Size',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockAttribute);

      const result = await controller.create(createAttributeDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createAttributeDto, mockUser);
      expect(result).toEqual(mockAttribute);
    });
  });

  describe('findAll', () => {
    it('should return paginated attributes with skip/take', async () => {
      const query = { skip: 0, take: 40 };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockFindAllAttribute);

      const result = await controller.findAll(query as any, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
      expect(result).toEqual(mockFindAllAttribute);
    });
  });

  describe('findById', () => {
    it('should return an attribute by ID', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockAttribute);

      const result = await controller.findById('1', mockUser);

      expect(service.findById).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockAttribute);
    });
  });

  describe('update', () => {
    it('should update an attribute', async () => {
      const updateAttributeDto: UpdateAttributeDto = {
        name: 'Updated Size',
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockAttribute);

      const result = await controller.update('1', updateAttributeDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateAttributeDto,
        mockUser,
      );
      expect(result).toEqual(mockAttribute);
    });
  });

  describe('delete', () => {
    it('should delete an attribute', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue();

      await controller.delete('1', mockUser);

      expect(service.delete).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
