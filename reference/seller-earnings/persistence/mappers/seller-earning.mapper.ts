import { SellerEarningEntity } from '@/seller-earnings/persistence/entities/seller-earning.entity';
import { SellerEarning } from '@/seller-earnings/domain/seller-earning';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';

/**
 * Mapper for SellerEarning domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like seller, milestone, and currency.
 *
 * @version 1
 * @since 1.0.0
 */
export class SellerEarningMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns SellerEarning domain model
   */
  static toDomain(raw: SellerEarningEntity): SellerEarning {
    const domainEntity = new SellerEarning();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.gross_amount) {
      domainEntity.gross_amount = Number(raw.gross_amount);
    }
    if (raw.platform_fee) {
      domainEntity.platform_fee = Number(raw.platform_fee);
    }
    if (raw.net_amount) {
      domainEntity.net_amount = Number(raw.net_amount);
    }

    // Map seller relation if loaded
    if (raw.seller) {
      domainEntity.seller = raw.seller;
    }

    // Map milestone relation if loaded
    if (raw.milestone) {
      domainEntity.milestone = raw.milestone;
    }

    // Map currency relation if loaded
    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
    }

    // Map audit fields
    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    return domainEntity;
  }

  /**
   * Convert domain model to persistence entity.
   *
   * @param domainEntity - The domain model from business logic
   * @returns SellerEarningEntity for TypeORM
   */
  static toPersistence(domainEntity: SellerEarning): SellerEarningEntity {
    const persistenceEntity = new SellerEarningEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      seller_id: domainEntity.seller_id,
      source_type: domainEntity.source_type,
      source_id: domainEntity.source_id,
      milestone_id: domainEntity.milestone_id,
      gross_amount: domainEntity.gross_amount,
      platform_fee: domainEntity.platform_fee,
      net_amount: domainEntity.net_amount,
      currency_id: domainEntity.currency_id,
      status: domainEntity.status,
      available_at: domainEntity.available_at,
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
