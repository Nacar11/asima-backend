import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { CategoryMapper } from '@/categories/persistence/mappers/category.mapper';
import { CategoryRepository } from '@/categories/persistence/repositories/category.repository';
import { BaseCategoryRepository } from '@/categories/persistence/base-category.repository';

/**
 * Persistence module for categories
 * Encapsulates TypeORM setup and repository configuration
 */
@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [
    CategoryMapper,
    CategoryRepository,
    {
      provide: BaseCategoryRepository,
      useClass: CategoryRepository,
    },
  ],
  exports: [BaseCategoryRepository, CategoryMapper, CategoryRepository],
})
export class CategoryPersistenceModule {}
