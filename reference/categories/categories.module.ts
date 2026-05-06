import { Module } from '@nestjs/common';
import { CategoriesController } from '@/categories/controllers/categories.controller';
import { AdminCategoriesController } from '@/categories/controllers/admin-categories.controller';
import { CategoriesService } from '@/categories/categories.service';
import { CategoryPersistenceModule } from '@/categories/persistence/persistence.module';

/**
 * Categories module
 * Encapsulates all category-related functionality
 */
@Module({
  imports: [CategoryPersistenceModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
