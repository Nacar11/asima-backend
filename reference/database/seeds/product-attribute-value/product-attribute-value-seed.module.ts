import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeValueEntity } from '@/product-attribute-values/persistence/entities/product-attribute-value.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductAttributeValueSeedService } from './product-attribute-value-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductAttributeValueEntity,
      ProductVariantEntity,
      ProductAttributeEntity,
      AttributeValueEntity,
      UserEntity,
    ]),
  ],
  providers: [ProductAttributeValueSeedService],
  exports: [ProductAttributeValueSeedService],
})
export class ProductAttributeValueSeedModule {}
