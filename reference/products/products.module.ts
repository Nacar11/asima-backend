import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from '@/products/products.controller';
import { ProductsService } from '@/products/products.service';
import { ProductPersistenceModule } from '@/products/persistence/persistence.module';
import { ProductMapper } from '@/products/persistence/mappers/product.mapper';
import { SellersModule } from '@/sellers/sellers.module';
import { ProductVariantsModule } from '@/product-variants/product-variants.module';
import { UserSearchHistoriesModule } from '@/user-search-histories/user-search-histories.module';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { FeaturedProductsModule } from '@/featured-products/featured-products.module';
import { ProductCacheService } from '@/products/product-cache.service';
import { RedisHelper } from '@/utils/helpers/redis.helper';

/**
 * Products module
 * Encapsulates all product-related functionality
 */
@Module({
  imports: [
    ProductPersistenceModule,
    TypeOrmModule.forFeature([ReviewEntity]),
    SellersModule,
    ProductVariantsModule,
    UserSearchHistoriesModule,
    FeaturedProductsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductMapper, ProductCacheService, RedisHelper],
  exports: [ProductsService, ProductCacheService],
})
export class ProductsModule {}
