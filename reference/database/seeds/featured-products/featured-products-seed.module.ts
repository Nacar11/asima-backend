import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductFeaturedSectionEntity } from '@/featured-products/persistence/entities/product-featured-section.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FeaturedProductsSeedService } from './featured-products-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductFeaturedSectionEntity,
      ProductEntity,
      UserEntity,
    ]),
  ],
  providers: [FeaturedProductsSeedService],
  exports: [FeaturedProductsSeedService],
})
export class FeaturedProductsSeedModule {}
