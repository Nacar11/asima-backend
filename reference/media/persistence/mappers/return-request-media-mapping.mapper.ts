import { ReturnRequestMediaMapping } from '@/media/domain/return-request-media-mapping';
import { ReturnRequestMediaMappingEntity } from '@/media/persistence/entities/return-request-media-mapping.entity';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class ReturnRequestMediaMappingMapper {
  static toDomain(
    raw: ReturnRequestMediaMappingEntity,
  ): ReturnRequestMediaMapping {
    const domainEntity = new ReturnRequestMediaMapping();
    domainEntity.id = raw.id;
    domainEntity.return_request_id = raw.return_request_id;
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
    domainEntity: ReturnRequestMediaMapping,
  ): ReturnRequestMediaMappingEntity {
    const persistenceEntity = new ReturnRequestMediaMappingEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<ReturnRequestMediaMapping, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
