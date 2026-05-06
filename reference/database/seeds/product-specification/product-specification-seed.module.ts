import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSpecificationEntity } from '@/product-specifications/persistence/entities/product-specification.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductSpecificationSeedService } from './product-specification-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductSpecificationEntity,
      ProductEntity,
      UserEntity,
    ]),
  ],
  providers: [ProductSpecificationSeedService],
  exports: [ProductSpecificationSeedService],
})
export class ProductSpecificationSeedModule {}
