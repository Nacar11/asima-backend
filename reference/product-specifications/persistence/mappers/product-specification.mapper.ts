import { ProductSpecification } from '@/product-specifications/domain/product-specification';
import { ProductSpecificationEntity } from '../entities/product-specification.entity';
import { getCauser } from '@/utils/helpers/entity.helper';

export class ProductSpecificationMapper {
  static toDomain(raw: ProductSpecificationEntity): ProductSpecification {
    const domainEntity = new ProductSpecification();

    Object.assign(domainEntity, raw);

    if (raw.product) {
      domainEntity.product_id = raw.product.id;
    }

    if (raw.created_by) domainEntity.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domainEntity.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domainEntity.deleted_by = getCauser(raw.deleted_by);

    return domainEntity;
  }

  static toPersistence(
    domainEntity: ProductSpecification,
  ): ProductSpecificationEntity {
    const persistenceEntity = new ProductSpecificationEntity();

    const { product_id, created_by, updated_by, deleted_by, ...primitives } =
      domainEntity;

    Object.assign(persistenceEntity, primitives);

    if (product_id) {
      persistenceEntity.product = { id: product_id } as any;
    }

    if (created_by?.id) {
      persistenceEntity.created_by = { id: created_by.id } as any;
    }

    if (updated_by?.id) {
      persistenceEntity.updated_by = { id: updated_by.id } as any;
    }

    if (deleted_by?.id) {
      persistenceEntity.deleted_by = { id: deleted_by.id } as any;
    }

    return persistenceEntity;
  }
}
