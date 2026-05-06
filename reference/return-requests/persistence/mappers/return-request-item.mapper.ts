import { ReturnRequestItemEntity } from '@/return-requests/persistence/entities/return-request-item.entity';
import { ReturnRequestItem } from '@/return-requests/domain/return-request-item';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ReturnRequestItemStatusEnum } from '@/return-requests/domain/return-request-item-status.enum';
import { MediaMapper } from '@/media/persistence/mappers/media.mapper';

export class ReturnRequestItemMapper {
  static toDomain(raw: ReturnRequestItemEntity): ReturnRequestItem {
    const domainEntity = new ReturnRequestItem();

    domainEntity.id = raw.id;
    domainEntity.return_request_id = raw.return_request_id;
    domainEntity.sales_order_item_id = raw.sales_order_item_id;
    domainEntity.variant_id = raw.variant_id ?? null;
    domainEntity.service_id = raw.service_id ?? null;
    domainEntity.quantity_ordered = raw.quantity_ordered;
    domainEntity.quantity_returning = raw.quantity_returning;
    domainEntity.unit_price = Number(raw.unit_price);
    domainEntity.return_amount = Number(raw.return_amount);
    domainEntity.item_status = raw.item_status as ReturnRequestItemStatusEnum;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;

    // Map sales order item relation if loaded
    if (raw.sales_order_item) {
      domainEntity.sales_order_item = {
        id: raw.sales_order_item.id,
        quantity: raw.sales_order_item.quantity,
        unit_price: Number(raw.sales_order_item.unit_price),
        total_price: Number(raw.sales_order_item.total_price),
      };
    }

    // Map variant relation if loaded
    if (raw.variant) {
      // Get primary product image URLs if available
      let productImageUrl: string | undefined;
      let productThumbnailUrl: string | undefined;
      if (raw.variant.product?.product_media_mappings?.length) {
        // Find primary image (is_primary = true) or first image
        const primaryMapping = raw.variant.product.product_media_mappings.find(
          (m) => m.is_primary,
        );
        const mappingToUse =
          primaryMapping || raw.variant.product.product_media_mappings[0];
        if (mappingToUse?.media) {
          const mediaDomain = MediaMapper.toDomain(mappingToUse.media);
          productImageUrl = mediaDomain.url;
          productThumbnailUrl = mediaDomain.thumbnail_url;
        }
      }

      domainEntity.variant = {
        id: raw.variant.id,
        sku: raw.variant.sku,
        name: raw.variant.variant_name,
        product: raw.variant.product
          ? {
              id: raw.variant.product.id,
              name: raw.variant.product.product_name,
              image_url: productImageUrl,
              thumbnail_url: productThumbnailUrl,
            }
          : undefined,
      };
    }

    // Map service relation if loaded
    if (raw.service) {
      // Get primary image from gallery (filter out deleted items)
      const activeGallery =
        raw.service.gallery?.filter((g) => !g.deleted_at) || [];
      const primaryImage = activeGallery.find((g) => g.is_primary);
      const primaryImageUrl =
        primaryImage?.image_url ||
        activeGallery[0]?.image_url ||
        raw.service.category?.image_url ||
        null;

      domainEntity.service = {
        id: raw.service.id,
        title: raw.service.title,
        code: raw.service.code,
        primary_image_url: primaryImageUrl,
      };
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<ReturnRequestItem>,
  ): Partial<ReturnRequestItemEntity> {
    const persistenceEntity: Partial<ReturnRequestItemEntity> = {};

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.return_request_id !== undefined) {
      persistenceEntity.return_request_id = domainEntity.return_request_id;
    }

    if (domainEntity.sales_order_item_id !== undefined) {
      persistenceEntity.sales_order_item_id = domainEntity.sales_order_item_id;
    }

    if (domainEntity.variant_id !== undefined) {
      persistenceEntity.variant_id = domainEntity.variant_id;
    }

    if (domainEntity.service_id !== undefined) {
      persistenceEntity.service_id = domainEntity.service_id;
    }

    if (domainEntity.quantity_ordered !== undefined) {
      persistenceEntity.quantity_ordered = domainEntity.quantity_ordered;
    }

    if (domainEntity.quantity_returning !== undefined) {
      persistenceEntity.quantity_returning = domainEntity.quantity_returning;
    }

    if (domainEntity.unit_price !== undefined) {
      persistenceEntity.unit_price = domainEntity.unit_price;
    }

    if (domainEntity.return_amount !== undefined) {
      persistenceEntity.return_amount = domainEntity.return_amount;
    }

    if (domainEntity.item_status !== undefined) {
      persistenceEntity.item_status = domainEntity.item_status;
    }

    return persistenceEntity;
  }
}
