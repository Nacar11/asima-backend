import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';

/**
 * Abstract repository for franchise status event persistence operations
 */
export abstract class BaseFranchiseStatusEventRepository {
  abstract create(
    franchiseId: number,
    previousStatus: FranchiseStatusEnum | null,
    newStatus: FranchiseStatusEnum,
    description: string | null,
    createdById: number,
  ): Promise<FranchiseStatusEvent>;

  abstract findByFranchiseId(
    franchiseId: number,
  ): Promise<FranchiseStatusEvent[]>;
}
