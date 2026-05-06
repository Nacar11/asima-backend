import { Injectable, Logger } from '@nestjs/common';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { Product } from './domain/product';

/**
 * Cache configuration for product details
 */
const PRODUCT_CACHE_CONFIG = {
  PREFIX: 'product_detail',
  TTL: 300, // 5 minutes in seconds
};

/**
 * Service for caching individual product details.
 * Caches product detail responses to reduce database load for frequently viewed products.
 */
@Injectable()
export class ProductCacheService {
  private readonly logger = new Logger(ProductCacheService.name);

  constructor(private readonly redisHelper: RedisHelper) {}

  /**
   * Build cache key for a product
   * @param productId - Product ID
   * @param excludeVariants - Whether variants are excluded from the response
   */
  private buildCacheKey(productId: number, excludeVariants: boolean): string {
    return `${PRODUCT_CACHE_CONFIG.PREFIX}:${productId}:${excludeVariants ? 'no_variants' : 'with_variants'}`;
  }

  /**
   * Get cached product detail
   * @param productId - Product ID
   * @param excludeVariants - Whether variants are excluded
   * @returns Cached product or null if not cached
   */
  async get(
    productId: number,
    excludeVariants: boolean = false,
  ): Promise<Product | null> {
    const cacheKey = this.buildCacheKey(productId, excludeVariants);

    try {
      const cached = await this.redisHelper.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT for product ${productId}`);
        return JSON.parse(cached) as Product;
      }
      this.logger.debug(`Cache MISS for product ${productId}`);
      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to get cached product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Cache product detail
   * @param productId - Product ID
   * @param product - Product data to cache
   * @param excludeVariants - Whether variants are excluded
   */
  async set(
    productId: number,
    product: Product,
    excludeVariants: boolean = false,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(productId, excludeVariants);

    try {
      await this.redisHelper.set(
        cacheKey,
        JSON.stringify(product),
        PRODUCT_CACHE_CONFIG.TTL,
      );
      this.logger.debug(`Cached product ${productId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to cache product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Invalidate cache for a specific product (both variants)
   * @param productId - Product ID to invalidate
   */
  async invalidate(productId: number): Promise<void> {
    try {
      const pattern = `${PRODUCT_CACHE_CONFIG.PREFIX}:${productId}:*`;
      const deleted = await this.redisHelper.delByPattern(pattern);
      if (deleted > 0) {
        this.logger.log(
          `Invalidated cache for product ${productId}: ${deleted} keys deleted`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate cache for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Invalidate cache for multiple products
   * @param productIds - Product IDs to invalidate
   */
  async invalidateMany(productIds: number[]): Promise<void> {
    for (const productId of productIds) {
      await this.invalidate(productId);
    }
  }
}
