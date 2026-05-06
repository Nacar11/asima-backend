import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { Product } from '@/products/domain/product';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { ProductAttributeMapper } from '@/product-attributes/persistence/mappers/product-attribute.mapper';
import { ProductVariantMapper } from '@/product-variants/persistence/mappers/product-variant.mapper';
import { ProductSpecificationMapper } from '@/product-specifications/persistence/mappers/product-specification.mapper';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';
import { ProductMediaMappingMapper } from '@/media/persistence/mappers/product-media-mapping.mapper';
import { ProductFeaturedSectionMapper } from '@/featured-products/persistence/mappers/product-featured-section.mapper';

export class ProductMapper {
  static toDomain(raw: ProductEntity): Product {
    const domainEntity = new Product();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).product_categories;
    delete (domainEntity as any).product_attributes;
    delete (domainEntity as any).product_variants;
    delete (domainEntity as any).product_specifications;
    delete (domainEntity as any).product_tags;
    delete (domainEntity as any).product_media_mappings;
    delete (domainEntity as any).featured_sections;
    delete (domainEntity as any).__entity;
    if (raw.seller) {
      domainEntity.seller = {
        id: raw.seller.id,
        store_name: raw.seller.store_name,
        store_description: raw.seller.store_description,
        status: raw.seller.status,
      };
    }

    domainEntity.categories = (raw.product_categories || [])
      .filter((pc) => pc.category)
      .map((pc) => ({
        id: pc.category!.id,
        category_name: pc.category!.category_name,
        is_primary: pc.is_primary,
        display_order: pc.display_order,
      }));

    // Collect all attribute_value_ids that are used in product variants
    // and build a map of attribute_value_id -> is_default
    const usedAttributeValueIds = new Set<number>();
    const attributeValueDefaultMap = new Map<number, boolean>();
    (raw.product_variants || []).forEach((pv) => {
      (pv.product_attribute_values || []).forEach((pav) => {
        usedAttributeValueIds.add(pav.attribute_value_id);
        // If any product_attribute_value marks this as default, set it
        if (pav.is_default) {
          attributeValueDefaultMap.set(pav.attribute_value_id, true);
        } else if (!attributeValueDefaultMap.has(pav.attribute_value_id)) {
          attributeValueDefaultMap.set(pav.attribute_value_id, false);
        }
      });
    });

    // Map product attributes with filtered attribute values and inject is_default
    domainEntity.product_attributes = (raw.product_attributes || []).map(
      (pa) => {
        const domainAttribute = ProductAttributeMapper.toDomain(pa);

        // Filter attribute_values to only include those used in variants
        // and inject is_default from product_attribute_values
        if (domainAttribute.attribute?.attribute_values) {
          const fallbackIds = new Set<number>(pa.attribute_value_ids ?? []);
          const allowedIds =
            usedAttributeValueIds.size > 0
              ? usedAttributeValueIds
              : fallbackIds;
          domainAttribute.attribute.attribute_values =
            domainAttribute.attribute.attribute_values
              .filter((av) => {
                if (allowedIds.size === 0) {
                  return true;
                }
                return allowedIds.has(av.id);
              })
              .map((av) => ({
                ...av,
                is_default: attributeValueDefaultMap.get(av.id) ?? false,
              }));
        }

        return domainAttribute;
      },
    );

    const variants = raw.product_variants || [];
    domainEntity.product_variants = variants.map((pv) =>
      ProductVariantMapper.toDomain(pv),
    );

    domainEntity.product_specifications = (
      raw.product_specifications || []
    ).map((ps) => ProductSpecificationMapper.toDomain(ps));

    // Map product tags to simplified tag structure
    domainEntity.tags = (raw.product_tags || [])
      .filter((pt) => pt.tag) // Only include tags that have the tag relation loaded
      .map((pt) => ({
        id: pt.tag!.id,
        name: pt.tag!.name,
        slug: pt.tag!.slug,
        tag_order: pt.tag_order,
      }));

    // Map product_media_mappings to domain
    domainEntity.product_media_mappings = (
      raw.product_media_mappings || []
    ).map((mm) => ProductMediaMappingMapper.toDomain(mm));

    // Map primary image - find the one marked as primary, or fallback to lowest display_order
    const mediaMappings = (raw.product_media_mappings || [])
      .filter((mm) => mm.media) // Only include mappings that have the media relation loaded
      .sort((a, b) => a.display_order - b.display_order); // Sort by display_order ascending

    const primaryMapping = mediaMappings.find((mm) => mm.is_primary);
    const fallbackMapping = mediaMappings[0]; // First item has lowest display_order

    const selectedMapping = primaryMapping || fallbackMapping;
    domainEntity.primary_image = selectedMapping
      ? MediaMapper.toDomain(selectedMapping.media)
      : null;

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    // Map featured_sections if present
    domainEntity.featured_sections = (raw.featured_sections || []).map((fs) =>
      ProductFeaturedSectionMapper.toDomain(fs),
    );

    return domainEntity;
  }

  static toPersistence(domainEntity: Product): ProductEntity {
    const persistenceEntity = new ProductEntity();

    // Copy scalar fields only (id, product_name, description, status, seller_id, timestamps)
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.product_name = domainEntity.product_name;
    persistenceEntity.description = domainEntity.description ?? null;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.seller_id = domainEntity.seller_id;

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }
}
