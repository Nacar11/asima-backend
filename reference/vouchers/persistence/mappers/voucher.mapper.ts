import { Voucher } from '@/vouchers/domain/voucher';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class VoucherMapper {
  static toDomain(raw: VoucherEntity): Voucher {
    const domainEntity: Voucher = new Voucher();
    Object.assign(domainEntity, raw);
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }
    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }
    if (raw.discount_value !== undefined) {
      domainEntity.discount_value = Number(raw.discount_value);
    }
    if (raw.max_discount_cap !== null && raw.max_discount_cap !== undefined) {
      domainEntity.max_discount_cap = Number(raw.max_discount_cap);
    }
    if (raw.min_order_amount !== undefined) {
      domainEntity.min_order_amount = Number(raw.min_order_amount);
    }
    return domainEntity;
  }
  static toPersistence(domainEntity: Voucher): VoucherEntity {
    const persistenceEntity: VoucherEntity = new VoucherEntity();
    Object.assign(persistenceEntity, domainEntity);
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
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
