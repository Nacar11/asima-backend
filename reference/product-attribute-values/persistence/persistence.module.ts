import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeValueEntity } from './entities/product-attribute-value.entity';
import { ProductAttributeValueRepository } from './repositories/product-attribute-value.repository';
import { BaseProductAttributeValueRepository } from './repositories/base-product-attribute-value.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductAttributeValueEntity])],
  providers: [
    {
      provide: BaseProductAttributeValueRepository,
      useClass: ProductAttributeValueRepository,
    },
  ],
  exports: [BaseProductAttributeValueRepository],
})
export class ProductAttributeValuePersistenceModule {}
