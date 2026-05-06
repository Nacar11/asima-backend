import { MembershipPlanEntity } from '../entities/membership-plan.entity';
import { MembershipPlan } from '../../domain/membership-plan';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';

/**
 * Mapper for membership plan entity and domain objects.
 */
export class MembershipPlanMapper {
  /**
   * Convert entity to domain object.
   */
  static toDomain(entity: MembershipPlanEntity): MembershipPlan {
    const domain = new MembershipPlan();
    const {
      membership_voucher_configurations: voucherConfigurations,
      ...baseEntity
    } = entity as MembershipPlanEntity & {
      membership_voucher_configurations?: MembershipVoucherConfigurationEntity[];
    };
    Object.assign(domain, baseEntity);
    if (Array.isArray(voucherConfigurations)) {
      domain.voucher_ids = voucherConfigurations
        .filter(
          (configuration: MembershipVoucherConfigurationEntity) =>
            !configuration.deleted_at,
        )
        .map(
          (configuration: MembershipVoucherConfigurationEntity) =>
            configuration.voucher_id,
        );
    }
    return domain;
  }

  /**
   * Convert domain object to entity.
   */
  static toPersistence(domain: MembershipPlan): MembershipPlanEntity {
    const entity = new MembershipPlanEntity();
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      voucher_ids,
      membership_voucher_configurations,
      monthly_price,
      plan_billing_periods,
      __entity,
      ...assignable
    } = domain;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    Object.assign(entity, assignable);

    if (domain.id) {
      entity.id = domain.id;
    }

    return entity;
  }
}
