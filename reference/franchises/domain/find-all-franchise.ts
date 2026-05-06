import { Franchise } from './franchise';

/**
 * Query result type for finding all franchises
 */
export type FindAllFranchise = {
  data: Franchise[];
  totalCount: number;
  skip: number;
  take: number;
};
