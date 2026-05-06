import { BookingCancellation } from '@/booking-cancellations/domain/booking-cancellation';
import { BookingCancellationEntity } from '@/booking-cancellations/persistence/entities/booking-cancellation.entity';

export class BookingCancellationMapper {
  static toDomain(entity: BookingCancellationEntity): BookingCancellation {
    const domain = new BookingCancellation();
    domain.id = entity.id;
    domain.booking_id = entity.booking_id;
    domain.cancelled_by = entity.cancelled_by;
    domain.cancelled_by_role = entity.cancelled_by_role;
    domain.reason = entity.reason;
    domain.reason_details = entity.reason_details;
    domain.scheduled_date = entity.scheduled_date.toISOString().split('T')[0];
    domain.scheduled_time = entity.scheduled_time;
    domain.cancelled_at = entity.cancelled_at?.toISOString();
    domain.hours_before_scheduled = entity.hours_before_scheduled;
    domain.policy_applied = entity.policy_applied;
    domain.cancellation_fee_percent = entity.cancellation_fee_percent;
    domain.cancellation_fee_amount = entity.cancellation_fee_amount;
    domain.original_amount = Number(entity.original_amount);
    domain.refund_amount = Number(entity.refund_amount);
    domain.store_compensation = Number(entity.store_compensation);
    domain.platform_fee_refunded = Number(entity.platform_fee_refunded);
    domain.escrow_refunded = Number(entity.escrow_refunded);
    domain.escrow_released_to_store = Number(entity.escrow_released_to_store);
    domain.refund_id = entity.refund_id;
    domain.processed_at = entity.processed_at?.toISOString();
    domain.internal_notes = entity.internal_notes;
    domain.created_at = entity.created_at?.toISOString();
    domain.updated_at = entity.updated_at?.toISOString();
    domain.deleted_at = entity.deleted_at?.toISOString();
    return domain;
  }

  static toEntity(domain: BookingCancellation): BookingCancellationEntity {
    const entity = new BookingCancellationEntity();
    entity.id = domain.id;
    entity.booking_id = domain.booking_id;
    entity.cancelled_by = domain.cancelled_by;
    entity.cancelled_by_role = domain.cancelled_by_role;
    entity.reason = domain.reason;
    entity.reason_details = domain.reason_details ?? null;
    entity.scheduled_date = new Date(domain.scheduled_date);
    entity.scheduled_time = domain.scheduled_time;
    entity.cancelled_at = domain.cancelled_at
      ? new Date(domain.cancelled_at)
      : new Date();
    entity.hours_before_scheduled = domain.hours_before_scheduled ?? null;
    entity.policy_applied = domain.policy_applied;
    entity.cancellation_fee_percent = domain.cancellation_fee_percent ?? null;
    entity.cancellation_fee_amount = domain.cancellation_fee_amount ?? null;
    entity.original_amount = domain.original_amount;
    entity.refund_amount = domain.refund_amount;
    entity.store_compensation = domain.store_compensation;
    entity.platform_fee_refunded = domain.platform_fee_refunded;
    entity.escrow_refunded = domain.escrow_refunded;
    entity.escrow_released_to_store = domain.escrow_released_to_store;
    entity.refund_id = domain.refund_id ?? null;
    entity.processed_at = domain.processed_at
      ? new Date(domain.processed_at)
      : null;
    entity.internal_notes = domain.internal_notes ?? null;
    return entity;
  }
}
