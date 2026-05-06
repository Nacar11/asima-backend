import { DisputeMessage } from '../domain/dispute-message';

/**
 * Abstract base repository for DisputeMessage.
 *
 * Defines the contract for dispute message data access operations.
 *
 * @version 1
 * @since 1.0.0
 */
export abstract class BaseDisputeMessageRepository {
  abstract create(message: DisputeMessage): Promise<DisputeMessage>;
  abstract findByDisputeId(disputeId: number): Promise<DisputeMessage[]>;
}
