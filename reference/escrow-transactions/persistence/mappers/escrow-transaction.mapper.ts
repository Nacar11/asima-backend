import { EscrowTransactionEntity } from '@/escrow-transactions/persistence/entities/escrow-transaction.entity';
import { EscrowTransaction } from '@/escrow-transactions/domain/escrow-transaction';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { CurrencyMapper } from '@/currencies/persistence/mappers/currency.mapper';

/**
 * Mapper for EscrowTransaction domain and persistence models.
 *
 * Handles bidirectional conversion between domain models (used in business logic)
 * and persistence entities (used by TypeORM). Includes mapping of related entities
 * like booking, milestone, currency, and user.
 *
 * @version 1
 * @since 1.0.0
 */
export class EscrowTransactionMapper {
  /**
   * Convert persistence entity to domain model.
   *
   * @param raw - The TypeORM entity from database
   * @returns EscrowTransaction domain model
   */
  static toDomain(raw: EscrowTransactionEntity): EscrowTransaction {
    const domainEntity = new EscrowTransaction();

    Object.assign(domainEntity, raw);
    delete (domainEntity as any).__entity;

    // Convert decimal fields to numbers
    if (raw.amount) {
      domainEntity.amount = Number(raw.amount);
    }

    // Map booking relation if loaded
    if (raw.booking) {
      domainEntity.booking = raw.booking;
    }

    // Map milestone relation if loaded
    if (raw.milestone) {
      domainEntity.milestone = raw.milestone;
    }

    // Map currency relation if loaded
    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
    }

    // Map released_to_user relation if loaded
    if (raw.released_to_user) {
      domainEntity.released_to_user = getCauser(raw.released_to_user);
    }

    // Map processed_by_user relation if loaded
    if (raw.processed_by_user) {
      domainEntity.processed_by_user = getCauser(raw.processed_by_user);
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
   * @returns EscrowTransactionEntity for TypeORM
   */
  static toPersistence(
    domainEntity: EscrowTransaction,
  ): EscrowTransactionEntity {
    const persistenceEntity = new EscrowTransactionEntity();

    Object.assign(persistenceEntity, {
      id: domainEntity.id,
      booking_id: domainEntity.booking_id,
      milestone_id: domainEntity.milestone_id,
      transaction_type: domainEntity.transaction_type,
      amount: domainEntity.amount,
      currency_id: domainEntity.currency_id,
      released_to: domainEntity.released_to,
      release_method: domainEntity.release_method,
      status: domainEntity.status,
      reference_number: domainEntity.reference_number,
      notes: domainEntity.notes,
      processed_by: domainEntity.processed_by,
      processed_at: domainEntity.processed_at,
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
