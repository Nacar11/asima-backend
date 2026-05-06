import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductVariant } from '@/product-variants/domain/product-variant';
import { getCauser } from '@/utils/helpers/entity.helper';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class ProductVariantMapper {
  static toDomain(raw: ProductVariantEntity): ProductVariant {
    const domain = new ProductVariant();

    // Map primitive properties
    Object.assign(domain, {
      id: raw.id,
      product_id: raw.product_id,
      sku: raw.sku,
      variant_name: raw.variant_name,
      description: raw.description,
      selling_price: raw.selling_price,
      cost_price: raw.cost_price,
      minimum_order: raw.minimum_order,
      display_order: raw.display_order,
      status: raw.status,
      media_id: raw.media_id,
      media: raw.media ? MediaMapper.toDomain(raw.media) : null,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      deleted_at: raw.deleted_at,
    });

    // Map attribute values relationship (similar to product categories)
    domain.attribute_values = (raw.product_attribute_values || []).map(
      (pav) => ({
        id: pav.id,
        attribute_value_id: pav.attribute_value_id,
        product_attribute_id: pav.product_attribute_id,
        attribute_id:
          pav.attribute_value?.attribute?.id ||
          pav.product_attribute?.attribute_id,
        attribute_name:
          pav.attribute_value?.attribute?.name ||
          pav.product_attribute?.attribute?.name,
        value: pav.attribute_value?.value,
      }),
    );

    // Map inventory stock relationship
    domain.inventory_stock = raw.inventory_stock
      ? {
          id: raw.inventory_stock.id,
          variant_id: raw.inventory_stock.variant_id,
          stock_quantity: raw.inventory_stock.stock_quantity,
          stock_on_hand: raw.inventory_stock.stock_on_hand,
          reserved_quantity: raw.inventory_stock.reserved_quantity,
          available_quantity: raw.inventory_stock.available_quantity,
          min_stock_level: raw.inventory_stock.min_stock_level,
          last_counted_at: raw.inventory_stock.last_counted_at,
        }
      : null;

    // Map relations using getCauser helper (with null checks)
    domain.created_by = raw.created_by ? getCauser(raw.created_by) : undefined;
    domain.updated_by = raw.updated_by ? getCauser(raw.updated_by) : undefined;
    domain.deleted_by = raw.deleted_by ? getCauser(raw.deleted_by) : undefined;

    return domain;
  }

  static toPersistence(domain: ProductVariant): ProductVariantEntity {
    const persistence = new ProductVariantEntity();

    // Map primitive properties, excluding ID and relations
    const primitiveData = Object.fromEntries(
      Object.entries(domain).filter(
        ([key]) =>
          ![
            'id',
            'created_by',
            'updated_by',
            'deleted_by',
            'attribute_values',
            'inventory_stock',
          ].includes(key),
      ),
    );
    Object.assign(persistence, primitiveData);

    // Map ID manually if it exists
    if (domain.id) {
      persistence.id = domain.id;
    }

    // Map User domain objects to UserEntity references
    if (domain.created_by?.id) {
      persistence.created_by = { id: domain.created_by.id } as any;
    }

    if (domain.updated_by?.id) {
      persistence.updated_by = { id: domain.updated_by.id } as any;
    }

    if (domain.deleted_by?.id) {
      persistence.deleted_by = { id: domain.deleted_by.id } as any;
    }

    return persistence;
  }
}
