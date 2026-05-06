import { Subscription } from '@/subscriptions/domain/subscription';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';
import { SubscriptionPlanMapper } from '@/subscription-plans/persistence/mappers/subscription-plan.mapper';
// Note: User import kept for toPersistence method

export class SubscriptionMapper {
  static toDomain(raw: SubscriptionEntity): Subscription {
    const domainEntity = new Subscription();

    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.plan_id = raw.plan_id;
    domainEntity.subscription_number = raw.subscription_number;
    domainEntity.status = raw.status;
    domainEntity.start_date = raw.start_date;
    domainEntity.end_date = raw.end_date;
    domainEntity.next_billing_date = raw.next_billing_date;
    domainEntity.auto_renew = raw.auto_renew;
    domainEntity.cancelled_at = raw.cancelled_at;
    domainEntity.cancellation_reason = raw.cancellation_reason;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.user) {
      // Only include essential user fields for subscriptions screen
      domainEntity.user = {
        id: raw.user.id,
        email: raw.user.email,
        first_name: raw.user.first_name,
        middle_name: raw.user.middle_name ?? null,
        last_name: raw.user.last_name,
      };
    }

    if (raw.plan) {
      domainEntity.plan = SubscriptionPlanMapper.toDomain(raw.plan);
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

    if (raw.cancelled_by) {
      domainEntity.cancelled_by = getCauser(raw.cancelled_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<Subscription>,
  ): SubscriptionEntity {
    const persistenceEntity = new SubscriptionEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }

    if (domainEntity.plan_id !== undefined) {
      persistenceEntity.plan_id = domainEntity.plan_id;
    }

    if (domainEntity.subscription_number !== undefined) {
      persistenceEntity.subscription_number = domainEntity.subscription_number;
    }

    if (domainEntity.status !== undefined) {
      persistenceEntity.status = domainEntity.status;
    }

    if (domainEntity.start_date !== undefined) {
      persistenceEntity.start_date = domainEntity.start_date;
    }

    if (domainEntity.end_date !== undefined) {
      persistenceEntity.end_date = domainEntity.end_date ?? null;
    }

    if (domainEntity.next_billing_date !== undefined) {
      persistenceEntity.next_billing_date =
        domainEntity.next_billing_date ?? null;
    }

    if (domainEntity.auto_renew !== undefined) {
      persistenceEntity.auto_renew = domainEntity.auto_renew;
    }

    if (domainEntity.cancelled_at !== undefined) {
      persistenceEntity.cancelled_at = domainEntity.cancelled_at ?? null;
    }

    if (domainEntity.cancellation_reason !== undefined) {
      persistenceEntity.cancellation_reason =
        domainEntity.cancellation_reason ?? null;
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

    if (domainEntity.cancelled_by) {
      persistenceEntity.cancelled_by = UserMapper.toPersistence(
        domainEntity.cancelled_by as User,
      );
    }

    return persistenceEntity;
  }
}
