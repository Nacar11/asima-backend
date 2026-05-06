import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { BookingMilestone } from '@/booking-milestones/domain/booking-milestone';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Mapper for BookingMilestone domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like booking, template, and approved_by user.
 *
 * @version 1
 * @since 1.0.0
 */
export class BookingMilestoneMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns BookingMilestone domain model
   */
  static toDomain(raw: BookingMilestoneEntity): BookingMilestone {
    const domainEntity = new BookingMilestone();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.payment_percent) {
      domainEntity.payment_percent = Number(raw.payment_percent);
    }
    if (raw.payment_amount) {
      domainEntity.payment_amount = Number(raw.payment_amount);
    }

    // Map booking relation if loaded
    if (raw.booking) {
      domainEntity.booking = raw.booking;
    }

    // Map template relation if loaded
    if (raw.template) {
      domainEntity.template = raw.template;
    }

    // Map approved_by_user relation if loaded
    if (raw.approved_by_user) {
      domainEntity.approved_by_user = getCauser(raw.approved_by_user);
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns BookingMilestoneEntity for TypeORM
   */
  static toPersistence(domainEntity: BookingMilestone): BookingMilestoneEntity {
    const persistenceEntity = new BookingMilestoneEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      booking_id: domainEntity.booking_id,
      template_id: domainEntity.template_id,
      source_quotation_item_id: domainEntity.source_quotation_item_id ?? null,
      name: domainEntity.name,
      description: domainEntity.description,
      milestone_type: domainEntity.milestone_type,
      category: domainEntity.category ?? null,
      response_type: domainEntity.response_type ?? null,
      measurement_unit: domainEntity.measurement_unit ?? null,
      is_required: domainEntity.is_required ?? false,
      sequence_order: domainEntity.sequence_order,
      status: domainEntity.status,
      started_at: domainEntity.started_at,
      completed_at: domainEntity.completed_at,
      approved_at: domainEntity.approved_at,
      payment_percent: domainEntity.payment_percent,
      payment_amount: domainEntity.payment_amount,
      payment_released: domainEntity.payment_released,
      payment_released_at: domainEntity.payment_released_at,
      customer_notes: domainEntity.customer_notes,
      rejection_reason: domainEntity.rejection_reason,
      provider_notes: domainEntity.provider_notes,
      approved_by: domainEntity.approved_by,
      auto_approved: domainEntity.auto_approved,
      submitted_at: domainEntity.submitted_at,
      auto_approve_after_hours: domainEntity.auto_approve_after_hours ?? 48,
      checkbox_value: domainEntity.checkbox_value ?? null,
      text_value: domainEntity.text_value ?? null,
      rating_value: domainEntity.rating_value ?? null,
      measurement_value: domainEntity.measurement_value ?? null,
      photo_urls: domainEntity.photo_urls ?? null,
    });

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
