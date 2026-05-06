import { Category } from './category';

/**
 * Query result type for finding all categories
 */
export type FindAllCategory = {
  data: Category[];
  totalCount: number;
  skip: number;
  take: number;
};
