import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributesService } from './product-attributes.service';
import { ProductAttributesController } from './product-attributes.controller';
import { ProductAttributePersistenceModule } from './persistence/product-attribute-persistence.module';
import { ProductPersistenceModule } from '@/products/persistence/persistence.module';
import { AttributePersistenceModule } from '@/attributes/persistence/attribute-persistence.module';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';

@Module({
  imports: [
    ProductAttributePersistenceModule,
    ProductPersistenceModule,
    AttributePersistenceModule,
    TypeOrmModule.forFeature([AttributeValueEntity]),
  ],
  controllers: [ProductAttributesController],
  providers: [ProductAttributesService],
  exports: [ProductAttributesService],
})
export class ProductAttributesModule {}
