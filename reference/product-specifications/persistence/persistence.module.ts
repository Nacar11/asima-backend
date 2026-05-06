import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSpecificationEntity } from './entities/product-specification.entity';
import { ProductSpecificationMapper } from './mappers/product-specification.mapper';
import { BaseProductSpecificationRepository } from './base-product-specification.repository';
import { ProductSpecificationRepository } from './repositories/product-specification.repository';

/**
 * Persistence module for product specifications
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProductSpecificationEntity])],
  providers: [
    ProductSpecificationMapper,
    {
      provide: BaseProductSpecificationRepository,
      useClass: ProductSpecificationRepository,
    },
  ],
  exports: [ProductSpecificationMapper, BaseProductSpecificationRepository],
})
export class ProductSpecificationPersistenceModule {}
