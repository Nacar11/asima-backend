import { ProductCategory } from '@/product-categories/domain/product-category';

/**
 * Find all product categories query result type
 */
export type FindAllProductCategory = {
  data: ProductCategory[];
  totalCount: number;
  page: number;
  limit: number;
};
