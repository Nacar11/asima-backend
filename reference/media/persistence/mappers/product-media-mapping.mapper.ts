import { ProductMediaMapping } from '@/media/domain/product-media-mapping';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class ProductMediaMappingMapper {
  static toDomain(raw: ProductMediaMappingEntity): ProductMediaMapping {
    const domainEntity = new ProductMediaMapping();
    domainEntity.id = raw.id;
    domainEntity.product_id = raw.product_id;
    domainEntity.media_id = raw.media_id;
    domainEntity.display_order = raw.display_order;
    domainEntity.is_primary = raw.is_primary;
    domainEntity.created_by = raw.created_by;
    domainEntity.created_at = raw.created_at;
    if (raw.media) {
      domainEntity.media = MediaMapper.toDomain(raw.media);
    }
    return domainEntity;
  }

  static toPersistence(
    domainEntity: ProductMediaMapping,
  ): ProductMediaMappingEntity {
    const persistenceEntity = new ProductMediaMappingEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<ProductMediaMapping, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
