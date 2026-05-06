import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeEntity } from '@/product-attributes/persistence/entities/product-attribute.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductAttributeSeedService } from './product-attribute-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductAttributeEntity,
      AttributeEntity,
      AttributeValueEntity,
      ProductEntity,
      UserEntity,
    ]),
  ],
  providers: [ProductAttributeSeedService],
  exports: [ProductAttributeSeedService],
})
export class ProductAttributeSeedModule {}
