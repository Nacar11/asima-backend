import { SubscriptionOperationEntity } from '../entities/subscription-operation.entity';
import {
  SubscriptionOperation,
  SubscriptionOperationSubscription,
} from '@/admin-subscriptions/domain/subscription-operation';
import { getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for SubscriptionOperation domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class SubscriptionOperationMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns SubscriptionOperation domain model
   */
  static toDomain(raw: SubscriptionOperationEntity): SubscriptionOperation {
    const domainEntity = new SubscriptionOperation();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map performer relation if loaded
    if (raw.performer) {
      domainEntity.performer = getUser(raw.performer);
    }

    // Map subscription relation if loaded
    if (raw.subscription) {
      const subscription: SubscriptionOperationSubscription = {
        subscription_number: raw.subscription.subscription_number,
        status: raw.subscription.status,
        start_date: raw.subscription.start_date,
        end_date: raw.subscription.end_date,
      };
      domainEntity.subscription = subscription;
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns SubscriptionOperation entity for persistence
   */
  static toPersistence(
    domainEntity: SubscriptionOperation,
  ): Partial<SubscriptionOperationEntity> {
    const persistenceEntity: Partial<SubscriptionOperationEntity> = {};

    Object.assign(persistenceEntity, {
      subscription_id: domainEntity.subscription_id,
      operation_type: domainEntity.operation_type,
      performed_by: domainEntity.performed_by,
      reason: domainEntity.reason || null,
      metadata: domainEntity.metadata || null,
    });

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
