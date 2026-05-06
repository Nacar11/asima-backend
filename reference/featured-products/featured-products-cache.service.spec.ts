import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeaturedProductsCacheService } from './featured-products-cache.service';
import { ProductFeaturedSectionEntity } from './persistence/entities/product-featured-section.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { RedisHelper } from '@/utils/helpers/redis.helper';

describe('FeaturedProductsCacheService', () => {
  let service: FeaturedProductsCacheService;
  let mockFeaturedSectionRepository: any;
  let mockProductVariantRepository: any;
  let mockRedisHelper: any;

  beforeEach(async () => {
    mockFeaturedSectionRepository = {
      count: jest.fn(),
    };

    mockProductVariantRepository = {
      findOne: jest.fn(),
    };

    mockRedisHelper = {
      delByPattern: jest.fn().mockResolvedValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeaturedProductsCacheService,
        {
          provide: getRepositoryToken(ProductFeaturedSectionEntity),
          useValue: mockFeaturedSectionRepository,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: mockProductVariantRepository,
        },
        {
          provide: RedisHelper,
          useValue: mockRedisHelper,
        },
      ],
    }).compile();

    service = module.get<FeaturedProductsCacheService>(
      FeaturedProductsCacheService,
    );
  });

  describe('invalidateIfFeatured', () => {
    it('should invalidate cache when product is featured', async () => {
      mockFeaturedSectionRepository.count.mockResolvedValue(1);

      const result = await service.invalidateIfFeatured(123);

      expect(result).toBe(true);
      expect(mockFeaturedSectionRepository.count).toHaveBeenCalledWith({
        where: { product_id: 123 },
      });
      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'featured_products:*',
      );
    });

    it('should NOT invalidate cache when product is NOT featured', async () => {
      mockFeaturedSectionRepository.count.mockResolvedValue(0);

      const result = await service.invalidateIfFeatured(456);

      expect(result).toBe(false);
      expect(mockFeaturedSectionRepository.count).toHaveBeenCalledWith({
        where: { product_id: 456 },
      });
      expect(mockRedisHelper.delByPattern).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockFeaturedSectionRepository.count.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.invalidateIfFeatured(789);

      expect(result).toBe(false);
    });
  });

  describe('invalidateIfAnyFeatured', () => {
    it('should invalidate cache when at least one product is featured', async () => {
      mockFeaturedSectionRepository.count.mockResolvedValue(2);

      const result = await service.invalidateIfAnyFeatured([1, 2, 3]);

      expect(result).toBe(true);
      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'featured_products:*',
      );
    });

    it('should NOT invalidate cache when no products are featured', async () => {
      mockFeaturedSectionRepository.count.mockResolvedValue(0);

      const result = await service.invalidateIfAnyFeatured([4, 5, 6]);

      expect(result).toBe(false);
      expect(mockRedisHelper.delByPattern).not.toHaveBeenCalled();
    });

    it('should return false for empty array', async () => {
      const result = await service.invalidateIfAnyFeatured([]);

      expect(result).toBe(false);
      expect(mockFeaturedSectionRepository.count).not.toHaveBeenCalled();
    });
  });

  describe('invalidateByVariantId', () => {
    it('should invalidate cache when variant belongs to featured product', async () => {
      mockProductVariantRepository.findOne.mockResolvedValue({
        product_id: 100,
      });
      mockFeaturedSectionRepository.count.mockResolvedValue(1);

      const result = await service.invalidateByVariantId(50);

      expect(result).toBe(true);
      expect(mockProductVariantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 50 },
        select: ['product_id'],
      });
      expect(mockFeaturedSectionRepository.count).toHaveBeenCalledWith({
        where: { product_id: 100 },
      });
      expect(mockRedisHelper.delByPattern).toHaveBeenCalled();
    });

    it('should NOT invalidate when variant not found', async () => {
      mockProductVariantRepository.findOne.mockResolvedValue(null);

      const result = await service.invalidateByVariantId(999);

      expect(result).toBe(false);
      expect(mockFeaturedSectionRepository.count).not.toHaveBeenCalled();
      expect(mockRedisHelper.delByPattern).not.toHaveBeenCalled();
    });

    it('should NOT invalidate when product is not featured', async () => {
      mockProductVariantRepository.findOne.mockResolvedValue({
        product_id: 200,
      });
      mockFeaturedSectionRepository.count.mockResolvedValue(0);

      const result = await service.invalidateByVariantId(75);

      expect(result).toBe(false);
      expect(mockRedisHelper.delByPattern).not.toHaveBeenCalled();
    });
  });
});
