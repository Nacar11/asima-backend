import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ProductVariantMapper } from './mappers/product-variant.mapper';
import { BaseProductVariantRepository } from './base-product-variant.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariantEntity])],
  providers: [
    ProductVariantMapper,
    {
      provide: BaseProductVariantRepository,
      useClass: ProductVariantRepository,
    },
    ProductVariantRepository,
  ],
  exports: [
    ProductVariantMapper,
    BaseProductVariantRepository,
    ProductVariantRepository,
  ],
})
export class ProductVariantPersistenceModule {}
