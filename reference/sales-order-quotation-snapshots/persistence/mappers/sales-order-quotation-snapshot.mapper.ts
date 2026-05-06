import { SalesOrderQuotationSnapshot } from '@/sales-order-quotation-snapshots/domain/sales-order-quotation-snapshot';
import { SalesOrderQuotationSnapshotEntity } from '@/sales-order-quotation-snapshots/persistence/entities/sales-order-quotation-snapshot.entity';

/**
 * Mapper for SalesOrderQuotationSnapshot domain/entity conversion.
 */
export class SalesOrderQuotationSnapshotMapper {
  static toDomain(
    entity: SalesOrderQuotationSnapshotEntity,
  ): SalesOrderQuotationSnapshot {
    const domain = new SalesOrderQuotationSnapshot();
    domain.id = entity.id;
    domain.sales_order_id = entity.sales_order_id;
    domain.sales_order_item_id = entity.sales_order_item_id;
    domain.source_quotation_id = entity.source_quotation_id;
    domain.source_quotation_item_id = entity.source_quotation_item_id;
    domain.item_type = entity.item_type;
    domain.service_id = entity.service_id;
    domain.product_id = entity.product_id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.quantity = entity.quantity;
    domain.unit_type = entity.unit_type;
    domain.unit_price = Number(entity.unit_price);
    domain.total_price = Number(entity.total_price);
    domain.scheduled_date = entity.scheduled_date;
    domain.scheduled_start_time = entity.scheduled_start_time;
    domain.service_address_id = entity.service_address_id;
    domain.service_address_text = entity.service_address_text;
    domain.service_latitude = entity.service_latitude
      ? Number(entity.service_latitude)
      : null;
    domain.service_longitude = entity.service_longitude
      ? Number(entity.service_longitude)
      : null;
    domain.sequence_order = entity.sequence_order;
    domain.created_by = entity.created_by;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by;
    domain.deleted_at = entity.deleted_at;
    return domain;
  }

  static toEntity(
    domain: Partial<SalesOrderQuotationSnapshot>,
  ): Partial<SalesOrderQuotationSnapshotEntity> {
    const entity: Partial<SalesOrderQuotationSnapshotEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.sales_order_id !== undefined)
      entity.sales_order_id = domain.sales_order_id;
    if (domain.sales_order_item_id !== undefined)
      entity.sales_order_item_id = domain.sales_order_item_id;
    if (domain.source_quotation_id !== undefined)
      entity.source_quotation_id = domain.source_quotation_id;
    if (domain.source_quotation_item_id !== undefined)
      entity.source_quotation_item_id = domain.source_quotation_item_id;
    if (domain.item_type !== undefined) entity.item_type = domain.item_type;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.product_id !== undefined) entity.product_id = domain.product_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.quantity !== undefined) entity.quantity = domain.quantity;
    if (domain.unit_type !== undefined) entity.unit_type = domain.unit_type;
    if (domain.unit_price !== undefined) entity.unit_price = domain.unit_price;
    if (domain.total_price !== undefined)
      entity.total_price = domain.total_price;
    if (domain.scheduled_date !== undefined)
      entity.scheduled_date = domain.scheduled_date;
    if (domain.scheduled_start_time !== undefined)
      entity.scheduled_start_time = domain.scheduled_start_time;
    if (domain.service_address_id !== undefined)
      entity.service_address_id = domain.service_address_id;
    if (domain.service_address_text !== undefined)
      entity.service_address_text = domain.service_address_text;
    if (domain.service_latitude !== undefined)
      entity.service_latitude = domain.service_latitude;
    if (domain.service_longitude !== undefined)
      entity.service_longitude = domain.service_longitude;
    if (domain.sequence_order !== undefined)
      entity.sequence_order = domain.sequence_order;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
