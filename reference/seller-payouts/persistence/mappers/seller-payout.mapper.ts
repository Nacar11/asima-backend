import { SellerPayoutEntity } from '@/seller-payouts/persistence/entities/seller-payout.entity';
import { SellerPayout } from '@/seller-payouts/domain/seller-payout';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';

/**
 * Mapper for SellerPayout domain and persistence models.
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerPayoutMapper {
  static toDomain(raw: SellerPayoutEntity): SellerPayout {
    const domainEntity = new SellerPayout();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    if (raw.amount) {
      domainEntity.amount = Number(raw.amount);
    }

    if (raw.seller) {
      domainEntity.seller = raw.seller;
    }

    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: SellerPayout): SellerPayoutEntity {
    const persistenceEntity = new SellerPayoutEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      seller_id: domainEntity.seller_id,
      payout_number: domainEntity.payout_number,
      amount: domainEntity.amount,
      currency_id: domainEntity.currency_id,
      payout_method: domainEntity.payout_method,
      bank_name: domainEntity.bank_name,
      account_number: domainEntity.account_number,
      account_name: domainEntity.account_name,
      status: domainEntity.status,
      processed_at: domainEntity.processed_at,
      failure_reason: domainEntity.failure_reason,
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
