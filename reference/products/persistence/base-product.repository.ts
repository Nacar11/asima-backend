import { Product } from '@/products/domain/product';
import { FindAllProduct } from '@/products/domain/find-all-product';
import { ProductSearchCriteria } from '@/products/domain/product-search-criteria';

/**
 * Abstract repository for product persistence operations
 */
export abstract class BaseProductRepository {
  abstract create(product: Product): Promise<Product>;

  abstract findAll(criteria: ProductSearchCriteria): Promise<FindAllProduct>;

  abstract findById(
    id: number,
    options?: {
      readonly excludeVariants?: boolean;
    },
  ): Promise<Product | null>;

  abstract update(id: number, product: Partial<Product>): Promise<Product>;

  abstract remove(id: number): Promise<void>;

  abstract syncCategories(
    productId: number,
    categoryIds: number[],
  ): Promise<Product>;
}
