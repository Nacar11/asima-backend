import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductMapper } from '@/products/persistence/mappers/product.mapper';
import { ProductRepository } from '@/products/persistence/repositories/product.repository';
import { BaseProductRepository } from '@/products/persistence/base-product.repository';
import { ProductVariantPersistenceModule } from '@/product-variants/persistence/persistence.module';

/**
 * Persistence module for products
 * Encapsulates TypeORM setup and repository configuration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductCategoryEntity,
      ProductTagEntity,
    ]),
    ProductVariantPersistenceModule,
  ],
  providers: [
    ProductMapper,
    {
      provide: BaseProductRepository,
      useClass: ProductRepository,
    },
  ],
  exports: [BaseProductRepository, ProductMapper],
})
export class ProductPersistenceModule {}
