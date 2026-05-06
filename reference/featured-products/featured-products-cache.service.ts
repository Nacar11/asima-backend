import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductFeaturedSectionEntity } from './persistence/entities/product-featured-section.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { RedisHelper } from '@/utils/helpers/redis.helper';

/**
 * Cache key prefix for featured products (must match FeaturedProductsService)
 */
const CACHE_PREFIX = 'featured_products';

/**
 * Service for managing featured products cache invalidation.
 * Uses smart invalidation - only clears cache if the affected product is actually featured.
 */
@Injectable()
export class FeaturedProductsCacheService {
  private readonly logger = new Logger(FeaturedProductsCacheService.name);

  constructor(
    @InjectRepository(ProductFeaturedSectionEntity)
    private readonly featuredSectionRepository: Repository<ProductFeaturedSectionEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    private readonly redisHelper: RedisHelper,
  ) {}

  /**
   * Invalidate featured products cache if the given product is featured.
   *
   * @param productId - The ID of the product that was modified
   * @returns Promise<boolean> - true if cache was invalidated, false if product wasn't featured
   */
  async invalidateIfFeatured(productId: number): Promise<boolean> {
    try {
      const count = await this.featuredSectionRepository.count({
        where: { product_id: productId },
      });

      if (count === 0) {
        this.logger.debug(
          `Product ${productId} is not featured, skipping cache invalidation`,
        );
        return false;
      }

      const deleted = await this.redisHelper.delByPattern(`${CACHE_PREFIX}:*`);
      this.logger.log(
        `Cache invalidated for featured product ${productId}: ${deleted} keys deleted`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for product ${productId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Invalidate featured products cache if any of the given products are featured.
   *
   * @param productIds - The IDs of the products that were modified
   * @returns Promise<boolean> - true if cache was invalidated, false if no products were featured
   */
  async invalidateIfAnyFeatured(productIds: number[]): Promise<boolean> {
    if (productIds.length === 0) {
      return false;
    }

    try {
      const count = await this.featuredSectionRepository.count({
        where: { product_id: In(productIds) },
      });

      if (count === 0) {
        this.logger.debug(
          `None of the ${productIds.length} products are featured, skipping cache invalidation`,
        );
        return false;
      }

      const deleted = await this.redisHelper.delByPattern(`${CACHE_PREFIX}:*`);
      this.logger.log(
        `Cache invalidated for ${count} featured product(s) among ${productIds.length} modified: ${deleted} keys deleted`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for products [${productIds.join(', ')}]`,
        error,
      );
      return false;
    }
  }

  /**
   * Invalidate featured products cache if the product associated with a variant is featured.
   *
   * @param variantId - The ID of the product variant that was modified
   * @returns Promise<boolean> - true if cache was invalidated, false if product wasn't featured
   */
  async invalidateByVariantId(variantId: number): Promise<boolean> {
    try {
      const variant = await this.productVariantRepository.findOne({
        where: { id: variantId },
        select: ['product_id'],
      });

      if (!variant) {
        this.logger.debug(
          `Variant ${variantId} not found, skipping cache invalidation`,
        );
        return false;
      }

      return this.invalidateIfFeatured(variant.product_id);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for variant ${variantId}`,
        error,
      );
      return false;
    }
  }
}
