import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SellersService } from './sellers.service';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { UsersService } from '@/users/users.service';
import { StorageService } from '@/storage/storage.service';
import { BaseServiceRepository } from '@/services/persistence/base-service.repository';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { BaseSellerPortfolioRepository } from '@/seller-portfolio/persistence/base-seller-portfolio.repository';
import { UserAddressesService } from '@/user-addresses/user-addresses.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

describe('SellersService', () => {
  let service: SellersService;

  const mockBaseSellerRepository = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockStorageService = {
    put: jest.fn(),
  };

  const mockBaseServiceRepository = {
    findAll: jest.fn(),
  };

  const mockReviewRepository = {
    findAll: jest.fn(),
  };

  const mockBaseSellerScheduleRepository = {
    findAll: jest.fn(),
  };

  const mockBaseStoreUnavailabilityRepository = {
    findAll: jest.fn(),
  };

  const mockBaseBookingRepository = {
    findAll: jest.fn(),
  };

  const mockBaseSellerPortfolioRepository = {
    findAll: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  const mockCategoryRepository = {
    find: jest.fn(),
  };

  const mockTagRepository = {
    find: jest.fn(),
  };

  const mockAttributeRepository = {
    find: jest.fn(),
  };

  const mockSubscriptionRepository = {
    find: jest.fn(),
  };

  const mockUserAddressesService = {
    findByUserId: jest.fn(),
  };

  const mockUserAddressEntityRepository = {
    count: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'upload.storeFileMaxSizeBytes') {
        return 10 * 1024 * 1024; // 10MB
      }
      if (key === 'upload.storeFileMaxSizeMB') {
        return 10;
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        {
          provide: BaseSellerRepository,
          useValue: mockBaseSellerRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: BaseServiceRepository,
          useValue: mockBaseServiceRepository,
        },
        {
          provide: ReviewRepository,
          useValue: mockReviewRepository,
        },
        {
          provide: BaseSellerScheduleRepository,
          useValue: mockBaseSellerScheduleRepository,
        },
        {
          provide: BaseStoreUnavailabilityRepository,
          useValue: mockBaseStoreUnavailabilityRepository,
        },
        {
          provide: BaseBookingRepository,
          useValue: mockBaseBookingRepository,
        },
        {
          provide: BaseSellerPortfolioRepository,
          useValue: mockBaseSellerPortfolioRepository,
        },
        {
          provide: 'ProductEntityRepository',
          useValue: mockProductRepository,
        },
        {
          provide: 'CategoryEntityRepository',
          useValue: mockCategoryRepository,
        },
        {
          provide: 'TagEntityRepository',
          useValue: mockTagRepository,
        },
        {
          provide: 'AttributeEntityRepository',
          useValue: mockAttributeRepository,
        },
        {
          provide: 'SubscriptionEntityRepository',
          useValue: mockSubscriptionRepository,
        },
        {
          provide: UserAddressesService,
          useValue: mockUserAddressesService,
        },
        {
          provide: 'UserAddressEntityRepository',
          useValue: mockUserAddressEntityRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile - file size validation', () => {
    const createMockFile = (sizeInBytes: number): Express.Multer.File => ({
      fieldname: 'store_logo_url',
      originalname: 'test-logo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: sizeInBytes,
      buffer: Buffer.alloc(sizeInBytes),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    });

    it('should reject store logo file exceeding 10MB', async () => {
      const oversizedFile = createMockFile(11 * 1024 * 1024); // 11MB

      await expect(
        service['uploadFile'](oversizedFile, 'test-store', 'logo'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject store banner file exceeding 10MB', async () => {
      const oversizedFile = createMockFile(11 * 1024 * 1024); // 11MB
      oversizedFile.fieldname = 'store_banner_url';

      await expect(
        service['uploadFile'](oversizedFile, 'test-store', 'banner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept store logo file under 10MB', async () => {
      const validFile = createMockFile(9 * 1024 * 1024); // 9MB

      mockStorageService.put.mockResolvedValue({
        key: 'sellers/test-store/logo-123.png',
      });

      await expect(
        service['uploadFile'](validFile, 'test-store', 'logo'),
      ).resolves.toBeDefined();
    });

    it('should accept store logo file exactly at 10MB', async () => {
      const validFile = createMockFile(10 * 1024 * 1024); // Exactly 10MB

      mockStorageService.put.mockResolvedValue({
        key: 'sellers/test-store/logo-123.png',
      });

      await expect(
        service['uploadFile'](validFile, 'test-store', 'logo'),
      ).resolves.toBeDefined();
    });

    it('should include file size in error message', async () => {
      const oversizedFile = createMockFile(15 * 1024 * 1024); // 15MB

      await expect(
        service['uploadFile'](oversizedFile, 'test-store', 'logo'),
      ).rejects.toThrow(/15\.00MB/);
    });
  });

  describe('SellerEntity - commission_rate field', () => {
    it('should have commission_rate field on seller entity', () => {
      const entity = new SellerEntity();
      entity.commission_rate = 10.0;
      expect(entity.commission_rate).toBe(10.0);
    });
  });
});
