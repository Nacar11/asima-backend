import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { FranchiseStatusEventsService } from './franchise-status-events.service';
import { BaseFranchiseRepository } from './persistence/base-franchise.repository';
import { FranchiseStatusEnum } from './domain/franchise-status.enum';

describe('FranchisesService', () => {
  let service: FranchisesService;
  let repository: BaseFranchiseRepository;
  let statusEventsService: FranchiseStatusEventsService;

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

  const mockRepository = {
    create: jest.fn().mockResolvedValue(mockFranchise),
    findAll: jest.fn().mockResolvedValue({
      data: [mockFranchise],
      totalCount: 1,
      skip: 0,
      take: 20,
    }),
    findById: jest.fn().mockResolvedValue(mockFranchise),
    update: jest.fn().mockResolvedValue(mockFranchise),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockStatusEventsService = {
    createEvent: jest.fn().mockResolvedValue({}),
    getStatusHistory: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchisesService,
        {
          provide: BaseFranchiseRepository,
          useValue: mockRepository,
        },
        {
          provide: FranchiseStatusEventsService,
          useValue: mockStatusEventsService,
        },
      ],
    }).compile();

    service = module.get<FranchisesService>(FranchisesService);
    repository = module.get<BaseFranchiseRepository>(BaseFranchiseRepository);
    statusEventsService = module.get<FranchiseStatusEventsService>(
      FranchiseStatusEventsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a franchise with initial status event', async () => {
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

      const result = await service.create(createDto, mockUser as any);

      expect(repository.create).toHaveBeenCalled();
      expect(statusEventsService.createEvent).toHaveBeenCalledWith(
        mockFranchise.id,
        null,
        FranchiseStatusEnum.SCREENING,
        'Franchise created',
        mockUser,
      );
      expect(result).toEqual(mockFranchise);
    });
  });

  describe('findAll', () => {
    it('should return paginated franchises', async () => {
      const query = { skip: 0, take: 20 };

      const result = await service.findAll(query as any);

      expect(repository.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a franchise by id', async () => {
      const result = await service.findById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFranchise);
    });

    it('should throw NotFoundException if franchise not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a franchise without status change', async () => {
      const updateDto = { name: 'Updated Franchise' };

      const result = await service.update(1, updateDto, mockUser as any);

      expect(repository.update).toHaveBeenCalled();
      expect(statusEventsService.createEvent).not.toHaveBeenCalled();
      expect(result).toEqual(mockFranchise);
    });

    it('should update franchise status and create status event', async () => {
      const updateDto = {
        status: FranchiseStatusEnum.ACTIVE,
        status_change_description: 'Approved after review',
      };

      const updatedFranchise = {
        ...mockFranchise,
        status: FranchiseStatusEnum.ACTIVE,
      };
      mockRepository.update.mockResolvedValueOnce(updatedFranchise);

      await service.update(1, updateDto, mockUser as any);

      expect(statusEventsService.createEvent).toHaveBeenCalledWith(
        1,
        FranchiseStatusEnum.SCREENING,
        FranchiseStatusEnum.ACTIVE,
        'Approved after review',
        mockUser,
      );
    });

    it('should keep onboarded_at when status changes to Inactive', async () => {
      const activeFranchise = {
        ...mockFranchise,
        status: FranchiseStatusEnum.ACTIVE,
        onboarded_at: new Date('2024-01-01'),
      };
      mockRepository.findById.mockResolvedValueOnce(activeFranchise);

      const updateDto = {
        status: FranchiseStatusEnum.INACTIVE,
      };

      await service.update(1, updateDto, mockUser as any);

      // onboarded_at should NOT be in the update payload (kept as is)
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({
          onboarded_at: null,
        }),
      );
    });

    it('should clear onboarded_at when status changes to Rejected', async () => {
      const activeFranchise = {
        ...mockFranchise,
        status: FranchiseStatusEnum.ACTIVE,
        onboarded_at: new Date('2024-01-01'),
      };
      mockRepository.findById.mockResolvedValueOnce(activeFranchise);

      const updateDto = {
        status: FranchiseStatusEnum.REJECTED,
        status_change_description: 'Contract terminated',
      };

      await service.update(1, updateDto, mockUser as any);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: FranchiseStatusEnum.REJECTED,
          onboarded_at: null,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a franchise', async () => {
      await service.delete(1, mockUser as any);

      expect(repository.update).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('getStatusHistory', () => {
    it('should return status history for a franchise', async () => {
      const result = await service.getStatusHistory(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(statusEventsService.getStatusHistory).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });
});
