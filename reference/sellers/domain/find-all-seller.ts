import { Seller } from './seller';
/**
 * Query result type for finding all sellers
 */
export type FindAllSeller = {
  data: Seller[];
  totalCount: number;
  skip: number;
  take: number;
};
