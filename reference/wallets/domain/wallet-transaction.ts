import { TransactionTypeEnum } from '@/wallets/enums/transaction-type.enum';
import { TransactionDirectionEnum } from '@/wallets/enums/transaction-direction.enum';
import { TransactionStatusEnum } from '@/wallets/enums/transaction-status.enum';

export class WalletTransaction {
  id: number;
  wallet_id: number;
  transaction_number: string;
  transaction_type: TransactionTypeEnum;
  direction: TransactionDirectionEnum;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_type: string | null;
  reference_id: number | null;
  status: TransactionStatusEnum;
  notes: string | null;
  created_at: Date;
}
