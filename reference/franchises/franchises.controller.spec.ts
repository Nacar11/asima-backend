import { Test, TestingModule } from '@nestjs/testing';
import { FranchisesController } from './franchises.controller';
import { FranchisesService } from './franchises.service';
import { FranchiseStatusEnum } from './domain/franchise-status.enum';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('FranchisesController', () => {
  let controller: FranchisesController;
  let service: FranchisesService;

  const mockFranchise = {
    id: 1,
    name: 'Test Franchise',
    owner_name: 'John Doe',
    email: 'test@example.com',
    phone: '+639123456789',
    address_line1: '123 Main St',
    address_line2: null,
    city: 'Manila',
    state_province: 'Metro Manila',
    postal_code: '1000',
    country: 'Philippines',
    status: FranchiseStatusEnum.SCREENING,
    notes: null,
    onboarded_at: null,
    created_by: { id: 1, first_name: 'Admin', last_name: 'User' },
    created_at: new Date(),
    updated_by: null,
    updated_at: new Date(),
    deleted_by: null,
    deleted_at: null,
  };

  const mockUser = {
    id: 1,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockFranchise),
    findAll: jest.fn().mockResolvedValue({
      data: [mockFranchise],
      totalCount: 1,
      skip: 0,
      take: 20,
    }),
    findById: jest.fn().mockResolvedValue(mockFranchise),
    getStatusHistory: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(mockFranchise),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FranchisesController],
      providers: [
        {
          provide: FranchisesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FranchisesController>(FranchisesController);
    service = module.get<FranchisesService>(FranchisesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a franchise', async () => {
      const createDto = {
        name: 'Test Franchise',
        owner_name: 'John Doe',
        email: 'test@example.com',
        phone: '+639123456789',
        address_line1: '123 Main St',
        city: 'Manila',
        state_province: 'Metro Manila',
        postal_code: '1000',
      };

      const result = await controller.create(createDto, mockUser as any);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mockFranchise);
    });
  });

  describe('findAll', () => {
    it('should return paginated franchises', async () => {
      const query = { skip: 0, take: 20 };

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a franchise by id', async () => {
      const result = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFranchise);
    });
  });

  describe('getStatusHistory', () => {
    it('should return status history for a franchise', async () => {
      const result = await controller.getStatusHistory(1);

      expect(service.getStatusHistory).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a franchise', async () => {
      const updateDto = { name: 'Updated Franchise' };

      const result = await controller.update(1, updateDto, mockUser as any);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockUser);
      expect(result).toEqual(mockFranchise);
    });

    it('should update franchise status with description', async () => {
      const updateDto = {
        status: FranchiseStatusEnum.ACTIVE,
        status_change_description: 'Approved after review',
      };

      await controller.update(1, updateDto, mockUser as any);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockUser);
    });
  });

  describe('delete', () => {
    it('should delete a franchise', async () => {
      await controller.delete(1, mockUser as any);

      expect(service.delete).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
