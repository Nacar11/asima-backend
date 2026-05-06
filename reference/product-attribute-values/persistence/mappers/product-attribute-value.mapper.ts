import { ProductAttributeValueEntity } from '../entities/product-attribute-value.entity';
import { ProductAttributeValue } from '@/product-attribute-values/domain/product-attribute-value';
import { getCauser } from '@/utils/helpers/entity.helper';

export class ProductAttributeValueMapper {
  static toDomain(raw: ProductAttributeValueEntity): ProductAttributeValue {
    const domain = new ProductAttributeValue();

    // Map primitive properties
    Object.assign(domain, {
      id: raw.id,
      product_variant_id: raw.product_variant_id,
      product_attribute_id: raw.product_attribute_id,
      attribute_value_id: raw.attribute_value_id,
      is_default: raw.is_default ?? false,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      deleted_at: raw.deleted_at,
    });

    // Map relations using getCauser helper
    // Note: created_by, updated_by, deleted_by are now numbers (user IDs), not UserEntity objects
    domain.created_by = raw.created_by
      ? getCauser({ id: raw.created_by } as any)
      : undefined;
    domain.updated_by = raw.updated_by
      ? getCauser({ id: raw.updated_by } as any)
      : undefined;
    domain.deleted_by = raw.deleted_by
      ? getCauser({ id: raw.deleted_by } as any)
      : undefined;

    return domain;
  }

  static toPersistence(
    domain: ProductAttributeValue,
  ): ProductAttributeValueEntity {
    const persistence = new ProductAttributeValueEntity();

    // Map primitive properties, excluding ID and relations
    const primitiveData = Object.fromEntries(
      Object.entries(domain).filter(
        ([key]) =>
          !['id', 'created_by', 'updated_by', 'deleted_by'].includes(key),
      ),
    );
    Object.assign(persistence, primitiveData);

    // Map ID manually if it exists
    if (domain.id) {
      persistence.id = domain.id;
    }

    // Map User domain objects to user IDs (numbers)
    if (domain.created_by?.id) {
      persistence.created_by = domain.created_by.id;
    }

    if (domain.updated_by?.id) {
      persistence.updated_by = domain.updated_by.id;
    }

    if (domain.deleted_by?.id) {
      persistence.deleted_by = domain.deleted_by.id;
    }

    return persistence;
  }
}
