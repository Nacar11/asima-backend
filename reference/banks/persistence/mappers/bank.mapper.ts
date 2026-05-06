import { Bank } from '@/banks/domain/bank';
import { BankEntity } from '@/banks/persistence/entities/bank.entity';
import { getUser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for converting between BankEntity and Bank domain
 */
export class BankMapper {
  static toDomain(raw: BankEntity): Bank {
    const domainEntity = new Bank();
    domainEntity.id = raw.id;
    domainEntity.bank_code = raw.bank_code;
    domainEntity.bank_name = raw.bank_name;
    domainEntity.logo_url = raw.logo_url ?? null;
    domainEntity.is_active = raw.is_active;
    domainEntity.display_order = raw.display_order;
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

  static toPersistence(domainEntity: Partial<Bank>): Partial<BankEntity> {
    const persistenceEntity: Partial<BankEntity> = {};
    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.bank_code !== undefined) {
      persistenceEntity.bank_code = domainEntity.bank_code;
    }
    if (domainEntity.bank_name !== undefined) {
      persistenceEntity.bank_name = domainEntity.bank_name;
    }
    if (domainEntity.logo_url !== undefined) {
      persistenceEntity.logo_url = domainEntity.logo_url;
    }
    if (domainEntity.is_active !== undefined) {
      persistenceEntity.is_active = domainEntity.is_active;
    }
    if (domainEntity.display_order !== undefined) {
      persistenceEntity.display_order = domainEntity.display_order;
    }
    return persistenceEntity;
  }
}
