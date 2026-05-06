import { ReviewMediaMapping } from '@/media/domain/review-media-mapping';
import { ReviewMediaMappingEntity } from '@/media/persistence/entities/review-media-mapping.entity';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class ReviewMediaMappingMapper {
  static toDomain(raw: ReviewMediaMappingEntity): ReviewMediaMapping {
    const domainEntity = new ReviewMediaMapping();
    domainEntity.id = raw.id;
    domainEntity.review_id = raw.review_id;
    domainEntity.media_id = raw.media_id;
    domainEntity.display_order = raw.display_order;
    domainEntity.created_by = raw.created_by;
    domainEntity.created_at = raw.created_at;
    if (raw.media) {
      domainEntity.media = MediaMapper.toDomain(raw.media);
    }
    return domainEntity;
  }

  static toPersistence(
    domainEntity: ReviewMediaMapping,
  ): ReviewMediaMappingEntity {
    const persistenceEntity = new ReviewMediaMappingEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<ReviewMediaMapping, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
