import { Product } from './product';

/**
 * Query result type for finding all products
 */
export type FindAllProduct = {
  data: Product[];
  totalCount: number;
  skip: number;
  take: number;
};
