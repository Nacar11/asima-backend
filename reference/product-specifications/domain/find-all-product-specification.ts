import { ProductSpecification } from './product-specification';

/**
 * Query result type for paginated product specifications
 */
export type FindAllProductSpecification = {
  data: ProductSpecification[];
  totalCount: number;
  page: number;
  limit: number;
};
