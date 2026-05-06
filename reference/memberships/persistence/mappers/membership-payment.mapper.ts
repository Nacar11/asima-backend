import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class MembershipPaymentMapper {
  static toDomain(raw: MembershipPaymentEntity): MembershipPayment {
    const domainEntity = new MembershipPayment();
    domainEntity.id = raw.id;
    domainEntity.membership_id = raw.membership_id;
    domainEntity.user_id = raw.user_id;
    domainEntity.membership_plan_billing_period_id =
      raw.membership_plan_billing_period_id;
    domainEntity.membership_plan_id = raw.membership_plan_id;
    domainEntity.membership_plan_code = raw.membership_plan_code;
    domainEntity.membership_plan_name = raw.membership_plan_name;
    domainEntity.billing_period_code = raw.billing_period_code;
    domainEntity.billing_duration_months = raw.billing_duration_months;
    domainEntity.base_monthly_price = Number(raw.base_monthly_price);
    domainEntity.discount_percentage = Number(raw.discount_percentage);
    domainEntity.amount = Number(raw.amount);
    domainEntity.currency = raw.currency;
    domainEntity.payment_status = raw.payment_status;
    domainEntity.provider = raw.provider;
    domainEntity.provider_reference = raw.provider_reference;
    domainEntity.gateway_reference_number = raw.gateway_reference_number;
    domainEntity.paid_at = raw.paid_at;
    domainEntity.payment_method_code = raw.payment_method_code;
    domainEntity.expires_at = raw.expires_at;
    domainEntity.payment_proof_url = raw.payment_proof_url;
    domainEntity.payment_proof_key = raw.payment_proof_key;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;
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
    domainEntity: Partial<MembershipPayment>,
  ): MembershipPaymentEntity {
    const persistenceEntity = new MembershipPaymentEntity();
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.membership_id !== undefined) {
      persistenceEntity.membership_id = domainEntity.membership_id;
    }
    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }
    if (domainEntity.membership_plan_billing_period_id !== undefined) {
      persistenceEntity.membership_plan_billing_period_id =
        domainEntity.membership_plan_billing_period_id;
    }
    if (domainEntity.membership_plan_id !== undefined) {
      persistenceEntity.membership_plan_id = domainEntity.membership_plan_id;
    }
    if (domainEntity.membership_plan_code !== undefined) {
      persistenceEntity.membership_plan_code =
        domainEntity.membership_plan_code;
    }
    if (domainEntity.membership_plan_name !== undefined) {
      persistenceEntity.membership_plan_name =
        domainEntity.membership_plan_name;
    }
    if (domainEntity.billing_period_code !== undefined) {
      persistenceEntity.billing_period_code = domainEntity.billing_period_code;
    }
    if (domainEntity.billing_duration_months !== undefined) {
      persistenceEntity.billing_duration_months =
        domainEntity.billing_duration_months;
    }
    if (domainEntity.base_monthly_price !== undefined) {
      persistenceEntity.base_monthly_price = domainEntity.base_monthly_price;
    }
    if (domainEntity.discount_percentage !== undefined) {
      persistenceEntity.discount_percentage = domainEntity.discount_percentage;
    }
    if (domainEntity.amount !== undefined) {
      persistenceEntity.amount = domainEntity.amount;
    }
    if (domainEntity.currency !== undefined) {
      persistenceEntity.currency = domainEntity.currency;
    }
    if (domainEntity.payment_status !== undefined) {
      persistenceEntity.payment_status = domainEntity.payment_status;
    }
    if (domainEntity.provider !== undefined) {
      persistenceEntity.provider = domainEntity.provider ?? null;
    }
    if (domainEntity.provider_reference !== undefined) {
      persistenceEntity.provider_reference =
        domainEntity.provider_reference ?? null;
    }
    if (domainEntity.gateway_reference_number !== undefined) {
      persistenceEntity.gateway_reference_number =
        domainEntity.gateway_reference_number ?? null;
    }
    if (domainEntity.paid_at !== undefined) {
      persistenceEntity.paid_at = domainEntity.paid_at ?? null;
    }
    if (domainEntity.payment_method_code !== undefined) {
      persistenceEntity.payment_method_code =
        domainEntity.payment_method_code ?? null;
    }
    if (domainEntity.expires_at !== undefined) {
      persistenceEntity.expires_at = domainEntity.expires_at ?? null;
    }
    if (domainEntity.payment_proof_url !== undefined) {
      persistenceEntity.payment_proof_url =
        domainEntity.payment_proof_url ?? null;
    }
    if (domainEntity.payment_proof_key !== undefined) {
      persistenceEntity.payment_proof_key =
        domainEntity.payment_proof_key ?? null;
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
