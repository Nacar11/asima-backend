import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipBillingPeriod } from '../../domain/membership-billing-period';

/**
 * Mapper for membership billing period entity and domain objects.
 */
export class MembershipBillingPeriodMapper {
  /**
   * Convert entity to domain object.
   */
  static toDomain(
    entity: MembershipBillingPeriodEntity,
  ): MembershipBillingPeriod {
    const domain = new MembershipBillingPeriod();

    domain.id = entity.id;
    domain.period_code = entity.period_code;
    domain.period_name = entity.period_name;
    domain.duration_in_months = entity.duration_in_months;
    domain.duration_in_days = entity.duration_in_days;
    domain.sort_order = entity.sort_order;
    domain.is_active = entity.is_active;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    domain.deleted_at = entity.deleted_at;

    domain.created_by = entity.created_by
      ? typeof entity.created_by === 'object'
        ? entity.created_by.id
        : entity.created_by
      : null;

    domain.updated_by = entity.updated_by
      ? typeof entity.updated_by === 'object'
        ? entity.updated_by.id
        : entity.updated_by
      : null;

    domain.deleted_by = entity.deleted_by
      ? typeof entity.deleted_by === 'object'
        ? entity.deleted_by.id
        : entity.deleted_by
      : null;

    return domain;
  }

  /**
   * Convert domain object to entity.
   */
  static toPersistence(
    domain: MembershipBillingPeriod,
  ): MembershipBillingPeriodEntity {
    const entity = new MembershipBillingPeriodEntity();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __entity, ...assignable } = domain;
    Object.assign(entity, assignable);

    if (domain.id) {
      entity.id = domain.id;
    }

    return entity;
  }
}
