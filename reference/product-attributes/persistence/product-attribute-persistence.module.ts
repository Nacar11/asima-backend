import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeEntity } from './entities/product-attribute.entity';
import { ProductAttributeRepository } from './repositories/product-attribute.repository';
import { BaseProductAttributeRepository } from './repositories/base-product-attribute.repository';
import { ProductAttributeMapper } from './mappers/product-attribute.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([ProductAttributeEntity])],
  providers: [
    ProductAttributeRepository,
    {
      provide: BaseProductAttributeRepository,
      useClass: ProductAttributeRepository,
    },
    ProductAttributeMapper,
  ],
  exports: [BaseProductAttributeRepository, ProductAttributeMapper],
})
export class ProductAttributePersistenceModule {}
