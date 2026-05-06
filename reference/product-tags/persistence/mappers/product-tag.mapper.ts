import { ProductTag } from '@/product-tags/domain/product-tag';
import { ProductTagEntity } from '@/product-tags/persistence/entities/product-tag.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ProductTagMapper {
  static toDomain(raw: ProductTagEntity): ProductTag {
    const productTag = new ProductTag();
    productTag.id = raw.id;
    productTag.product_id = raw.product_id;
    productTag.tag_id = raw.tag_id;
    productTag.tag_order = raw.tag_order;
    productTag.created_at = raw.created_at;

    if (raw.creator) {
      productTag.created_by = UserMapper.toDomain(raw.creator);
    }

    return productTag;
  }

  static toPersistence(productTag: ProductTag): ProductTagEntity {
    const entity = new ProductTagEntity();

    if (productTag.id) {
      entity.id = productTag.id;
    }

    entity.product_id = productTag.product_id;
    entity.tag_id = productTag.tag_id;
    entity.tag_order = productTag.tag_order ?? 0;

    if (productTag.created_at) {
      entity.created_at = productTag.created_at;
    }

    if (productTag.created_by && typeof productTag.created_by === 'object') {
      entity.created_by = productTag.created_by.id;
    }

    return entity;
  }
}
