import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductVariantSeedService } from './product-variant-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariantEntity, ProductEntity, UserEntity]),
  ],
  providers: [ProductVariantSeedService],
  exports: [ProductVariantSeedService],
})
export class ProductVariantSeedModule {}
