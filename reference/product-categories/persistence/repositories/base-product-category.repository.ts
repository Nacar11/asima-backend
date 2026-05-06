import { ProductCategory } from '@/product-categories/domain/product-category';

/**
 * Abstract repository for product-category persistence operations
 */
export abstract class BaseProductCategoryRepository {
  abstract syncCategories(
    productId: number,
    categoryIds: number[],
  ): Promise<ProductCategory[]>;

  abstract findAll(
    sellerUserId: number,
    productId?: number,
    categoryName?: string,
  ): Promise<ProductCategory[]>;
}
