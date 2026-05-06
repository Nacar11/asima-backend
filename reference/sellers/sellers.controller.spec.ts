import { Test, TestingModule } from '@nestjs/testing';
import { SellersController } from '@/sellers/sellers.controller';
import { SellersService } from '@/sellers/sellers.service';
import { SellerEarningsService } from '@/seller-earnings/seller-earnings.service';
import { PickupAvailabilityService } from '@/sales-orders/pickup-availability.service';
import { CreateSellerDto } from '@/sellers/dto/create-seller.dto';
import { UpdateSellerDto } from '@/sellers/dto/update-seller.dto';
import { Seller } from '@/sellers/domain/seller';
import { StatusEnum } from '@/utils/enums/status-enum';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';

describe('SellersController', () => {
  let controller: SellersController;
  let service: SellersService;

  const mockSeller: Seller = {
    id: 1,
    user_id: 1,
    user: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
    },
    store_name: 'Tech Store',
    slug: 'tech-store',
    store_description: 'A store selling electronics',
    store_logo_url: 'https://example.com/logo.png',
    store_banner_url: 'https://example.com/banner.png',
    business_registration_number: 'BR123456789',
    tax_id: 'TAX123456',
    bank_account_holder: 'John Doe',
    bank_account_number: '1234567890',
    bank_name: 'Bank of America',
    is_verified: false,
    is_active: true,
    sells_products: true,
    sells_services: false,
    auto_accept_bookings: false,
    hourly_rate: 0,
    commission_rate: 0,
    status: StatusEnum.ACTIVE,
    total_sales: 0,
    average_rating: 0,
    total_reviews: 0,
    total_services: 0,
    total_completed_bookings: 0,
    max_concurrent_bookings: 1,
    max_daily_bookings: 8,
    service_capacity_hours: 8,
    created_at: new Date(),
    updated_at: new Date(),
    pickup_enabled: false,
    pickup_preparation_time: 30,
    pickup_max_concurrent_orders: 10,
    pickup_grace_period: 120,
    created_by: null,
    updated_by: null,
    deleted_by: null,
    deleted_at: null,
  };

  const mockSellersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSellerEarningsService = {
    getMyEarningsSummary: jest.fn(),
  };

  const mockPickupAvailabilityService = {
    checkPickupAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellersController],
      providers: [
        {
          provide: SellersService,
          useValue: mockSellersService,
        },
        {
          provide: SellerEarningsService,
          useValue: mockSellerEarningsService,
        },
        {
          provide: PickupAvailabilityService,
          useValue: mockPickupAvailabilityService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SellersController>(SellersController);
    service = module.get<SellersService>(SellersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a seller', async () => {
      const createSellerDto: CreateSellerDto = {
        user_id: 1,
        store_name: 'Tech Store',
        store_description: 'A store selling electronics',
        store_logo_url: 'https://example.com/logo.png',
        store_banner_url: 'https://example.com/banner.png',
        business_registration_number: 'BR123456789',
        tax_id: 'TAX123456',
        bank_account_holder: 'John Doe',
        bank_account_number: '1234567890',
        bank_name: 'Bank of America',
        is_verified: false,
        is_active: true,
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      mockSellersService.create.mockResolvedValue(mockSeller);

      const result = await controller.create(
        createSellerDto,
        mockCurrentUser as any,
        undefined, // No files uploaded in this test
      );

      expect(result).toEqual(mockSeller);
      expect(service.create).toHaveBeenCalledWith(
        createSellerDto,
        mockCurrentUser,
        undefined, // logoFile
        undefined, // bannerFile
      );
    });
  });

  describe('findAll', () => {
    it('should get all sellers with skip/take pagination', async () => {
      const mockResult = {
        data: [mockSeller],
        totalCount: 1,
        skip: 0,
        take: 40,
      };

      mockSellersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({
        skip: 0,
        take: 40,
      } as any);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 40,
      });
    });
  });

  describe('findById', () => {
    it('should get a seller by ID', async () => {
      mockSellersService.findById.mockResolvedValue(mockSeller);

      const result = await controller.findById(1);

      expect(result).toEqual(mockSeller);
      expect(service.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a seller', async () => {
      const updateSellerDto: UpdateSellerDto = {
        store_name: 'Updated Tech Store',
      };

      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      const updatedSeller = { ...mockSeller, store_name: 'Updated Tech Store' };
      mockSellersService.update.mockResolvedValue(updatedSeller);

      const result = await controller.update(
        1,
        updateSellerDto,
        mockCurrentUser as any,
      );

      expect(result).toEqual(updatedSeller);
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateSellerDto,
        mockCurrentUser,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a seller', async () => {
      const mockCurrentUser = {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
      };

      mockSellersService.delete.mockResolvedValue(undefined);

      await controller.delete(1, mockCurrentUser as any);

      expect(service.delete).toHaveBeenCalledWith(1, mockCurrentUser);
    });
  });
});
