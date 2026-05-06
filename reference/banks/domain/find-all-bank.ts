import { Bank } from './bank';

/**
 * Query result type for finding all banks
 */
export type FindAllBank = {
  data: Bank[];
  totalCount: number;
  skip: number;
  take: number;
};
