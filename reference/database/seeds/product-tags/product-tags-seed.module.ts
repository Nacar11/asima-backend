import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { ProductTagsSeedService } from '@/database/seeds/product-tags/product-tags-seed.service';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for product tags
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductTagEntity,
      ProductEntity,
      TagEntity,
      UserEntity,
    ]),
  ],
  providers: [ProductTagsSeedService],
  exports: [ProductTagsSeedService],
})
export class ProductTagsSeedModule {}
