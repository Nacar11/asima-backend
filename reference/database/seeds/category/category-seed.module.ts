import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { CategorySeedService } from '@/database/seeds/category/category-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';

/**
 * Seed module for categories
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, UserEntity, SellerEntity]),
  ],
  providers: [CategorySeedService],
  exports: [CategorySeedService],
})
export class CategorySeedModule {}
