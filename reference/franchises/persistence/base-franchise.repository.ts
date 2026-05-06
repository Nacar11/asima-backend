import { Franchise } from '@/franchises/domain/franchise';
import { FindAllFranchise } from '@/franchises/domain/find-all-franchise';
import { QueryFranchiseDto } from '@/franchises/dto/query-franchise.dto';

/**
 * Abstract repository for franchise persistence operations
 */
export abstract class BaseFranchiseRepository {
  abstract create(franchise: Franchise): Promise<Franchise>;

  abstract findAll(query: QueryFranchiseDto): Promise<FindAllFranchise>;

  abstract findById(id: number): Promise<Franchise | null>;

  abstract update(
    id: number,
    franchise: Partial<Franchise>,
  ): Promise<Franchise>;

  abstract remove(id: number): Promise<void>;
}
