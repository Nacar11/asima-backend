import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProductCategorySeedService } from './product-category-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategoryEntity,
      ProductEntity,
      CategoryEntity,
      UserEntity,
    ]),
  ],
  providers: [ProductCategorySeedService],
  exports: [ProductCategorySeedService],
})
export class ProductCategorySeedModule {}
