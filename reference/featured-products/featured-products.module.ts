import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ProductFeaturedSectionEntity } from './persistence/entities/product-featured-section.entity';
import { FeaturedProductsService } from './featured-products.service';
import { FeaturedProductsCacheService } from './featured-products-cache.service';
import {
  FeaturedProductsPublicController,
  FeaturedProductsAdminController,
  FeaturedProductsAdminSingleController,
} from './featured-products.controller';
import { RedisHelper } from '@/utils/helpers/redis.helper';

/**
 * Featured Products Module
 *
 * Provides endpoints for managing and retrieving featured products.
 * Uses a junction table (product_featured_sections) to allow products
 * to be featured in multiple sections simultaneously.
 *
 * Endpoints:
 * - Public API: GET /api/v1/products/featured
 * - Admin API: GET /api/v1/admin/products/featured
 * - Admin API: POST /api/v1/admin/products/:id/featured
 * - Admin API: PATCH /api/v1/admin/products/:id/unfeatured
 * - Admin API: POST /api/v1/admin/products/featured/batch
 * - Admin API: PUT /api/v1/admin/products/featured/reorder
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductFeaturedSectionEntity,
      ProductVariantEntity,
      ReviewEntity,
    ]),
  ],
  controllers: [
    FeaturedProductsPublicController,
    FeaturedProductsAdminController,
    FeaturedProductsAdminSingleController,
  ],
  providers: [
    FeaturedProductsService,
    FeaturedProductsCacheService,
    RedisHelper,
  ],
  exports: [FeaturedProductsService, FeaturedProductsCacheService],
})
export class FeaturedProductsModule {}
