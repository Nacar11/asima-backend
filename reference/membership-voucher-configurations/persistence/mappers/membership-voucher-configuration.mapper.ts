import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class MembershipVoucherConfigurationMapper {
  static toDomain(
    raw: MembershipVoucherConfigurationEntity,
  ): MembershipVoucherConfiguration {
    const domainEntity = new MembershipVoucherConfiguration();
    domainEntity.id = raw.id;
    domainEntity.membership_plan_id = raw.membership_plan_id;
    domainEntity.voucher_id = raw.voucher_id;
    domainEntity.voucher_code = raw.voucher?.code ?? null;
    domainEntity.quantity = raw.quantity;
    domainEntity.is_active = raw.is_active;
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
    domainEntity: Partial<MembershipVoucherConfiguration>,
  ): MembershipVoucherConfigurationEntity {
    const persistenceEntity = new MembershipVoucherConfigurationEntity();
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.membership_plan_id !== undefined) {
      persistenceEntity.membership_plan_id = domainEntity.membership_plan_id;
    }
    if (domainEntity.voucher_id !== undefined) {
      persistenceEntity.voucher_id = domainEntity.voucher_id;
    }
    if (domainEntity.quantity !== undefined) {
      persistenceEntity.quantity = domainEntity.quantity;
    }
    if (domainEntity.is_active !== undefined) {
      persistenceEntity.is_active = domainEntity.is_active;
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
