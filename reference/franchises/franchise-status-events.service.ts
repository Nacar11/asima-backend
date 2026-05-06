import { Injectable } from '@nestjs/common';
import { BaseFranchiseStatusEventRepository } from '@/franchises/persistence/base-franchise-status-event.repository';
import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { FranchiseStatusEnum } from '@/franchises/domain/franchise-status.enum';
import { Causer } from '@/utils/domain/causer';

/**
 * Service for franchise status event business logic
 */
@Injectable()
export class FranchiseStatusEventsService {
  constructor(
    private readonly repository: BaseFranchiseStatusEventRepository,
  ) {}

  /**
   * Create a status change event for audit trail
   */
  async createEvent(
    franchiseId: number,
    previousStatus: FranchiseStatusEnum | null,
    newStatus: FranchiseStatusEnum,
    description: string | null,
    causer: Causer,
  ): Promise<FranchiseStatusEvent> {
    return this.repository.create(
      franchiseId,
      previousStatus,
      newStatus,
      description,
      causer.id,
    );
  }

  /**
   * Get status history for a franchise
   */
  async getStatusHistory(franchiseId: number): Promise<FranchiseStatusEvent[]> {
    return this.repository.findByFranchiseId(franchiseId);
  }
}
