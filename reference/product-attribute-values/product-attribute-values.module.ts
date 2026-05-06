import { Module } from '@nestjs/common';
import { ProductAttributeValuePersistenceModule } from './persistence/persistence.module';
import { ProductAttributeValuesService } from './product-attribute-values.service';
import { ProductAttributeValuesController } from './product-attribute-values.controller';

@Module({
  imports: [ProductAttributeValuePersistenceModule],
  controllers: [ProductAttributeValuesController],
  providers: [ProductAttributeValuesService],
  exports: [ProductAttributeValuesService],
})
export class ProductAttributeValuesModule {}
