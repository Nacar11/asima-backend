import { ProductAttributeEntity } from '../entities/product-attribute.entity';
import { ProductAttribute } from '../../domain/product-attribute';
import { getCauser } from '@/utils/helpers/entity.helper';
import { AttributeMapper } from '@/attributes/persistence/mappers/attribute.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';
import { Product } from '@/products/domain/product';

export class ProductAttributeMapper {
  static toDomain(entity: ProductAttributeEntity): ProductAttribute {
    const domain = new ProductAttribute();

    Object.assign(domain, entity);

    if (entity.product) {
      // Only map basic product info to avoid circular dependencies
      domain.product = {
        id: entity.product.id,
        product_name: entity.product.product_name,
        description: entity.product.description,
        status: entity.product.status as any,
        seller_id: entity.product.seller_id,
        created_at: entity.product.created_at,
        updated_at: entity.product.updated_at,
      } as Product;
    }

    if (entity.attribute) {
      domain.attribute = AttributeMapper.toDomain(entity.attribute);
    }

    if (entity.created_by) {
      domain.created_by = getCauser(entity.created_by);
    }

    if (entity.updated_by) {
      domain.updated_by = getCauser(entity.updated_by);
    }

    if (entity.deleted_by) {
      domain.deleted_by = getCauser(entity.deleted_by);
    }

    return domain;
  }

  static toPersistence(domain: ProductAttribute): ProductAttributeEntity {
    const entity = new ProductAttributeEntity();

    Object.assign(
      entity,
      domain as Omit<
        ProductAttribute,
        | 'id'
        | 'product'
        | 'attribute'
        | 'created_by'
        | 'updated_by'
        | 'deleted_by'
      >,
    );

    if (domain.id) {
      entity.id = domain.id;
    }

    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }

    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }

    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    return entity;
  }
}
