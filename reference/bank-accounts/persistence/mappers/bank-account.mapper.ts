import {
  BankAccount,
  BankAccountStatusEnum,
  BankAccountTypeEnum,
} from '@/bank-accounts/domain/bank-account';
import { BankAccountEntity } from '@/bank-accounts/persistence/entities/bank-account.entity';
import { getUser } from '@/utils/helpers/entity.helper';
import { BankMapper } from '@/banks/persistence/mappers/bank.mapper';

/**
 * Mapper for converting between BankAccountEntity and BankAccount domain
 */
export class BankAccountMapper {
  static toDomain(raw: BankAccountEntity): BankAccount {
    const domainEntity = new BankAccount();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.bank_id = raw.bank_id;
    if (raw.bank) {
      domainEntity.bank = BankMapper.toDomain(raw.bank);
    }
    domainEntity.account_holder_name = raw.account_holder_name;
    domainEntity.last_four = raw.last_four ?? '';
    domainEntity.account_type = raw.account_type as BankAccountTypeEnum | null;
    domainEntity.is_default = raw.is_default;
    domainEntity.status = raw.status as BankAccountStatusEnum;
    domainEntity.verified_at = raw.verified_at ?? null;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at ?? null;
    if (raw.created_by) {
      domainEntity.created_by = getUser(raw.created_by);
    }
    if (raw.updated_by) {
      domainEntity.updated_by = getUser(raw.updated_by);
    }
    if (raw.deleted_by) {
      domainEntity.deleted_by = getUser(raw.deleted_by);
    }
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<BankAccount>,
  ): Partial<BankAccountEntity> {
    const persistenceEntity: Partial<BankAccountEntity> = {};
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.user_id !== undefined) {
      persistenceEntity.user_id = domainEntity.user_id;
    }
    if (domainEntity.bank_id !== undefined) {
      persistenceEntity.bank_id = domainEntity.bank_id;
    }
    if (domainEntity.account_holder_name !== undefined) {
      persistenceEntity.account_holder_name = domainEntity.account_holder_name;
    }
    if (domainEntity.last_four !== undefined) {
      persistenceEntity.last_four = domainEntity.last_four;
    }
    if (domainEntity.account_type !== undefined) {
      persistenceEntity.account_type = domainEntity.account_type;
    }
    if (domainEntity.is_default !== undefined) {
      persistenceEntity.is_default = domainEntity.is_default;
    }
    if (domainEntity.status !== undefined) {
      persistenceEntity.status = domainEntity.status;
    }
    if (domainEntity.verified_at !== undefined) {
      persistenceEntity.verified_at = domainEntity.verified_at;
    }
    return persistenceEntity;
  }
}
