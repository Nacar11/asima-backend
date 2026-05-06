import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FeaturedProductsService } from './featured-products.service';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductFeaturedSectionEntity } from './persistence/entities/product-featured-section.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FeaturedSectionEnum } from '@/products/products.enum';
import { RedisHelper } from '@/utils/helpers/redis.helper';

describe('FeaturedProductsService', () => {
  let service: FeaturedProductsService;
  const mockSellerId = 1;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
    subQuery: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue(''),
    getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockFeaturedSectionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockProductVariantRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockReviewRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      update: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((_, data) => data),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockRedisHelper = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockSellerRepository = {
    findOne: jest.fn().mockResolvedValue({ id: mockSellerId, user_id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeaturedProductsService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductFeaturedSectionEntity),
          useValue: mockFeaturedSectionRepository,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: mockProductVariantRepository,
        },
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: mockReviewRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(SellerEntity),
          useValue: mockSellerRepository,
        },
        {
          provide: RedisHelper,
          useValue: mockRedisHelper,
        },
      ],
    }).compile();

    service = module.get<FeaturedProductsService>(FeaturedProductsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllPublic', () => {
    it('should return empty array when no featured products', async () => {
      mockRedisHelper.get.mockResolvedValue(null); // Cache miss
      const result = await service.findAllPublic({} as any);

      expect(result).toEqual({
        data: [],
        totalCount: 0,
        skip: 0,
        take: 20,
      });
    });

    it('should apply section filter when provided', async () => {
      mockRedisHelper.get.mockResolvedValue(null); // Cache miss
      await service.findAllPublic({
        section: FeaturedSectionEnum.BESTSELLERS,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pfs.section = :section',
        { section: FeaturedSectionEnum.BESTSELLERS },
      );
    });
  });

  describe('setFeatured', () => {
    const mockAdmin = {
      id: 1,
      first_name: 'Admin',
      last_name: 'User',
    };

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setFeatured(999, {} as any, mockAdmin as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when featuring unpublished product', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'Draft',
        featured_sections: [],
      });

      await expect(
        service.setFeatured(1, {} as any, mockAdmin as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when product already in section', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'Published',
        featured_sections: [],
      });
      mockFeaturedSectionRepository.findOne.mockResolvedValue({
        id: 1,
        product_id: 1,
        section: FeaturedSectionEnum.FEATURED,
      });

      await expect(
        service.setFeatured(1, {} as any, mockAdmin as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when max limit reached', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        id: 1,
        seller_id: mockSellerId,
        status: 'Published',
        featured_sections: [],
      });
      mockFeaturedSectionRepository.findOne.mockResolvedValue(null);
      mockFeaturedSectionRepository.count.mockResolvedValue(20);

      await expect(
        service.setFeatured(1, {} as any, mockAdmin as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFeatured', () => {
    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFeatured(999, {
          section: FeaturedSectionEnum.FEATURED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product not in section', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        id: 1,
      });
      mockFeaturedSectionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFeatured(1, {
          section: FeaturedSectionEnum.FEATURED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorder', () => {
    it('should throw BadRequestException for duplicate IDs', async () => {
      await expect(
        service.reorder({
          product_ids: [1, 2, 1],
          section: FeaturedSectionEnum.FEATURED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when products not in section', async () => {
      mockFeaturedSectionRepository.find.mockResolvedValue([
        {
          product_id: 1,
          section: FeaturedSectionEnum.FEATURED,
        },
      ]);

      await expect(
        service.reorder({
          product_ids: [1, 2, 3],
          section: FeaturedSectionEnum.FEATURED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
