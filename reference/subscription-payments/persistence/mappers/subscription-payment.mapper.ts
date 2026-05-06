import { SubscriptionPayment } from '@/subscription-payments/domain/subscription-payment';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';
import { SubscriptionMapper } from '@/subscriptions/persistence/mappers/subscription.mapper';

export class SubscriptionPaymentMapper {
  static toDomain(raw: SubscriptionPaymentEntity): SubscriptionPayment {
    const domainEntity = new SubscriptionPayment();

    domainEntity.id = raw.id;
    domainEntity.subscription_id = raw.subscription_id;
    domainEntity.payment_number = raw.payment_number;
    domainEntity.amount = Number(raw.amount);
    domainEntity.payment_status = raw.payment_status;
    domainEntity.transaction_id = raw.transaction_id;
    domainEntity.payment_method = raw.payment_method;
    domainEntity.payment_reference_number = raw.payment_reference_number;
    domainEntity.payment_proof_url = raw.payment_proof_url;
    domainEntity.payment_proof_key = raw.payment_proof_key;
    domainEntity.billing_cycle_start = raw.billing_cycle_start;
    domainEntity.billing_cycle_end = raw.billing_cycle_end;
    domainEntity.due_date = raw.due_date;
    domainEntity.paid_at = raw.paid_at;
    domainEntity.submitted_at = raw.submitted_at;
    domainEntity.reviewed_at = raw.reviewed_at;
    domainEntity.reviewed_by = raw.reviewed_by;
    domainEntity.failure_reason = raw.failure_reason;
    domainEntity.retry_count = raw.retry_count;
    domainEntity.next_retry_at = raw.next_retry_at;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.subscription) {
      domainEntity.subscription = SubscriptionMapper.toDomain(raw.subscription);
    }

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
    domainEntity: Partial<SubscriptionPayment>,
  ): SubscriptionPaymentEntity {
    const persistenceEntity = new SubscriptionPaymentEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.subscription_id !== undefined) {
      persistenceEntity.subscription_id = domainEntity.subscription_id;
    }

    if (domainEntity.payment_number !== undefined) {
      persistenceEntity.payment_number = domainEntity.payment_number;
    }

    if (domainEntity.amount !== undefined) {
      persistenceEntity.amount = domainEntity.amount;
    }

    if (domainEntity.payment_status !== undefined) {
      persistenceEntity.payment_status = domainEntity.payment_status;
    }

    if (domainEntity.transaction_id !== undefined) {
      persistenceEntity.transaction_id = domainEntity.transaction_id ?? null;
    }

    if (domainEntity.payment_method !== undefined) {
      persistenceEntity.payment_method = domainEntity.payment_method ?? null;
    }

    if (domainEntity.payment_reference_number !== undefined) {
      persistenceEntity.payment_reference_number =
        domainEntity.payment_reference_number ?? null;
    }

    if (domainEntity.payment_proof_url !== undefined) {
      persistenceEntity.payment_proof_url =
        domainEntity.payment_proof_url ?? null;
    }

    if (domainEntity.payment_proof_key !== undefined) {
      persistenceEntity.payment_proof_key =
        domainEntity.payment_proof_key ?? null;
    }

    if (domainEntity.billing_cycle_start !== undefined) {
      persistenceEntity.billing_cycle_start = domainEntity.billing_cycle_start;
    }

    if (domainEntity.billing_cycle_end !== undefined) {
      persistenceEntity.billing_cycle_end = domainEntity.billing_cycle_end;
    }

    if (domainEntity.due_date !== undefined) {
      persistenceEntity.due_date = domainEntity.due_date;
    }

    if (domainEntity.paid_at !== undefined) {
      persistenceEntity.paid_at = domainEntity.paid_at ?? null;
    }

    if (domainEntity.submitted_at !== undefined) {
      persistenceEntity.submitted_at = domainEntity.submitted_at ?? null;
    }

    if (domainEntity.reviewed_at !== undefined) {
      persistenceEntity.reviewed_at = domainEntity.reviewed_at ?? null;
    }

    if (domainEntity.reviewed_by !== undefined) {
      persistenceEntity.reviewed_by = domainEntity.reviewed_by ?? null;
    }

    if (domainEntity.failure_reason !== undefined) {
      persistenceEntity.failure_reason = domainEntity.failure_reason ?? null;
    }

    if (domainEntity.retry_count !== undefined) {
      persistenceEntity.retry_count = domainEntity.retry_count;
    }

    if (domainEntity.next_retry_at !== undefined) {
      persistenceEntity.next_retry_at = domainEntity.next_retry_at ?? null;
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
