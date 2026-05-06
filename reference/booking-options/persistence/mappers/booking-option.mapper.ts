import { BookingOption } from '@/booking-options/domain/booking-option';
import { BookingOptionEntity } from '@/booking-options/persistence/entities/booking-option.entity';

export class BookingOptionMapper {
  static toDomain(entity: BookingOptionEntity): BookingOption {
    const domain = new BookingOption();
    domain.id = entity.id;
    domain.booking_id = entity.booking_id;
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
    domain: Partial<BookingOption>,
  ): Partial<BookingOptionEntity> {
    const entity: Partial<BookingOptionEntity> = {};
    if (domain.booking_id !== undefined) entity.booking_id = domain.booking_id;
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
