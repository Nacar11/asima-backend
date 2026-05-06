import { BookingGuest } from '@/booking-guests/domain/booking-guest';
import { BookingGuestEntity } from '@/booking-guests/persistence/entities/booking-guest.entity';

const buildFullName = (firstName?: string | null, lastName?: string | null) =>
  [String(firstName || '').trim(), String(lastName || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();

export class BookingGuestMapper {
  static toDomain(entity: BookingGuestEntity): BookingGuest {
    const domain = new BookingGuest();
    domain.id = entity.id;
    domain.booking_id = entity.booking_id;
    domain.sort_order = entity.sort_order;
    domain.is_primary_contact = entity.is_primary_contact;
    domain.first_name = entity.first_name;
    domain.last_name = entity.last_name;
    domain.full_name = buildFullName(entity.first_name, entity.last_name);
    domain.email = entity.email;
    domain.phone = entity.phone;
    domain.created_by = entity.created_by?.id ?? null;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by?.id ?? null;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<BookingGuest>,
  ): Partial<BookingGuestEntity> {
    const entity: Partial<BookingGuestEntity> = {};
    if (domain.booking_id !== undefined) entity.booking_id = domain.booking_id;
    if (domain.sort_order !== undefined) entity.sort_order = domain.sort_order;
    if (domain.is_primary_contact !== undefined) {
      entity.is_primary_contact = domain.is_primary_contact;
    }
    if (domain.first_name !== undefined) entity.first_name = domain.first_name;
    if (domain.last_name !== undefined) entity.last_name = domain.last_name;
    if (domain.email !== undefined) entity.email = domain.email;
    if (domain.phone !== undefined) entity.phone = domain.phone;
    if (domain.created_by !== undefined) {
      entity.created_by = domain.created_by
        ? ({ id: domain.created_by } as any)
        : null;
    }
    if (domain.updated_by !== undefined) {
      entity.updated_by = domain.updated_by
        ? ({ id: domain.updated_by } as any)
        : null;
    }
    return entity;
  }
}
