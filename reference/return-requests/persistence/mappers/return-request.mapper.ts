import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';
import { ReturnRequest } from '@/return-requests/domain/return-request';
import { ReturnRequestItemMapper } from './return-request-item.mapper';
import { ReturnRequestMediaMappingMapper } from '@/media/persistence/mappers/return-request-media-mapping.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ReturnRequestStatusEnum } from '@/return-requests/domain/return-request-status.enum';

export class ReturnRequestMapper {
  static toDomain(raw: ReturnRequestEntity): ReturnRequest {
    const domainEntity = new ReturnRequest();

    domainEntity.id = raw.id;
    domainEntity.order_id = raw.order_id;
    domainEntity.user_id = raw.user_id;
    domainEntity.seller_id = raw.seller_id;
    domainEntity.return_number = raw.return_number;
    domainEntity.status = raw.status as ReturnRequestStatusEnum;
    domainEntity.reason = raw.reason;
    domainEntity.rejection_reason = raw.rejection_reason;
    domainEntity.approval_notes = raw.approval_notes;
    domainEntity.previous_order_status = raw.previous_order_status;
    domainEntity.pickup_scheduled_at = raw.pickup_scheduled_at;
    domainEntity.pickup_scheduled_date = raw.pickup_scheduled_date;
    domainEntity.pickup_scheduled_by = raw.pickup_scheduled_by;
    domainEntity.pickup_notes = raw.pickup_notes;
    domainEntity.picked_up_at = raw.picked_up_at;
    domainEntity.picked_up_by = raw.picked_up_by;
    domainEntity.calculated_refund_amount = raw.calculated_refund_amount
      ? Number(raw.calculated_refund_amount)
      : null;
    domainEntity.actual_refund_amount = raw.actual_refund_amount
      ? Number(raw.actual_refund_amount)
      : null;
    domainEntity.refund_notes = raw.refund_notes;
    domainEntity.requested_at = raw.requested_at;
    domainEntity.approved_at = raw.approved_at;
    domainEntity.approved_by = raw.approved_by;
    domainEntity.rejected_at = raw.rejected_at;
    domainEntity.rejected_by = raw.rejected_by;
    domainEntity.received_at = raw.received_at;
    domainEntity.received_by = raw.received_by;
    domainEntity.refunded_at = raw.refunded_at;
    domainEntity.refunded_by = raw.refunded_by;

    // Payment refund tracking
    domainEntity.payment_refund_status = raw.payment_refund_status;
    domainEntity.payment_refund_method = raw.payment_refund_method;
    domainEntity.payment_refund_amount = raw.payment_refund_amount
      ? Number(raw.payment_refund_amount)
      : null;
    domainEntity.payment_refund_at = raw.payment_refund_at;
    domainEntity.payment_refund_by = raw.payment_refund_by;
    domainEntity.payment_refund_reference = raw.payment_refund_reference;

    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    // Map order relation if loaded
    if (raw.order) {
      domainEntity.order = {
        id: raw.order.id,
        order_number: raw.order.order_number,
        status: raw.order.status,
      };
    }

    // Map user relation if loaded
    if (raw.user) {
      domainEntity.user = {
        id: raw.user.id,
        first_name: raw.user.first_name,
        last_name: raw.user.last_name,
        email: raw.user.email,
      };
    }

    // Map seller relation if loaded
    if (raw.seller) {
      domainEntity.seller = {
        id: raw.seller.id,
        store_name: raw.seller.store_name,
      };
    }

    // Map items relation if loaded
    if (raw.items) {
      domainEntity.items = raw.items.map((item) =>
        ReturnRequestItemMapper.toDomain(item),
      );
    }

    // Map media mappings relation if loaded (evidence images)
    if (raw.media_mappings) {
      domainEntity.media_mappings = raw.media_mappings
        .map((mapping) => ReturnRequestMediaMappingMapper.toDomain(mapping))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
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

  static toPersistence(
    domainEntity: Partial<ReturnRequest>,
  ): Partial<ReturnRequestEntity> {
    const persistenceEntity: Partial<ReturnRequestEntity> = {};

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.order_id !== undefined) {
      persistenceEntity.order_id = domainEntity.order_id;
    }

    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }

    if (domainEntity.seller_id !== undefined) {
      persistenceEntity.seller_id = domainEntity.seller_id;
    }

    if (domainEntity.status !== undefined) {
      persistenceEntity.status = domainEntity.status;
    }

    if (domainEntity.reason !== undefined) {
      persistenceEntity.reason = domainEntity.reason;
    }

    if (domainEntity.rejection_reason !== undefined) {
      persistenceEntity.rejection_reason = domainEntity.rejection_reason;
    }

    if (domainEntity.approval_notes !== undefined) {
      persistenceEntity.approval_notes = domainEntity.approval_notes;
    }

    if (domainEntity.previous_order_status !== undefined) {
      persistenceEntity.previous_order_status =
        domainEntity.previous_order_status;
    }

    if (domainEntity.calculated_refund_amount !== undefined) {
      persistenceEntity.calculated_refund_amount =
        domainEntity.calculated_refund_amount;
    }

    if (domainEntity.actual_refund_amount !== undefined) {
      persistenceEntity.actual_refund_amount =
        domainEntity.actual_refund_amount;
    }

    if (domainEntity.refund_notes !== undefined) {
      persistenceEntity.refund_notes = domainEntity.refund_notes;
    }

    // Payment refund tracking
    if (domainEntity.payment_refund_status !== undefined) {
      persistenceEntity.payment_refund_status =
        domainEntity.payment_refund_status ?? null;
    }
    if (domainEntity.payment_refund_method !== undefined) {
      persistenceEntity.payment_refund_method =
        domainEntity.payment_refund_method ?? null;
    }
    if (domainEntity.payment_refund_amount !== undefined) {
      persistenceEntity.payment_refund_amount =
        domainEntity.payment_refund_amount ?? null;
    }
    if (domainEntity.payment_refund_at !== undefined) {
      persistenceEntity.payment_refund_at =
        domainEntity.payment_refund_at ?? null;
    }
    if (domainEntity.payment_refund_by !== undefined) {
      persistenceEntity.payment_refund_by =
        domainEntity.payment_refund_by ?? null;
    }
    if (domainEntity.payment_refund_reference !== undefined) {
      persistenceEntity.payment_refund_reference =
        domainEntity.payment_refund_reference ?? null;
    }

    return persistenceEntity;
  }
}
