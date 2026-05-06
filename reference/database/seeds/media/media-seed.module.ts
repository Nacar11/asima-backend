import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { MediaSeedService } from './media-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaEntity,
      ProductMediaMappingEntity,
      ProductEntity,
      ProductVariantEntity,
      SellerEntity,
      UserEntity,
      CategoryEntity,
    ]),
  ],
  providers: [MediaSeedService],
  exports: [MediaSeedService],
})
export class MediaSeedModule {}
