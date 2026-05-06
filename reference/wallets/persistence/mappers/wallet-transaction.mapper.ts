import { WalletTransaction } from '@/wallets/domain/wallet-transaction';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';

export class WalletTransactionMapper {
  static toDomain(raw: WalletTransactionEntity): WalletTransaction {
    const domain = new WalletTransaction();
    domain.id = raw.id;
    domain.wallet_id = raw.wallet_id;
    domain.transaction_number = raw.transaction_number;
    domain.transaction_type = raw.transaction_type as TransactionTypeEnum;
    domain.direction = raw.direction as TransactionDirectionEnum;
    domain.amount = Number(raw.amount);
    domain.balance_before = Number(raw.balance_before);
    domain.balance_after = Number(raw.balance_after);
    domain.description = raw.description;
    domain.reference_type = raw.reference_type;
    domain.reference_id = raw.reference_id;
    domain.status = raw.status as TransactionStatusEnum;
    domain.notes = raw.notes;
    domain.created_at = raw.created_at;
    return domain;
  }
}
