import { BookingAddon } from '@/booking-addons/domain/booking-addon';
import { BookingAddonEntity } from '@/booking-addons/persistence/entities/booking-addon.entity';

export class BookingAddonMapper {
  static toDomain(entity: BookingAddonEntity): BookingAddon {
    const domain = new BookingAddon();
    domain.id = entity.id;
    domain.booking_id = entity.booking_id;
    domain.addon_id = entity.addon_id;
    domain.addon_name = entity.addon_name;
    domain.addon_code = entity.addon_code;
    domain.addon_description = entity.addon_description;
    domain.unit_type = entity.unit_type;
    domain.quantity = entity.quantity;
    domain.unit_price = Number(entity.unit_price);
    domain.total_price = Number(entity.total_price);
    domain.duration_minutes = entity.duration_minutes;
    domain.created_by = entity.created_by?.id ?? null;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by?.id ?? null;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<BookingAddon>,
  ): Partial<BookingAddonEntity> {
    const entity: Partial<BookingAddonEntity> = {};
    if (domain.booking_id !== undefined) entity.booking_id = domain.booking_id;
    if (domain.addon_id !== undefined) entity.addon_id = domain.addon_id;
    if (domain.addon_name !== undefined) entity.addon_name = domain.addon_name;
    if (domain.addon_code !== undefined) entity.addon_code = domain.addon_code;
    if (domain.addon_description !== undefined)
      entity.addon_description = domain.addon_description;
    if (domain.unit_type !== undefined) entity.unit_type = domain.unit_type;
    if (domain.quantity !== undefined) entity.quantity = domain.quantity;
    if (domain.unit_price !== undefined) entity.unit_price = domain.unit_price;
    if (domain.total_price !== undefined)
      entity.total_price = domain.total_price;
    if (domain.duration_minutes !== undefined)
      entity.duration_minutes = domain.duration_minutes;
    return entity;
  }
}
