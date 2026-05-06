import { Category } from '@/categories/domain/category';
import { FindAllCategory } from '@/categories/domain/find-all-category';
import { CategorySearchCriteria } from '@/categories/domain/category-search-criteria';

/**
 * Abstract repository for category persistence operations
 */
export abstract class BaseCategoryRepository {
  abstract create(category: Category): Promise<Category>;

  abstract findAll(criteria: CategorySearchCriteria): Promise<FindAllCategory>;

  abstract findById(id: number): Promise<Category | null>;

  abstract update(id: number, category: Partial<Category>): Promise<Category>;

  abstract remove(id: number): Promise<void>;

  abstract findGlobalCategories(): Promise<Category[]>;
}
