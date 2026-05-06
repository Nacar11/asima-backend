import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrder } from '@/sales-orders/domain/sales-order';
import { SalesOrderItemMapper } from './sales-order-item.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

/**
 * Mapper for SalesOrder domain and persistence models
 */
export class SalesOrderMapper {
  /**
   * Convert persistence entity to domain model
   */
  static toDomain(raw: SalesOrderEntity): SalesOrder {
    // Return a plain object literal (not a class instance) to prevent
    // ClassSerializerInterceptor / instanceToPlain() from walking into
    // class-transformer metadata and crashing on deeply nested entities.
    const domainEntity: SalesOrder = {
      id: raw.id,
      user_id: raw.user_id,
      seller_id: raw.seller_id,
      order_number: raw.order_number,
      idempotency_key: raw.idempotency_key,
      status: raw.status as OrderStatusEnum,
      status_notes: raw.status_notes,
      subtotal: Number(raw.subtotal),
      tax_amount: Number(raw.tax_amount),
      shipping_amount: Number(raw.shipping_amount),
      total_amount: Number(raw.total_amount),
      commission_rate: Number(raw.commission_rate ?? 0),
      notes: raw.notes || undefined,
      shipping_address: raw.shipping_address,

      // Shipping address snapshot fields
      user_address_id: raw.user_address_id,
      shipping_recipient_name: raw.shipping_recipient_name,
      shipping_phone: raw.shipping_phone,
      shipping_address_line1: raw.shipping_address_line1,
      shipping_address_line2: raw.shipping_address_line2,
      shipping_city: raw.shipping_city,
      shipping_state_province: raw.shipping_state_province,
      shipping_postal_code: raw.shipping_postal_code,
      shipping_country: raw.shipping_country,
      shipping_method: raw.shipping_method,

      // Shipment tracking fields
      tracking_number: raw.tracking_number,
      shipping_provider: raw.shipping_provider,
      shipped_at: raw.shipped_at,
      delivered_at: raw.delivered_at,
      completed_at: raw.completed_at,
      review_id: raw.review_id,
      reviewed_at: raw.reviewed_at,
      cancellation_reason: raw.cancellation_reason,
      cancelled_at: raw.cancelled_at,

      // Payment fields
      payment_method: raw.payment_method,
      payment_status: raw.payment_status,

      // MEPF Flow Fields
      source_quotation_id: raw.source_quotation_id ?? null,

      // Checkout Source
      checkout_source: raw.checkout_source ?? null,

      // Pickup Fulfillment
      fulfillment_type: raw.fulfillment_type ?? 'delivery',
      pickup_date: raw.pickup_date ?? null,
      pickup_time: raw.pickup_time ? String(raw.pickup_time) : null,
      pickup_notes: raw.pickup_notes ?? null,
      ready_for_pickup_at: raw.ready_for_pickup_at ?? null,
      picked_up_at: raw.picked_up_at ?? null,
      pickup_reminder_notified_at: raw.pickup_reminder_notified_at ?? null,
      noshow_warning_1_notified_at: raw.noshow_warning_1_notified_at ?? null,
      noshow_warning_2_notified_at: raw.noshow_warning_2_notified_at ?? null,
      grace_period_extension: raw.grace_period_extension ?? null,
      pickup_confirmation_code: raw.pickup_confirmation_code ?? null,

      created_at: raw.created_at,
      updated_at: raw.updated_at,
      deleted_at: raw.deleted_at,

      // Relations (mapped below if loaded)
      user: raw.user
        ? {
            id: raw.user.id,
            first_name: raw.user.first_name,
            last_name: raw.user.last_name,
            email: raw.user.email,
          }
        : undefined,

      seller: raw.seller
        ? {
            id: raw.seller.id,
            store_name: raw.seller.store_name,
            pickup_address:
              raw.seller.pickup_address ??
              (raw.seller.pickup_address_entity
                ? [
                    raw.seller.pickup_address_entity.address_line1,
                    raw.seller.pickup_address_entity.city,
                    raw.seller.pickup_address_entity.state_province,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : null),
            pickup_latitude: raw.seller.pickup_latitude
              ? Number(raw.seller.pickup_latitude)
              : null,
            pickup_longitude: raw.seller.pickup_longitude
              ? Number(raw.seller.pickup_longitude)
              : null,
          }
        : undefined,

      items: raw.items
        ? raw.items.map((item) => SalesOrderItemMapper.toDomain(item))
        : undefined,

      created_by: raw.created_by ? getCauser(raw.created_by) : undefined,
      updated_by: raw.updated_by ? getCauser(raw.updated_by) : undefined,
      deleted_by: raw.deleted_by ? getCauser(raw.deleted_by) : undefined,
    };

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity
   */
  static toPersistence(domainEntity: Partial<SalesOrder>): SalesOrderEntity {
    const persistenceEntity = new SalesOrderEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.user_id = domainEntity.user_id!;
    persistenceEntity.seller_id = domainEntity.seller_id || null;
    persistenceEntity.order_number = domainEntity.order_number!;
    persistenceEntity.idempotency_key = domainEntity.idempotency_key || null;
    persistenceEntity.status = domainEntity.status!;
    persistenceEntity.subtotal = domainEntity.subtotal!;
    persistenceEntity.tax_amount = domainEntity.tax_amount || 0;
    persistenceEntity.shipping_amount = domainEntity.shipping_amount || 0;
    persistenceEntity.total_amount = domainEntity.total_amount!;
    persistenceEntity.commission_rate = domainEntity.commission_rate ?? 0;
    persistenceEntity.notes = domainEntity.notes || null;
    persistenceEntity.shipping_address = domainEntity.shipping_address || null;

    // Map shipping address snapshot fields
    if (domainEntity.user_address_id !== undefined) {
      persistenceEntity.user_address_id = domainEntity.user_address_id;
    }
    if (domainEntity.shipping_recipient_name !== undefined) {
      persistenceEntity.shipping_recipient_name =
        domainEntity.shipping_recipient_name;
    }
    if (domainEntity.shipping_phone !== undefined) {
      persistenceEntity.shipping_phone = domainEntity.shipping_phone;
    }
    if (domainEntity.shipping_address_line1 !== undefined) {
      persistenceEntity.shipping_address_line1 =
        domainEntity.shipping_address_line1;
    }
    if (domainEntity.shipping_address_line2 !== undefined) {
      persistenceEntity.shipping_address_line2 =
        domainEntity.shipping_address_line2;
    }
    if (domainEntity.shipping_city !== undefined) {
      persistenceEntity.shipping_city = domainEntity.shipping_city;
    }
    if (domainEntity.shipping_state_province !== undefined) {
      persistenceEntity.shipping_state_province =
        domainEntity.shipping_state_province;
    }
    if (domainEntity.shipping_postal_code !== undefined) {
      persistenceEntity.shipping_postal_code =
        domainEntity.shipping_postal_code;
    }
    if (domainEntity.shipping_country !== undefined) {
      persistenceEntity.shipping_country = domainEntity.shipping_country;
    }

    if (domainEntity.review_id !== undefined) {
      persistenceEntity.review_id = domainEntity.review_id;
    }

    if (domainEntity.reviewed_at !== undefined) {
      persistenceEntity.reviewed_at = domainEntity.reviewed_at;
    }

    // Payment fields
    if (domainEntity.payment_method !== undefined) {
      persistenceEntity.payment_method = domainEntity.payment_method ?? null;
    }
    if (domainEntity.payment_status !== undefined) {
      persistenceEntity.payment_status = domainEntity.payment_status;
    }

    // MEPF Flow Fields
    if (domainEntity.source_quotation_id !== undefined) {
      persistenceEntity.source_quotation_id = domainEntity.source_quotation_id;
    }

    // Checkout Source
    if (domainEntity.checkout_source !== undefined) {
      persistenceEntity.checkout_source = domainEntity.checkout_source ?? null;
    }

    // Pickup Fulfillment
    if (domainEntity.fulfillment_type !== undefined) {
      persistenceEntity.fulfillment_type = domainEntity.fulfillment_type;
    }
    if (domainEntity.pickup_date !== undefined) {
      persistenceEntity.pickup_date = domainEntity.pickup_date ?? null;
    }
    if (domainEntity.pickup_time !== undefined) {
      persistenceEntity.pickup_time = (domainEntity.pickup_time as any) ?? null;
    }
    if (domainEntity.pickup_notes !== undefined) {
      persistenceEntity.pickup_notes = domainEntity.pickup_notes ?? null;
    }
    if (domainEntity.ready_for_pickup_at !== undefined) {
      persistenceEntity.ready_for_pickup_at =
        domainEntity.ready_for_pickup_at ?? null;
    }
    if (domainEntity.picked_up_at !== undefined) {
      persistenceEntity.picked_up_at = domainEntity.picked_up_at ?? null;
    }
    if (domainEntity.pickup_reminder_notified_at !== undefined) {
      persistenceEntity.pickup_reminder_notified_at =
        domainEntity.pickup_reminder_notified_at ?? null;
    }
    if (domainEntity.noshow_warning_1_notified_at !== undefined) {
      persistenceEntity.noshow_warning_1_notified_at =
        domainEntity.noshow_warning_1_notified_at ?? null;
    }
    if (domainEntity.noshow_warning_2_notified_at !== undefined) {
      persistenceEntity.noshow_warning_2_notified_at =
        domainEntity.noshow_warning_2_notified_at ?? null;
    }
    if (domainEntity.grace_period_extension !== undefined) {
      persistenceEntity.grace_period_extension =
        domainEntity.grace_period_extension ?? null;
    }
    if (domainEntity.pickup_confirmation_code !== undefined) {
      persistenceEntity.pickup_confirmation_code =
        domainEntity.pickup_confirmation_code ?? null;
    }

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
