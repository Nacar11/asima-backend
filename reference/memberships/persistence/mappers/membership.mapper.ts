import { Membership } from '@/memberships/domain/membership';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPlan } from '@/memberships/domain/membership-plan';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class MembershipMapper {
  static toDomain(raw: MembershipEntity): Membership {
    const domainEntity = new Membership();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.membership_plan_id = raw.membership_plan_id;
    domainEntity.membership_plan_billing_period_id =
      raw.membership_plan_billing_period_id;
    if (raw.membership_plan) {
      const membershipPlan = new MembershipPlan();
      membershipPlan.id = raw.membership_plan.id;
      membershipPlan.plan_code = raw.membership_plan.plan_code;
      membershipPlan.plan_name = raw.membership_plan.plan_name;
      membershipPlan.is_active = raw.membership_plan.is_active;
      domainEntity.membership_plan = membershipPlan;
    }
    domainEntity.status = raw.status;
    domainEntity.starts_at = raw.starts_at;
    domainEntity.ends_at = raw.ends_at;
    domainEntity.grace_ends_at = raw.grace_ends_at;
    domainEntity.is_auto_renew_enabled = raw.is_auto_renew_enabled;
    domainEntity.cancelled_at = raw.cancelled_at;
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
  static toPersistence(domainEntity: Partial<Membership>): MembershipEntity {
    const persistenceEntity = new MembershipEntity();
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }
    if (domainEntity.membership_plan_id !== undefined) {
      persistenceEntity.membership_plan_id = domainEntity.membership_plan_id;
    }
    if (domainEntity.status !== undefined) {
      persistenceEntity.status = domainEntity.status;
    }
    if (domainEntity.membership_plan_billing_period_id !== undefined) {
      persistenceEntity.membership_plan_billing_period_id =
        domainEntity.membership_plan_billing_period_id;
    }
    if (domainEntity.starts_at !== undefined) {
      persistenceEntity.starts_at = domainEntity.starts_at;
    }
    if (domainEntity.ends_at !== undefined) {
      persistenceEntity.ends_at = domainEntity.ends_at;
    }
    if (domainEntity.grace_ends_at !== undefined) {
      persistenceEntity.grace_ends_at = domainEntity.grace_ends_at ?? null;
    }
    if (domainEntity.is_auto_renew_enabled !== undefined) {
      persistenceEntity.is_auto_renew_enabled =
        domainEntity.is_auto_renew_enabled;
    }
    if (domainEntity.cancelled_at !== undefined) {
      persistenceEntity.cancelled_at = domainEntity.cancelled_at ?? null;
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
