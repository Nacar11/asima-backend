import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SalesOrderItem } from '@/sales-orders/domain/sales-order-item';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Mapper for SalesOrderItem domain and persistence models
 */
export class SalesOrderItemMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(raw: SalesOrderItemEntity): SalesOrderItem {
    // Get variant-specific image URL
    let variantImageUrl: string | null = null;
    if (raw.variant?.media) {
      variantImageUrl =
        raw.variant.media.compressed_path ||
        raw.variant.media.file_path ||
        null;
    }

    // Get product image URL (primary from product_media_mappings)
    let productImageUrl: string | null = null;
    if (raw.variant?.product?.product_media_mappings?.length) {
      const primaryMapping =
        raw.variant.product.product_media_mappings.find((m) => m.is_primary) ||
        raw.variant.product.product_media_mappings[0];
      if (primaryMapping?.media) {
        productImageUrl =
          primaryMapping.media.compressed_path ||
          primaryMapping.media.file_path ||
          null;
      }
    }

    // Build service address snapshot
    let serviceAddress: SalesOrderItem['service_address'] = undefined;
    if (raw.service_address) {
      const addr = raw.service_address;
      const fullAddressParts = [
        addr.recipient_name,
        addr.address_line1,
        addr.address_line2,
        addr.city,
        addr.state_province,
        addr.postal_code,
        addr.country,
      ].filter(Boolean);

      serviceAddress = {
        id: addr.id,
        recipient_name: addr.recipient_name,
        phone: addr.phone ?? '',
        address_line1: addr.address_line1,
        address_line2: addr.address_line2 ?? null,
        city: addr.city,
        state_province: addr.state_province,
        postal_code: addr.postal_code,
        country: addr.country,
        full_address: fullAddressParts.join(', '),
      };
    }

    // Return a plain object literal (not a class instance) to prevent
    // ClassSerializerInterceptor / instanceToPlain() crash.
    const domainEntity: SalesOrderItem = {
      id: raw.id,
      order_id: raw.order_id,
      item_type: raw.item_type,
      variant_id: raw.variant_id ?? null,
      service_id: raw.service_id ?? null,
      package_id: raw.package_id ?? null,
      quantity: raw.quantity,
      unit_price: Number(raw.unit_price),
      total_price: Number(raw.total_price),
      scheduled_date: raw.scheduled_date ?? null,
      scheduled_start_time: raw.scheduled_start_time ?? null,
      service_address_id: raw.service_address_id ?? null,
      special_requests: raw.special_requests ?? null,
      location_additional_fee: raw.location_additional_fee
        ? Number(raw.location_additional_fee)
        : null,

      review_id: raw.reviews?.length ? raw.reviews[0].id : null,

      // MEPF Flow Fields
      source_quotation_id: raw.source_quotation_id ?? null,
      source_quotation_item_id: raw.source_quotation_item_id ?? null,

      created_at: raw.created_at,
      updated_at: raw.updated_at,
      deleted_at: raw.deleted_at,

      // Variant relation
      variant: raw.variant
        ? {
            id: raw.variant.id,
            sku: raw.variant.sku,
            variant_name: raw.variant.variant_name,
            variant_image_url: variantImageUrl,
            product: raw.variant.product
              ? {
                  id: raw.variant.product.id,
                  product_name: raw.variant.product.product_name,
                  product_image_url: productImageUrl,
                }
              : undefined,
          }
        : undefined,

      // Service relation
      service: raw.service
        ? {
            id: raw.service.id,
            title: raw.service.title,
            short_description: raw.service.short_description ?? null,
            seller: raw.service.seller
              ? {
                  id: raw.service.seller.id,
                  store_name: raw.service.seller.store_name ?? null,
                }
              : undefined,
          }
        : undefined,

      // Package relation
      package: raw.package
        ? {
            id: raw.package.id,
            name: raw.package.name,
            description: raw.package.description ?? null,
            base_price: Number(raw.package.price),
            base_duration_minutes: raw.package.duration_minutes ?? 0,
          }
        : undefined,

      service_address: serviceAddress,

      addons:
        raw.addons && raw.addons.length > 0
          ? raw.addons.map((addon) => ({
              id: addon.id,
              addon_id: addon.addon_id,
              addon_name: addon.addon_name,
              addon_code: addon.addon_code,
              addon_description: addon.addon_description ?? null,
              unit_type: addon.unit_type ?? null,
              quantity: addon.quantity,
              unit_price: Number(addon.unit_price),
              total_price: Number(addon.total_price),
              duration_minutes: addon.duration_minutes ?? null,
            }))
          : undefined,

      options:
        raw.options && raw.options.length > 0
          ? raw.options.map((option) => ({
              id: option.id,
              option_group_id: option.option_group_id,
              option_value_id: option.option_value_id,
              group_name: option.group_name,
              group_code: option.group_code,
              value_label: option.value_label,
              value_code: option.value_code,
              quantity: option.quantity,
              price_adjustment: Number(option.price_adjustment),
              duration_adjustment_minutes: option.duration_adjustment_minutes,
            }))
          : undefined,

      created_by: raw.created_by ? getCauser(raw.created_by) : undefined,
      updated_by: raw.updated_by ? getCauser(raw.updated_by) : undefined,
      deleted_by: raw.deleted_by ? getCauser(raw.deleted_by) : undefined,
    };

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity
   */
  static toPersistence(
    domainEntity: Partial<SalesOrderItem>,
  ): SalesOrderItemEntity {
    const persistenceEntity = new SalesOrderItemEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.order_id = domainEntity.order_id!;
    persistenceEntity.item_type = domainEntity.item_type!;
    persistenceEntity.variant_id = domainEntity.variant_id ?? null;
    persistenceEntity.service_id = domainEntity.service_id ?? null;
    persistenceEntity.package_id = domainEntity.package_id ?? null;
    persistenceEntity.quantity = domainEntity.quantity!;
    persistenceEntity.unit_price = domainEntity.unit_price!;
    persistenceEntity.total_price = domainEntity.total_price!;
    persistenceEntity.scheduled_date = domainEntity.scheduled_date ?? null;
    persistenceEntity.scheduled_start_time =
      domainEntity.scheduled_start_time ?? null;
    persistenceEntity.service_address_id =
      domainEntity.service_address_id ?? null;
    persistenceEntity.special_requests = domainEntity.special_requests ?? null;
    persistenceEntity.location_additional_fee =
      domainEntity.location_additional_fee ?? null;

    // MEPF Flow Fields
    persistenceEntity.source_quotation_id =
      domainEntity.source_quotation_id ?? null;
    persistenceEntity.source_quotation_item_id =
      domainEntity.source_quotation_item_id ?? null;

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
