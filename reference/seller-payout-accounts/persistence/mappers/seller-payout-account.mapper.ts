import { SellerPayoutAccountEntity } from '@/seller-payout-accounts/persistence/entities/seller-payout-account.entity';
import { SellerPayoutAccount } from '@/seller-payout-accounts/domain/seller-payout-account';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Mapper for SellerPayoutAccount domain and persistence models.
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerPayoutAccountMapper {
  static toDomain(raw: SellerPayoutAccountEntity): SellerPayoutAccount {
    const domainEntity = new SellerPayoutAccount();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    if (raw.seller) {
      domainEntity.seller = raw.seller;
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: SellerPayoutAccount,
  ): SellerPayoutAccountEntity {
    const persistenceEntity = new SellerPayoutAccountEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      seller_id: domainEntity.seller_id,
      account_type: domainEntity.account_type,
      account_name: domainEntity.account_name,
      account_number: domainEntity.account_number,
      bank_name: domainEntity.bank_name,
      bank_code: domainEntity.bank_code,
      bank_branch: domainEntity.bank_branch,
      swift_code: domainEntity.swift_code,
      mobile_number: domainEntity.mobile_number,
      is_default: domainEntity.is_default,
      is_verified: domainEntity.is_verified,
      verified_at: domainEntity.verified_at,
      status: domainEntity.status,
    });

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

    return persistenceEntity;
  }
}
