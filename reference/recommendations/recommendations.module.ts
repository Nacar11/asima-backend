import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from '@/recommendations/recommendations.controller';
import { RecommendationsService } from '@/recommendations/recommendations.service';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { ProductPersistenceModule } from '@/products/persistence/persistence.module';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

@Module({
  imports: [
    ProductPersistenceModule,
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductCategoryEntity,
      CategoryEntity,
      ProductVariantEntity,
      InventoryStockEntity,
      ReviewEntity,
      SalesOrderItemEntity,
      SellerEntity,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RedisHelper],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
