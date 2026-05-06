import { WithdrawalStatusEnum } from '@/wallets/enums/withdrawal-status.enum';

export class WalletWithdrawal {
  id: number;
  wallet_id: number;
  wallet_transaction_id: number | null;
  bank_account_id: number;
  amount: number;
  processing_fee: number;
  net_amount: number;
  status: WithdrawalStatusEnum;
  failure_reason: string | null;
  bank_reference_number: string | null;
  payout_provider: string | null;
  payout_reference: string | null;
  payout_status: string | null;
  payout_dispatched_at: Date | null;
  requested_at: Date;
  processed_at: Date | null;
  completed_at: Date | null;
  processed_by_id: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
