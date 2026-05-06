import { Injectable } from '@nestjs/common';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { ProductCategory } from '@/product-categories/domain/product-category';
import { getCauser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for converting between ProductCategoryEntity and ProductCategory domain
 */
@Injectable()
export class ProductCategoryMapper {
  /**
   * Convert TypeORM entity to domain class
   */
  static toDomain(raw: ProductCategoryEntity): ProductCategory {
    const domainEntity = new ProductCategory();

    domainEntity.id = raw.id;
    domainEntity.product_id = raw.product_id;
    domainEntity.category_id = raw.category_id;
    domainEntity.is_primary = raw.is_primary;
    domainEntity.display_order = raw.display_order;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.category) {
      domainEntity.category = {
        id: raw.category.id,
        category_name: raw.category.category_name,
        description: raw.category.description,
        slug: raw.category.slug,
        display_order: raw.category.display_order,
      };
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain class to TypeORM entity
   */
  static toPersistence(domainEntity: ProductCategory): ProductCategoryEntity {
    const persistenceEntity = new ProductCategoryEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<ProductCategory, 'id'>,
    );
    return persistenceEntity;
  }
}
