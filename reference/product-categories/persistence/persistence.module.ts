import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductCategoryMapper } from '@/product-categories/persistence/mappers/product-category.mapper';
import { BaseProductCategoryRepository } from '@/product-categories/persistence/repositories/base-product-category.repository';
import { ProductCategoryRepository } from '@/product-categories/persistence/repositories/product-category.repository';

/**
 * Persistence module for product-category
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProductCategoryEntity])],
  providers: [
    ProductCategoryMapper,
    {
      provide: BaseProductCategoryRepository,
      useClass: ProductCategoryRepository,
    },
  ],
  exports: [ProductCategoryMapper, BaseProductCategoryRepository],
})
export class ProductCategoryPersistenceModule {}
