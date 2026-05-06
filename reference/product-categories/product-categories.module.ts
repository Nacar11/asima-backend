import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoriesController } from '@/product-categories/product-categories.controller';
import { ProductCategoriesService } from '@/product-categories/product-categories.service';
import { ProductCategoryPersistenceModule } from '@/product-categories/persistence/persistence.module';
import { CategoryPersistenceModule } from '@/categories/persistence/persistence.module';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Module for product-category operations
 */
@Module({
  imports: [
    ProductCategoryPersistenceModule,
    CategoryPersistenceModule,
    TypeOrmModule.forFeature([ProductEntity, SellerEntity]),
  ],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService],
  exports: [ProductCategoriesService],
})
export class ProductCategoriesModule {}
