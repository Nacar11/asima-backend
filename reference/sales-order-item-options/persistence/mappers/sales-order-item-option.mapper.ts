import { SalesOrderItemOption } from '@/sales-order-item-options/domain/sales-order-item-option';
import { SalesOrderItemOptionEntity } from '../entities/sales-order-item-option.entity';

export class SalesOrderItemOptionMapper {
  static toDomain(entity: SalesOrderItemOptionEntity): SalesOrderItemOption {
    const domain = new SalesOrderItemOption();
    domain.id = entity.id;
    domain.sales_order_item_id = entity.sales_order_item_id;
    domain.option_group_id = entity.option_group_id;
    domain.option_value_id = entity.option_value_id;
    domain.group_name = entity.group_name;
    domain.group_code = entity.group_code;
    domain.value_label = entity.value_label;
    domain.value_code = entity.value_code;
    domain.quantity = entity.quantity;
    domain.price_adjustment = Number(entity.price_adjustment);
    domain.duration_adjustment_minutes = entity.duration_adjustment_minutes;
    domain.created_by = entity.created_by?.id ?? null;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by?.id ?? null;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<SalesOrderItemOption>,
  ): Partial<SalesOrderItemOptionEntity> {
    const entity = new SalesOrderItemOptionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.sales_order_item_id !== undefined)
      entity.sales_order_item_id = domain.sales_order_item_id;
    if (domain.option_group_id !== undefined)
      entity.option_group_id = domain.option_group_id;
    if (domain.option_value_id !== undefined)
      entity.option_value_id = domain.option_value_id;
    if (domain.group_name !== undefined) entity.group_name = domain.group_name;
    if (domain.group_code !== undefined) entity.group_code = domain.group_code;
    if (domain.value_label !== undefined)
      entity.value_label = domain.value_label;
    if (domain.value_code !== undefined) entity.value_code = domain.value_code;
    if (domain.quantity !== undefined) entity.quantity = domain.quantity;
    if (domain.price_adjustment !== undefined)
      entity.price_adjustment = domain.price_adjustment;
    if (domain.duration_adjustment_minutes !== undefined)
      entity.duration_adjustment_minutes = domain.duration_adjustment_minutes;
    return entity;
  }
}
