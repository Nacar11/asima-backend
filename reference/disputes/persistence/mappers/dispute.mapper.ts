import { DisputeEntity } from '@/disputes/persistence/entities/dispute.entity';
import { Dispute } from '@/disputes/domain/dispute';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Mapper for Dispute domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM).
 *
 * @version 1
 * @since 1.0.0
 */
export class DisputeMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns Dispute domain model
   */
  static toDomain(raw: DisputeEntity): Dispute {
    const domainEntity = new Dispute();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.requested_refund_amount) {
      domainEntity.requested_refund_amount = Number(
        raw.requested_refund_amount,
      );
    }
    if (raw.refund_amount) {
      domainEntity.refund_amount = Number(raw.refund_amount);
    }

    // Map customer relation if loaded
    if (raw.customer) {
      domainEntity.customer = getCauser(raw.customer);
    }

    // Map seller relation if loaded
    if (raw.seller) {
      domainEntity.seller = raw.seller;
    }

    // Map booking relation if loaded
    if (raw.booking) {
      domainEntity.booking = raw.booking;
    }

    // Map resolved_by_user relation if loaded
    if (raw.resolved_by_user) {
      domainEntity.resolved_by_user = getCauser(raw.resolved_by_user);
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

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns DisputeEntity for TypeORM
   */
  static toPersistence(domainEntity: Dispute): DisputeEntity {
    const persistenceEntity = new DisputeEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      booking_id: domainEntity.booking_id,
      customer_id: domainEntity.customer_id,
      seller_id: domainEntity.seller_id,
      dispute_number: domainEntity.dispute_number,
      status: domainEntity.status,
      reason: domainEntity.reason,
      description: domainEntity.description,
      evidence_urls: domainEntity.evidence_urls,
      requested_resolution: domainEntity.requested_resolution,
      requested_refund_amount: domainEntity.requested_refund_amount,
      resolution: domainEntity.resolution,
      resolution_notes: domainEntity.resolution_notes,
      resolved_by: domainEntity.resolved_by,
      resolved_at: domainEntity.resolved_at,
      refund_amount: domainEntity.refund_amount,
      provider_response: domainEntity.provider_response,
      provider_evidence_urls: domainEntity.provider_evidence_urls,
      provider_responded_at: domainEntity.provider_responded_at,
      customer_reply: domainEntity.customer_reply,
      customer_replied_at: domainEntity.customer_replied_at,
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

    return persistenceEntity;
  }
}
