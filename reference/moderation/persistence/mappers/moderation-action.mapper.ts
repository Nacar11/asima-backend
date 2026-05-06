import { ModerationActionEntity } from '@/moderation/persistence/entities/moderation-action.entity';
import { ModerationAction } from '@/moderation/domain/moderation-action';
import { getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for ModerationAction domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class ModerationActionMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns ModerationAction domain model
   */
  static toDomain(raw: ModerationActionEntity): ModerationAction {
    const domainEntity = new ModerationAction();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map performer relation if loaded
    if (raw.performer) {
      domainEntity.performer = getUser(raw.performer);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns ModerationAction entity for persistence
   */
  static toPersistence(
    domainEntity: ModerationAction,
  ): Partial<ModerationActionEntity> {
    const persistenceEntity: Partial<ModerationActionEntity> = {};

    Object.assign(persistenceEntity, {
      moderation_item_id: domainEntity.moderation_item_id,
      action: domainEntity.action,
      reason: domainEntity.reason,
      admin_notes: domainEntity.admin_notes,
      performed_by: domainEntity.performed_by,
    });

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
