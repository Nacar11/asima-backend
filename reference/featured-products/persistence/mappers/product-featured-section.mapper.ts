import { ProductFeaturedSectionEntity } from '@/featured-products/persistence/entities/product-featured-section.entity';
import { ProductFeaturedSection } from '@/featured-products/domain/product-featured-section';
import { getCauser } from '@/utils/helpers/entity.helper';

export class ProductFeaturedSectionMapper {
  static toDomain(raw: ProductFeaturedSectionEntity): ProductFeaturedSection {
    const domainEntity = new ProductFeaturedSection();

    domainEntity.id = raw.id;
    domainEntity.product_id = raw.product_id;
    domainEntity.section = raw.section;
    domainEntity.display_order = raw.display_order;
    domainEntity.featured_at = raw.featured_at;
    domainEntity.created_at = raw.created_at;

    if (raw.featured_by) {
      domainEntity.featured_by = getCauser(raw.featured_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: ProductFeaturedSection,
  ): ProductFeaturedSectionEntity {
    const persistenceEntity = new ProductFeaturedSectionEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.product_id = domainEntity.product_id;
    persistenceEntity.section = domainEntity.section;
    persistenceEntity.display_order = domainEntity.display_order;
    persistenceEntity.featured_at = domainEntity.featured_at;

    return persistenceEntity;
  }
}
