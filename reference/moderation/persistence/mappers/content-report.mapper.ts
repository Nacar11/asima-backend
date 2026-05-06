import { ContentReportEntity } from '@/moderation/persistence/entities/content-report.entity';
import { ContentReport } from '@/moderation/domain/content-report';
import { getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for ContentReport domain and persistence models.
 *
 * Handles bidirectional conversion between domain models and persistence entities.
 *
 * @version 1
 * @since 1.0.0
 */
export class ContentReportMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns ContentReport domain model
   */
  static toDomain(raw: ContentReportEntity): ContentReport {
    const domainEntity = new ContentReport();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Map reporter relation if loaded
    if (raw.reporter) {
      domainEntity.reporter = getUser(raw.reporter);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model
   * @returns ContentReport entity for persistence
   */
  static toPersistence(
    domainEntity: ContentReport,
  ): Partial<ContentReportEntity> {
    const persistenceEntity: Partial<ContentReportEntity> = {};

    Object.assign(persistenceEntity, {
      content_type: domainEntity.content_type,
      content_id: domainEntity.content_id,
      reported_by: domainEntity.reported_by,
      reason: domainEntity.reason,
      details: domainEntity.details,
      status: domainEntity.status,
    });

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
