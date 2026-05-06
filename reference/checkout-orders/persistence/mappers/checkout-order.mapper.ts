import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { CheckoutOrder } from '@/checkout-orders/domain/checkout-order';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';
import { UserAddressMapper } from '@/user-addresses/persistence/mappers/user-address.mapper';

/**
 * Mapper for CheckoutOrder domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like user, currency, and addresses.
 *
 * @version 1
 * @since 1.0.0
 */
export class CheckoutOrderMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns CheckoutOrder domain model
   */
  static toDomain(raw: CheckoutOrderEntity): CheckoutOrder {
    const domainEntity = new CheckoutOrder();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.subtotal) {
      domainEntity.subtotal = Number(raw.subtotal);
    }
    if (raw.discount_total) {
      domainEntity.discount_total = Number(raw.discount_total);
    }
    if (raw.shipping_total) {
      domainEntity.shipping_total = Number(raw.shipping_total);
    }
    if (raw.tax_total) {
      domainEntity.tax_total = Number(raw.tax_total);
    }
    if (raw.platform_fee_total) {
      domainEntity.platform_fee_total = Number(raw.platform_fee_total);
    }
    if (raw.grand_total) {
      domainEntity.grand_total = Number(raw.grand_total);
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

    // Map currency relation if loaded
    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
    }

    // Map delivery address relation if loaded
    if (raw.delivery_address) {
      domainEntity.delivery_address = UserAddressMapper.toDomain(
        raw.delivery_address,
      );
    }

    // Map service address relation if loaded
    if (raw.service_address) {
      domainEntity.service_address = UserAddressMapper.toDomain(
        raw.service_address,
      );
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
   * @returns CheckoutOrderEntity for TypeORM
   */
  static toPersistence(domainEntity: CheckoutOrder): CheckoutOrderEntity {
    const persistenceEntity = new CheckoutOrderEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      user_id: domainEntity.user_id,
      order_number: domainEntity.order_number,
      has_products: domainEntity.has_products,
      has_services: domainEntity.has_services,
      has_bundles: domainEntity.has_bundles,
      subtotal: domainEntity.subtotal,
      discount_total: domainEntity.discount_total,
      shipping_total: domainEntity.shipping_total,
      tax_total: domainEntity.tax_total,
      platform_fee_total: domainEntity.platform_fee_total,
      grand_total: domainEntity.grand_total,
      currency_id: domainEntity.currency_id,
      status: domainEntity.status,
      payment_status: domainEntity.payment_status,
      delivery_address_id: domainEntity.delivery_address_id,
      service_address_id: domainEntity.service_address_id,
      customer_notes: domainEntity.customer_notes,
      internal_notes: domainEntity.internal_notes,
      paid_at: domainEntity.paid_at,
      completed_at: domainEntity.completed_at,
      cancelled_at: domainEntity.cancelled_at,
      cancellation_reason: domainEntity.cancellation_reason,
      source: domainEntity.source,
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
