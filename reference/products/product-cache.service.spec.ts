import { Test, TestingModule } from '@nestjs/testing';
import { ProductCacheService } from './product-cache.service';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { Product } from './domain/product';

describe('ProductCacheService', () => {
  let service: ProductCacheService;
  let mockRedisHelper: any;

  const mockProduct: Partial<Product> = {
    id: 1,
    product_name: 'Test Product',
    description: 'Test Description',
    status: 'Published',
    seller_id: 10,
    average_rating: 4.5,
    total_reviews: 100,
  };

  beforeEach(async () => {
    mockRedisHelper = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCacheService,
        {
          provide: RedisHelper,
          useValue: mockRedisHelper,
        },
      ],
    }).compile();

    service = module.get<ProductCacheService>(ProductCacheService);
  });

  describe('get', () => {
    it('should return cached product when cache hit', async () => {
      mockRedisHelper.get.mockResolvedValue(JSON.stringify(mockProduct));

      const result = await service.get(1, false);

      expect(result).toEqual(mockProduct);
      expect(mockRedisHelper.get).toHaveBeenCalledWith(
        'product_detail:1:with_variants',
      );
    });

    it('should return null when cache miss', async () => {
      mockRedisHelper.get.mockResolvedValue(null);

      const result = await service.get(1, false);

      expect(result).toBeNull();
    });

    it('should use correct cache key for excludeVariants=true', async () => {
      mockRedisHelper.get.mockResolvedValue(null);

      await service.get(1, true);

      expect(mockRedisHelper.get).toHaveBeenCalledWith(
        'product_detail:1:no_variants',
      );
    });

    it('should return null on error', async () => {
      mockRedisHelper.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get(1, false);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache product with correct key and TTL', async () => {
      await service.set(1, mockProduct as Product, false);

      expect(mockRedisHelper.set).toHaveBeenCalledWith(
        'product_detail:1:with_variants',
        JSON.stringify(mockProduct),
        300,
      );
    });

    it('should use correct cache key for excludeVariants=true', async () => {
      await service.set(1, mockProduct as Product, true);

      expect(mockRedisHelper.set).toHaveBeenCalledWith(
        'product_detail:1:no_variants',
        JSON.stringify(mockProduct),
        300,
      );
    });

    it('should not throw on error', async () => {
      mockRedisHelper.set.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.set(1, mockProduct as Product, false),
      ).resolves.not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('should delete all cache keys for a product', async () => {
      await service.invalidate(1);

      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'product_detail:1:*',
      );
    });

    it('should not throw on error', async () => {
      mockRedisHelper.delByPattern.mockRejectedValue(new Error('Redis error'));

      await expect(service.invalidate(1)).resolves.not.toThrow();
    });
  });

  describe('invalidateMany', () => {
    it('should invalidate cache for multiple products', async () => {
      await service.invalidateMany([1, 2, 3]);

      expect(mockRedisHelper.delByPattern).toHaveBeenCalledTimes(3);
      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'product_detail:1:*',
      );
      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'product_detail:2:*',
      );
      expect(mockRedisHelper.delByPattern).toHaveBeenCalledWith(
        'product_detail:3:*',
      );
    });

    it('should handle empty array', async () => {
      await service.invalidateMany([]);

      expect(mockRedisHelper.delByPattern).not.toHaveBeenCalled();
    });
  });
});
