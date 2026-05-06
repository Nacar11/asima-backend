import { SubscriptionPlan } from '@/subscription-plans/domain/subscription-plan';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class SubscriptionPlanMapper {
  static toDomain(raw: SubscriptionPlanEntity): SubscriptionPlan {
    const domainEntity = new SubscriptionPlan();

    domainEntity.id = raw.id;
    domainEntity.plan_name = raw.plan_name;
    domainEntity.plan_code = raw.plan_code;
    domainEntity.description = raw.description;
    domainEntity.plan_type = raw.plan_type;
    domainEntity.price = Number(raw.price);
    domainEntity.currency_id = raw.currency_id;
    domainEntity.billing_cycle = raw.billing_cycle;
    domainEntity.features = raw.features || [];
    domainEntity.max_sellers = raw.max_sellers;
    domainEntity.max_products = raw.max_products;
    domainEntity.max_services = raw.max_services;
    domainEntity.max_members = raw.max_members;
    domainEntity.commission_percent = Number(raw.commission_percent);
    domainEntity.display_order = raw.display_order;
    domainEntity.status = raw.status;
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
    domainEntity: Partial<SubscriptionPlan>,
  ): SubscriptionPlanEntity {
    const persistenceEntity = new SubscriptionPlanEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.plan_name !== undefined) {
      persistenceEntity.plan_name = domainEntity.plan_name;
    }

    if (domainEntity.plan_code !== undefined) {
      persistenceEntity.plan_code = domainEntity.plan_code;
    }

    if (domainEntity.description !== undefined) {
      persistenceEntity.description = domainEntity.description ?? null;
    }

    if (domainEntity.plan_type !== undefined) {
      persistenceEntity.plan_type = domainEntity.plan_type;
    }

    if (domainEntity.price !== undefined) {
      persistenceEntity.price = domainEntity.price;
    }

    if (domainEntity.currency_id !== undefined) {
      persistenceEntity.currency_id = domainEntity.currency_id ?? null;
    }

    if (domainEntity.billing_cycle !== undefined) {
      persistenceEntity.billing_cycle = domainEntity.billing_cycle;
    }

    if (domainEntity.features !== undefined) {
      persistenceEntity.features = domainEntity.features;
    }

    if (domainEntity.max_sellers !== undefined) {
      persistenceEntity.max_sellers = domainEntity.max_sellers;
    }

    if (domainEntity.max_products !== undefined) {
      persistenceEntity.max_products = domainEntity.max_products ?? null;
    }

    if (domainEntity.max_services !== undefined) {
      persistenceEntity.max_services = domainEntity.max_services ?? null;
    }

    if (domainEntity.max_members !== undefined) {
      persistenceEntity.max_members = domainEntity.max_members ?? null;
    }

    if (domainEntity.commission_percent !== undefined) {
      persistenceEntity.commission_percent = domainEntity.commission_percent;
    }

    if (domainEntity.display_order !== undefined) {
      persistenceEntity.display_order = domainEntity.display_order;
    }

    if (domainEntity.status !== undefined) {
      persistenceEntity.status = domainEntity.status;
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
