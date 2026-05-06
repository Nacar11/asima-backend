import { ModerationItemEntity } from '@/moderation/persistence/entities/moderation-item.entity';
import { ModerationItem } from '@/moderation/domain/moderation-item';
import { getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for ModerationItem domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class ModerationItemMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns ModerationItem domain model
   */
  static toDomain(raw: ModerationItemEntity): ModerationItem {
    const domainEntity = new ModerationItem();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map reporter relation if loaded
    if (raw.reporter) {
      domainEntity.reporter = getUser(raw.reporter);
    }

    // Map reviewer relation if loaded
    if (raw.reviewer) {
      domainEntity.reviewer = getUser(raw.reviewer);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns ModerationItem entity for persistence
   */
  static toPersistence(
    domainEntity: ModerationItem,
  ): Partial<ModerationItemEntity> {
    const persistenceEntity: Partial<ModerationItemEntity> = {};

    Object.assign(persistenceEntity, {
      content_type: domainEntity.content_type,
      content_id: domainEntity.content_id,
      reported_by: domainEntity.reported_by,
      reported_reason: domainEntity.reported_reason,
      status: domainEntity.status,
      priority: domainEntity.priority,
      reviewed_by: domainEntity.reviewed_by,
      reviewed_at: domainEntity.reviewed_at,
      admin_notes: domainEntity.admin_notes,
    });

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
