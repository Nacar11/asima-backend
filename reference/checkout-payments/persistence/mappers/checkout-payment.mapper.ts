import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPayment } from '@/checkout-payments/domain/checkout-payment';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';

/**
 * Mapper for CheckoutPayment domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like checkout order, currency, and user.
 *
 * @version 1
 * @since 1.0.0
 */
export class CheckoutPaymentMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns CheckoutPayment domain model
   */
  static toDomain(raw: CheckoutPaymentEntity): CheckoutPayment {
    const domainEntity = new CheckoutPayment();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.amount) {
      domainEntity.amount = Number(raw.amount);
    }
    if (raw.gateway_fee) {
      domainEntity.gateway_fee = Number(raw.gateway_fee);
    }
    if (raw.net_amount) {
      domainEntity.net_amount = Number(raw.net_amount);
    }
    if (raw.total_refunded) {
      domainEntity.total_refunded = Number(raw.total_refunded);
    }
    if (raw.chargeback_amount) {
      domainEntity.chargeback_amount = Number(raw.chargeback_amount);
    }

    // Map checkout order relation if loaded
    if (raw.checkout_order) {
      domainEntity.checkout_order = raw.checkout_order;
    }

    // Map currency relation if loaded
    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
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
   * @returns CheckoutPaymentEntity for TypeORM
   */
  static toPersistence(domainEntity: CheckoutPayment): CheckoutPaymentEntity {
    const persistenceEntity = new CheckoutPaymentEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      checkout_order_id: domainEntity.checkout_order_id,
      sales_order_id: domainEntity.sales_order_id ?? null,
      transaction_number: domainEntity.transaction_number,
      payment_method_code: domainEntity.payment_method_code,
      payment_gateway: domainEntity.payment_gateway,
      gateway_transaction_id: domainEntity.gateway_transaction_id,
      gateway_reference_number: domainEntity.gateway_reference_number,
      gateway_checkout_url: domainEntity.gateway_checkout_url,
      gateway_response: domainEntity.gateway_response,
      payment_type: domainEntity.payment_type,
      installment_id: domainEntity.installment_id,
      amount: domainEntity.amount,
      gateway_fee: domainEntity.gateway_fee,
      net_amount: domainEntity.net_amount,
      currency_id: domainEntity.currency_id,
      status: domainEntity.status,
      failure_reason: domainEntity.failure_reason,
      failure_code: domainEntity.failure_code,
      initiated_at: domainEntity.initiated_at,
      paid_at: domainEntity.paid_at,
      expires_at: domainEntity.expires_at,
      total_refunded: domainEntity.total_refunded,
      refund_count: domainEntity.refund_count,
      last_refund_at: domainEntity.last_refund_at,
      is_fully_refunded: domainEntity.is_fully_refunded,
      chargeback_at: domainEntity.chargeback_at,
      chargeback_reason: domainEntity.chargeback_reason,
      chargeback_amount: domainEntity.chargeback_amount,
      metadata: (domainEntity as any).metadata ?? null,
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
