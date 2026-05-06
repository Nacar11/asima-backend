import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class MembershipVoucherGrantMapper {
  static toDomain(raw: MembershipVoucherGrantEntity): MembershipVoucherGrant {
    const domainEntity = new MembershipVoucherGrant();
    domainEntity.id = raw.id;
    domainEntity.membership_id = raw.membership_id;
    domainEntity.user_id = raw.user_id;
    domainEntity.membership_payment_id = raw.membership_payment_id;
    domainEntity.voucher_id = raw.voucher_id;
    domainEntity.voucher_code = raw.voucher_code;
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
    domainEntity: Partial<MembershipVoucherGrant>,
  ): MembershipVoucherGrantEntity {
    const persistenceEntity = new MembershipVoucherGrantEntity();
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.membership_id !== undefined) {
      persistenceEntity.membership_id = domainEntity.membership_id;
    }
    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }
    if (domainEntity.membership_payment_id !== undefined) {
      persistenceEntity.membership_payment_id =
        domainEntity.membership_payment_id;
    }
    if (domainEntity.voucher_id !== undefined) {
      persistenceEntity.voucher_id = domainEntity.voucher_id;
    }
    if (domainEntity.voucher_code !== undefined) {
      persistenceEntity.voucher_code = domainEntity.voucher_code;
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
